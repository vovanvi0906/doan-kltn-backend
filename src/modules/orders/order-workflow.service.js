import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { ORDER_STATUS } from './constants/order-status';
import { OrderTransitionValidator } from './validators/order-transition.validator';

@Injectable()
@Dependencies(OrdersRepository)
export class OrderWorkflowService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
  }

  async getOrderOrThrow(orderId) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }
    return order;
  }

  /**
   * SEARCHING -> ASSIGNED (Gán thợ nhận đơn)
   */
  async assignWorker(orderId, workerProfileId, changedByUserId) {
    const order = await this.getOrderOrThrow(orderId);

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.ASSIGNED,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.ASSIGNED,
      {
        updateData: { workerId: workerProfileId },
        note: `Thợ đã nhận đơn hàng (Worker ID: ${workerProfileId})`,
        changedByUserId,
      },
    );
  }

  /**
   * ASSIGNED -> WORKER_ARRIVING (Thợ đang di chuyển đến)
   */
  async markWorkerArriving(orderId, workerProfileId, changedByUserId) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.workerId !== workerProfileId) {
      throw new ForbiddenException('Bạn không phải thợ được gán cho đơn hàng này');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.WORKER_ARRIVING,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.WORKER_ARRIVING,
      {
        note: 'Thợ đang di chuyển đến địa chỉ của khách hàng',
        changedByUserId,
      },
    );
  }

  /**
   * WORKER_ARRIVING -> ARRIVED (Thợ đã có mặt tại địa điểm)
   */
  async markArrived(orderId, workerProfileId, changedByUserId) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.workerId !== workerProfileId) {
      throw new ForbiddenException('Bạn không phải thợ được gán cho đơn hàng này');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.ARRIVED,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.ARRIVED,
      {
        note: 'Thợ đã có mặt tại địa chỉ khách hàng',
        changedByUserId,
      },
    );
  }

  /**
   * ARRIVED -> IN_PROGRESS (Thợ bắt đầu làm việc)
   * Face Verification là điều kiện kiểm tra nội bộ tại bước này nếu có tích hợp
   */
  async startWork(orderId, workerProfileId, changedByUserId, faceVerified = true) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.workerId !== workerProfileId) {
      throw new ForbiddenException('Bạn không phải thợ được gán cho đơn hàng này');
    }

    if (!faceVerified) {
      throw new BadRequestException('Cần hoàn thành xác thực khuôn mặt trước khi bắt đầu công việc');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.IN_PROGRESS,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.IN_PROGRESS,
      {
        updateData: { startedAt: new Date() },
        note: 'Thợ bắt đầu thực hiện công việc',
        changedByUserId,
      },
    );
  }

  /**
   * IN_PROGRESS -> AWAITING_CONFIRMATION (Thợ báo hoàn thành việc)
   */
  async finishWork(orderId, workerProfileId, changedByUserId) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.workerId !== workerProfileId) {
      throw new ForbiddenException('Bạn không phải thợ được gán cho đơn hàng này');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.AWAITING_CONFIRMATION,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.AWAITING_CONFIRMATION,
      {
        note: 'Thợ báo cáo hoàn thành công việc, chờ khách hàng nghiệm thu',
        changedByUserId,
      },
    );
  }

  /**
   * AWAITING_CONFIRMATION -> AWAITING_PAYMENT (Khách hàng nghiệm thu)
   */
  async confirmCompletion(orderId, customerProfileId, changedByUserId) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.customerId !== customerProfileId) {
      throw new ForbiddenException('Bạn không có quyền nghiệm thu đơn hàng này');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.AWAITING_PAYMENT,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.AWAITING_PAYMENT,
      {
        updateData: { completedAt: new Date() },
        note: 'Khách hàng xác nhận nghiệm thu công việc',
        changedByUserId,
      },
    );
  }

  /**
   * AWAITING_PAYMENT -> COMPLETED (Thanh toán hoàn tất)
   */
  async markPaidAndComplete(orderId, changedByUserId, note = 'Đã xác nhận thanh toán và hoàn tất đơn hàng') {
    const order = await this.getOrderOrThrow(orderId);

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.COMPLETED,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.COMPLETED,
      {
        note,
        changedByUserId,
      },
    );
  }

  /**
   * * -> CANCELLED (Hủy đơn hàng)
   */
  async cancel(orderId, reason, changedByUserId, userRole, profileId = null) {
    const order = await this.getOrderOrThrow(orderId);

    // Kiểm tra quyền hủy
    if (userRole === 'CUSTOMER' && profileId && order.customerId !== profileId) {
      throw new ForbiddenException('Bạn không thể hủy đơn hàng của người khác');
    }

    if (userRole === 'WORKER' && profileId && order.workerId !== profileId) {
      throw new ForbiddenException('Bạn không thể hủy đơn hàng không được gán cho bạn');
    }

    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.CANCELLED,
    );

    return this.ordersRepository.updateStatusWithHistory(
      orderId,
      ORDER_STATUS.CANCELLED,
      {
        updateData: {
          cancellationReason: reason,
          cancelledBy: changedByUserId,
        },
        note: `Hủy đơn hàng bởi ${userRole || 'Người dùng'}. Lý do: ${reason}`,
        changedByUserId,
      },
    );
  }
}
