import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
@Dependencies(OrdersRepository, OrderWorkflowService, UsersRepository)
export class OrdersService {
  constructor(ordersRepository, orderWorkflowService, usersRepository) {
    this.ordersRepository = ordersRepository;
    this.orderWorkflowService = orderWorkflowService;
    this.usersRepository = usersRepository;
  }

  async createOrder(userId, createOrderDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.customerProfile) {
      throw new BadRequestException('Chỉ khách hàng mới có thể tạo đơn');
    }

    return this.ordersRepository.create({
      customerId: user.customerProfile.id,
      serviceId: createOrderDto.serviceId,
      pickupLat: createOrderDto.pickupLat,
      pickupLng: createOrderDto.pickupLng,
      beforeImageUrl: createOrderDto.beforeImageUrl || null,
      price: createOrderDto.price || null,
      status: 'PENDING',
    });
  }

  async getOrderById(orderId) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async getMyOrders(userId, role) {
    const user = await this.usersRepository.findById(userId);
    if (role === 'CUSTOMER' && user?.customerProfile) {
      return this.ordersRepository.findByCustomerId(user.customerProfile.id);
    } else if (role === 'WORKER' && user?.workerProfile) {
      return this.ordersRepository.findByWorkerId(user.workerProfile.id);
    }
    return [];
  }

  async acceptOrder(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể nhận đơn');
    }
    return this.orderWorkflowService.acceptOrder(
      orderId,
      user.workerProfile.id,
    );
  }

  async startWork(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thao tác');
    }
    return this.orderWorkflowService.startWork(
      orderId,
      user.workerProfile.id,
    );
  }

  async finishWork(orderId, userId, afterImageUrl) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể hoàn thành việc');
    }
    return this.orderWorkflowService.finishWork(
      orderId,
      user.workerProfile.id,
      afterImageUrl,
    );
  }

  async cancelOrder(orderId, reason) {
    return this.orderWorkflowService.cancelOrder(orderId, reason);
  }
}
