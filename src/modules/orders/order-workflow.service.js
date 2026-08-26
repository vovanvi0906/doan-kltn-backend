import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
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

  async assignWorker(orderId, workerId) {
    const order = await this.getOrderOrThrow(orderId);
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.MATCHED,
    );
    return this.ordersRepository.updateStatus(orderId, ORDER_STATUS.MATCHED, {
      workerId,
    });
  }

  async acceptOrder(orderId, workerId) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.workerId !== workerId) {
      throw new BadRequestException('Thợ không có quyền nhận đơn này');
    }
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.WORKER_ACCEPTED,
    );
    return this.ordersRepository.updateStatus(
      orderId,
      ORDER_STATUS.WORKER_ACCEPTED,
    );
  }

  async startWork(orderId, workerId) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.workerId !== workerId) {
      throw new BadRequestException('Thợ không có quyền thao tác đơn này');
    }
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.IN_PROGRESS,
    );
    return this.ordersRepository.updateStatus(
      orderId,
      ORDER_STATUS.IN_PROGRESS,
    );
  }

  async finishWork(orderId, workerId, afterImageUrl = null) {
    const order = await this.getOrderOrThrow(orderId);
    if (order.workerId !== workerId) {
      throw new BadRequestException('Thợ không có quyền thao tác đơn này');
    }
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.COMPLETED,
    );
    return this.ordersRepository.updateStatus(
      orderId,
      ORDER_STATUS.COMPLETED,
      afterImageUrl ? { afterImageUrl } : {},
    );
  }

  async confirmPayment(orderId) {
    const order = await this.getOrderOrThrow(orderId);
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.PAYMENT_CONFIRMED,
    );
    return this.ordersRepository.updateStatus(
      orderId,
      ORDER_STATUS.PAYMENT_CONFIRMED,
    );
  }

  async closeOrder(orderId) {
    const order = await this.getOrderOrThrow(orderId);
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.CLOSED,
    );
    return this.ordersRepository.updateStatus(orderId, ORDER_STATUS.CLOSED);
  }

  async cancelOrder(orderId, reason = '') {
    const order = await this.getOrderOrThrow(orderId);
    OrderTransitionValidator.validateTransition(
      order.status,
      ORDER_STATUS.CANCELLED,
    );
    return this.ordersRepository.updateStatus(orderId, ORDER_STATUS.CANCELLED);
  }
}
