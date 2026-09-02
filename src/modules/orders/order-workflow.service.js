import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { ORDER_STATUS } from './constants/order-status';
import { OrderTransitionValidator } from './validators/order-transition.validator';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(OrdersRepository, PrismaService)
export class OrderWorkflowService {
  constructor(ordersRepository, prisma) {
    this.ordersRepository = ordersRepository;
    this.prisma = prisma;
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
   * XỬ LÝ TRANH CHẤP NGUYÊN TỬ (Atomic Lock & Conflict 409)
   * Đảm bảo khi 3 thợ cùng bấm nhận đơn 1 mili-giây, chỉ duy nhất 1 thợ thành công (200), 2 thợ còn lại nhận 409 Conflict.
   */
  async assignWorker(orderId, workerProfileId, changedByUserId) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Thực hiện Atomic Update có điều kiện WHERE id = orderId AND status = 'SEARCHING'
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'SEARCHING',
        },
        data: {
          status: 'ASSIGNED',
          workerId: workerProfileId,
        },
      });

      // 2. Nếu số dòng update = 0 nghĩa là đơn đã bị thợ khác nhận trước hoặc không còn khả dụng
      if (updateResult.count === 0) {
        const existingOrder = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (!existingOrder) {
          throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
        }

        throw new ConflictException(
          'Đơn hàng đã có thợ khác nhận hoặc không còn ở trạng thái chờ nhận!'
        );
      }

      // 3. Ghi vết lịch sử trạng thái
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          note: `Thợ đã nhận đơn hàng thành công (Worker ID: ${workerProfileId})`,
          changedBy: changedByUserId,
        },
      });

      // 4. Lấy đầy đủ thông tin đơn hàng đã gán
      const assignedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          worker: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          service: true,
          address: true,
        },
      });

      return assignedOrder;
    });
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
