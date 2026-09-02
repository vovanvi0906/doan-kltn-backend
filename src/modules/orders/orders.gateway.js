import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger, Dependencies, Bind } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
@Dependencies(RedisService)
export class OrdersGateway {
  @WebSocketServer()
  server;

  constructor(redisService) {
    this.redisService = redisService;
    this.logger = new Logger(OrdersGateway.name);
  }

  afterInit(server) {
    this.logger.log('📡 [WebSocket Gateway] OrdersGateway đã khởi tạo thành công');

    // Thiết lập Redis Subscriber để lắng nghe sự kiện broadcast đa tiến trình
    try {
      const redisClient = this.redisService.getClient();
      if (redisClient) {
        const subClient = redisClient.duplicate();
        subClient.subscribe('order:broadcast:new', 'order:broadcast:status');
        subClient.on('message', (channel, message) => {
          try {
            const payload = JSON.parse(message);
            if (channel === 'order:broadcast:new') {
              this.handleRedisNewOrder(payload);
            } else if (channel === 'order:broadcast:status') {
              this.handleRedisStatusUpdate(payload);
            }
          } catch (e) {
            this.logger.error('Lỗi parse message từ Redis PubSub:', e);
          }
        });
        this.logger.log('⚡ [Redis PubSub] Đã đăng ký kênh order:broadcast:new & status');
      }
    } catch (err) {
      this.logger.warn('⚠️ [Redis PubSub Warning] Không thể kết nối subClient:', err.message);
    }
  }

  handleConnection(client) {
    this.logger.log(`🟢 [Socket Connected] Client ID: ${client.id}`);
  }

  handleDisconnect(client) {
    this.logger.log(`🔴 [Socket Disconnected] Client ID: ${client.id}`);
  }

  /**
   * Client gửi yêu cầu tham gia room định danh (Khách hàng hoặc Thợ)
   */
  @SubscribeMessage('join_room')
  @Bind(ConnectedSocket(), MessageBody())
  handleJoinRoom(client, data) {
    const { role, profileId, userId } = data || {};
    if (role === 'WORKER' && profileId) {
      const room = `worker:${profileId}`;
      client.join(room);
      this.logger.log(`🛠️ Client ${client.id} đã join room Thợ: ${room}`);
      return { status: 'ok', room };
    } else if (role === 'CUSTOMER' && profileId) {
      const room = `customer:${profileId}`;
      client.join(room);
      this.logger.log(`👤 Client ${client.id} đã join room Khách: ${room}`);
      return { status: 'ok', room };
    } else if (userId) {
      const room = `user:${userId}`;
      client.join(room);
      return { status: 'ok', room };
    }
    return { status: 'error', message: 'Thiếu thông tin profileId' };
  }

  /**
   * Phát sự kiện order.new đến các thợ lân cận
   */
  broadcastNewOrderToWorkers(workers, orderData) {
    if (!workers || workers.length === 0) {
      this.logger.log(`ℹ️ Không có thợ online nào trong phạm vi quét cho đơn ${orderData.id}`);
      return;
    }

    this.logger.log(
      `📡 [Emit order.new] Bắn tín hiệu đơn ${orderData.id} tới ${workers.length} thợ lân cận`
    );

    workers.forEach((worker) => {
      const room = `worker:${worker.id}`;
      if (this.server) {
        this.server.to(room).emit('order.new', {
          orderId: orderData.id,
          service: orderData.service,
          pickupAddress: orderData.pickupAddress,
          pickupLat: orderData.pickupLat,
          pickupLng: orderData.pickupLng,
          totalPrice: orderData.totalPrice,
          note: orderData.note,
          distanceKm: worker.distanceKm || '1.2',
          countdownSeconds: 30,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Đồng thời phát lên kênh toàn cục cho các client đang mở demo
    if (this.server) {
      this.server.emit('order.new.public', {
        orderId: orderData.id,
        serviceName: orderData.service?.name,
        totalPrice: orderData.totalPrice,
      });
    }
  }

  /**
   * Phát sự kiện khi thợ nhận đơn (order.accepted)
   */
  emitOrderAccepted(order, workerProfile) {
    this.logger.log(`🎉 [Emit order.accepted] Đơn ${order.id} đã được nhận bởi thợ ${workerProfile?.id}`);

    // Bắn cho Khách hàng sở hữu đơn
    if (this.server && order.customerId) {
      this.server.to(`customer:${order.customerId}`).emit('order.accepted', {
        orderId: order.id,
        status: 'ASSIGNED',
        worker: {
          id: workerProfile?.id,
          fullName: workerProfile?.fullName || 'Thợ chuyên nghiệp',
          phone: workerProfile?.user?.phone,
          avatarUrl: workerProfile?.avatarUrl,
          ratingAvg: workerProfile?.ratingAvg,
          currentLat: workerProfile?.currentLat,
          currentLng: workerProfile?.currentLng,
        },
        message: 'Thợ đã nhận đơn và đang chuẩn bị di chuyển!',
      });
    }

    // Bắn thông báo order.taken cho các thợ khác để tắt popup
    if (this.server) {
      this.server.emit('order.taken', {
        orderId: order.id,
        assignedWorkerId: workerProfile?.id,
        message: 'Đơn hàng đã có thợ khác nhận',
      });
    }
  }

  /**
   * Phát cập nhật trạng thái đơn hàng bất kỳ
   */
  emitOrderStatusUpdated(order, newStatus) {
    if (this.server) {
      this.server.emit(`order:${order.id}:status`, {
        orderId: order.id,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  handleRedisNewOrder(payload) {
    if (this.server) {
      this.broadcastNewOrderToWorkers(payload.workers, payload.order);
    }
  }

  handleRedisStatusUpdate(payload) {
    if (this.server) {
      this.emitOrderStatusUpdated(payload.order, payload.newStatus);
    }
  }
}
