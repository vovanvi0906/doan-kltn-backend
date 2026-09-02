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
import { OrdersGateway } from './orders.gateway';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
@Dependencies(
  OrdersRepository,
  OrderWorkflowService,
  UsersRepository,
  PrismaService,
  OrdersGateway,
  RedisService
)
export class OrdersService {
  constructor(
    ordersRepository,
    orderWorkflowService,
    usersRepository,
    prisma,
    ordersGateway,
    redisService
  ) {
    this.ordersRepository = ordersRepository;
    this.orderWorkflowService = orderWorkflowService;
    this.usersRepository = usersRepository;
    this.prisma = prisma;
    this.ordersGateway = ordersGateway;
    this.redisService = redisService;
  }

  /**
   * Khởi tạo đơn dịch vụ mới (Khách hàng gọi POST /api/orders)
   * 1. Validate Service & Address
   * 2. Prisma $transaction tạo đơn mới (Trạng thái: SEARCHING)
   * 3. PostGIS Spatial Scan: Quét thợ Online trong bán kính 5km
   * 4. Redis Pub/Sub + WebSocket: Broadcast sự kiện 'order.new' đến thợ
   */
  async createOrder(userId, createOrderDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.customerProfile) {
      throw new BadRequestException('Chỉ tài khoản khách hàng mới có thể tạo đơn hàng');
    }

    const {
      serviceId,
      addressId,
      pickupLat,
      pickupLng,
      pickupAddress: customAddress,
      description,
      note,
      scheduledAt,
    } = createOrderDto;

    // 1. Kiểm tra tồn tại và tính khả dụng của Service
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Không tìm thấy dịch vụ với ID: ${serviceId}`);
    }
    if (!service.isActive) {
      throw new BadRequestException('Dịch vụ này hiện đang tạm ngưng cung cấp');
    }

    // 2. Xác định tọa độ và địa chỉ đón (Ưu tiên GPS truyền trực tiếp từ Google Maps)
    let lat = pickupLat ? parseFloat(pickupLat) : null;
    let lng = pickupLng ? parseFloat(pickupLng) : null;
    let finalPickupAddress = customAddress || 'Vị trí hiện tại của khách hàng';

    if (addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });
      if (address && address.customerId === user.customerProfile.id) {
        lat = address.latitude;
        lng = address.longitude;
        const addressParts = [address.street, address.ward, address.district, address.city].filter(Boolean);
        finalPickupAddress = addressParts.join(', ');
      }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Tọa độ đón (pickupLat, pickupLng) không hợp lệ');
    }

    // 3. Lấy giá khởi điểm từ Service.basePrice
    const totalPrice = service.basePrice;
    const orderNote = description || note || null;

    // 4. Prisma $transaction: Tạo đơn mới với trạng thái SEARCHING & ghi vết lịch sử
    const createdOrder = await this.ordersRepository.create(
      {
        customerId: user.customerProfile.id,
        serviceId: service.id,
        addressId: addressId || null,
        pickupAddress: finalPickupAddress,
        pickupLat: lat,
        pickupLng: lng,
        totalPrice,
        note: orderNote,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        initialStatus: 'SEARCHING',
        historyNote: 'Khách hàng tạo đơn và bắt đầu tìm kiếm thợ trong bán kính 5km',
      },
      userId
    );

    // 5. PostGIS Spatial Scan: Quét thợ Online trong bán kính 5km
    const nearbyWorkers = await this.ordersRepository.findNearbyOnlineWorkers(
      service.id,
      lat,
      lng,
      5 // 5km
    );

    console.log(
      `🎯 [Order Created #${createdOrder.id}] Tìm thấy ${nearbyWorkers.length} thợ online trong bán kính 5km`
    );

