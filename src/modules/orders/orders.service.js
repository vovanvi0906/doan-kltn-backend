import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(OrdersRepository, OrderWorkflowService, UsersRepository, PrismaService)
export class OrdersService {
  constructor(ordersRepository, orderWorkflowService, usersRepository, prisma) {
    this.ordersRepository = ordersRepository;
    this.orderWorkflowService = orderWorkflowService;
    this.usersRepository = usersRepository;
    this.prisma = prisma;
  }

  async createOrder(userId, createOrderDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.customerProfile) {
      throw new BadRequestException('Chỉ tài khoản khách hàng mới có thể tạo đơn hàng');
    }

    const { serviceId, addressId, description, note, scheduledAt } = createOrderDto;

    // 1. Validate Service
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Không tìm thấy dịch vụ với ID: ${serviceId}`);
    }
    if (!service.isActive) {
      throw new BadRequestException('Dịch vụ này hiện đang tạm ngưng cung cấp');
    }

    // 2. Validate Address
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address) {
      throw new NotFoundException(`Không tìm thấy địa chỉ với ID: ${addressId}`);
    }
    if (address.customerId !== user.customerProfile.id) {
      throw new ForbiddenException('Địa chỉ này không thuộc sở hữu của bạn');
    }

    // 3. Format địa chỉ đón
    const addressParts = [address.street, address.ward, address.district, address.city]
      .filter(Boolean);
    const pickupAddress = addressParts.length > 0 ? addressParts.join(', ') : address.street;

    // 4. Lấy giá khởi điểm từ Service.basePrice
    const totalPrice = service.basePrice;
    const orderNote = description || note || null;

    // 5. Tạo Order với trạng thái SEARCHING
    return this.ordersRepository.create(
      {
        customerId: user.customerProfile.id,
        serviceId: service.id,
        addressId: address.id,
        pickupAddress,
        pickupLat: address.latitude,
        pickupLng: address.longitude,
        totalPrice,
        note: orderNote,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        initialStatus: 'SEARCHING',
        historyNote: 'Khách hàng tạo đơn và bắt đầu tìm kiếm thợ',
      },
      userId,
    );
  }

  async getMyOrders(userId, role) {
    const user = await this.usersRepository.findById(userId);
    if (role === 'CUSTOMER' && user?.customerProfile) {
      return this.ordersRepository.findByCustomerId(user.customerProfile.id);
    } else if (role === 'WORKER' && user?.workerProfile) {
      return this.ordersRepository.findByWorkerId(user.workerProfile.id);
    } else if (role === 'ADMIN') {
      return this.ordersRepository.findAll();
    }
    return [];
  }

  async getOrderById(orderId, userId, role) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }

    // Rào chắn bảo mật (Authorization)
    if (role === 'ADMIN') {
      return order;
    }

    const user = await this.usersRepository.findById(userId);

    if (role === 'CUSTOMER') {
      if (order.customerId !== user?.customerProfile?.id) {
        throw new ForbiddenException('Bạn không có quyền xem thông tin đơn hàng này');
      }
      return order;
    }

    if (role === 'WORKER') {
      if (order.workerId && order.workerId !== user?.workerProfile?.id) {
        throw new ForbiddenException('Bạn không có quyền xem thông tin đơn hàng này');
      }
      return order;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập đơn hàng này');
  }

  async getCurrentWorkerOrder(userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.workerProfile) {
      throw new BadRequestException('Chỉ tài khoản thợ mới có thể kiểm tra đơn đang nhận');
    }

    const currentOrder = await this.ordersRepository.findCurrentOrderForWorker(
      user.workerProfile.id,
    );

    return currentOrder || null;
  }

  async acceptOrder(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể nhận đơn hàng');
    }
    return this.orderWorkflowService.assignWorker(
      orderId,
      user.workerProfile.id,
      userId,
    );
  }

  async markArriving(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    return this.orderWorkflowService.markWorkerArriving(
      orderId,
      user.workerProfile.id,
      userId,
    );
  }

  async markArrived(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    return this.orderWorkflowService.markArrived(
      orderId,
      user.workerProfile.id,
      userId,
    );
  }

  async startWork(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    return this.orderWorkflowService.startWork(
      orderId,
      user.workerProfile.id,
      userId,
    );
  }

  async finishWork(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    return this.orderWorkflowService.finishWork(
      orderId,
      user.workerProfile.id,
      userId,
    );
  }

  async confirmCompletion(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.customerProfile) {
      throw new BadRequestException('Chỉ khách hàng mới có thể nghiệm thu đơn hàng');
    }
    return this.orderWorkflowService.confirmCompletion(
      orderId,
      user.customerProfile.id,
      userId,
    );
  }

  async completePayment(orderId, userId) {
    return this.orderWorkflowService.markPaidAndComplete(orderId, userId);
  }

  async cancelOrder(orderId, userId, role, reason) {
    const user = await this.usersRepository.findById(userId);
    let profileId = null;

    if (role === 'CUSTOMER') {
      profileId = user?.customerProfile?.id;
    } else if (role === 'WORKER') {
      profileId = user?.workerProfile?.id;
    }

    return this.orderWorkflowService.cancel(
      orderId,
      reason,
      userId,
      role,
      profileId,
    );
  }
}