    // 6. Phát sóng thời gian thực (Redis Pub/Sub & WebSocket Broadcast)
    try {
      // Đẩy vào Redis Pub/Sub
      const redisClient = this.redisService.getClient();
      if (redisClient) {
        await redisClient.publish(
          'order:broadcast:new',
          JSON.stringify({
            order: createdOrder,
            workers: nearbyWorkers,
          })
        );
      }

      // WebSocket Gateway Emit trực tiếp
      this.ordersGateway.broadcastNewOrderToWorkers(nearbyWorkers, {
        ...createdOrder,
        service,
      });
    } catch (err) {
      console.warn('⚠️ [Realtime Broadcast Warning]:', err.message);
    }

    return {
      success: true,
      message: 'Khởi tạo đơn hàng thành công, hệ thống đang quét thợ xung quanh!',
      orderId: createdOrder.id,
      status: createdOrder.status,
      nearbyWorkersFound: nearbyWorkers.length,
      order: createdOrder,
    };
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
      user.workerProfile.id
    );

    return currentOrder || null;
  }

  /**
   * Thợ nhận đơn (Chuyển SEARCHING -> ASSIGNED)
   * Xử lý tranh chấp Race Condition và phát sóng WebSocket tới Khách hàng
   */
  async acceptOrder(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể nhận đơn hàng');
    }

    // 1. Gọi gán thợ nguyên tử (Atomic Assign) chống tranh chấp
    const assignedOrder = await this.orderWorkflowService.assignWorker(
      orderId,
      user.workerProfile.id,
      userId
    );

    // 2. Phát sự kiện WebSocket order.accepted tới Khách hàng và thông báo order.taken cho các thợ khác
    try {
      this.ordersGateway.emitOrderAccepted(assignedOrder, user.workerProfile);
    } catch (err) {
      console.warn('⚠️ [WebSocket Emit Warning]:', err.message);
    }

    return {
      success: true,
      message: 'Nhận đơn hàng thành công!',
      order: assignedOrder,
    };
  }

  async markArriving(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    const updated = await this.orderWorkflowService.markWorkerArriving(
      orderId,
      user.workerProfile.id,
      userId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'WORKER_ARRIVING');
    return updated;
  }

  async markArrived(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    const updated = await this.orderWorkflowService.markArrived(
      orderId,
      user.workerProfile.id,
      userId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'ARRIVED');
    return updated;
  }

  async startWork(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    const updated = await this.orderWorkflowService.startWork(
      orderId,
      user.workerProfile.id,
      userId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'IN_PROGRESS');
    return updated;
  }

  async finishWork(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.workerProfile) {
      throw new BadRequestException('Chỉ thợ mới có thể thực hiện thao tác này');
    }
    const updated = await this.orderWorkflowService.finishWork(
      orderId,
      user.workerProfile.id,
      userId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'AWAITING_CONFIRMATION');
    return updated;
  }

  async confirmCompletion(orderId, userId) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.customerProfile) {
      throw new BadRequestException('Chỉ khách hàng mới có thể nghiệm thu đơn hàng');
    }
    const updated = await this.orderWorkflowService.confirmCompletion(
      orderId,
      user.customerProfile.id,
      userId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'AWAITING_PAYMENT');
    return updated;
  }

  async completePayment(orderId, userId) {
    const updated = await this.orderWorkflowService.markPaidAndComplete(orderId, userId);
    this.ordersGateway.emitOrderStatusUpdated(updated, 'COMPLETED');
    return updated;
  }

  async cancelOrder(orderId, userId, role, reason) {
    const user = await this.usersRepository.findById(userId);
    let profileId = null;

    if (role === 'CUSTOMER') {
      profileId = user?.customerProfile?.id;
    } else if (role === 'WORKER') {
      profileId = user?.workerProfile?.id;
    }

    const updated = await this.orderWorkflowService.cancel(
      orderId,
      reason,
      userId,
      role,
      profileId
    );
    this.ordersGateway.emitOrderStatusUpdated(updated, 'CANCELLED');
    return updated;
  }
}
