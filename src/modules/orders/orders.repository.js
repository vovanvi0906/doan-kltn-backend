import { Injectable, Dependencies } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class OrdersRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
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
                role: true,
                status: true,
              },
            },
          },
        },
        service: {
          include: {
            category: true,
          },
        },
        address: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        images: true,
        payment: true,
        review: true,
      },
    });
  }

  async findByCustomerId(customerId) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByWorkerId(workerId) {
    return this.prisma.order.findMany({
      where: { workerId },
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
        service: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCurrentOrderForWorker(workerId) {
    return this.prisma.order.findFirst({
      where: {
        workerId,
        status: {
          in: [
            'ASSIGNED',
            'WORKER_ARRIVING',
            'ARRIVED',
            'IN_PROGRESS',
            'AWAITING_CONFIRMATION',
            'AWAITING_PAYMENT',
          ],
        },
      },
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
        service: {
          include: {
            category: true,
          },
        },
        address: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Quét không gian tìm thợ trực tuyến (Online) trong bán kính radiusKm (mặc định 5km)
   * Sử dụng công thức Haversine/PostGIS tính khoảng cách địa lý
   */
  async findNearbyOnlineWorkers(serviceId, lat, lng, radiusKm = 5) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseFloat(radiusKm);

    try {
      // Query raw SQL sử dụng hàm tính khoảng cách địa lý Haversine
      const workers = await this.prisma.$queryRaw`
        SELECT 
          wp.id,
          wp."userId",
          wp."fullName",
          wp."avatarUrl",
          wp."currentLat",
          wp."currentLng",
          wp."ratingAvg",
          wp."totalReviews",
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${parsedLat})) * cos(radians(wp."currentLat")) *
              cos(radians(wp."currentLng") - radians(${parsedLng})) +
              sin(radians(${parsedLat})) * sin(radians(wp."currentLat"))
            ))
          )) AS distance_km
        FROM "worker_profiles" wp
        WHERE wp."isOnline" = true
          AND wp."currentLat" IS NOT NULL
          AND wp."currentLng" IS NOT NULL
          AND (6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${parsedLat})) * cos(radians(wp."currentLat")) *
              cos(radians(wp."currentLng") - radians(${parsedLng})) +
              sin(radians(${parsedLat})) * sin(radians(wp."currentLat"))
            ))
          )) <= ${parsedRadius}
        ORDER BY distance_km ASC
        LIMIT 20;
      `;

      return workers.map((w) => ({
        ...w,
        distanceKm: parseFloat(w.distance_km || 0).toFixed(2),
      }));
    } catch (err) {
      console.warn('⚠️ [PostGIS Scan Warning]:', err.message);
      // Fallback query nếu có lỗi cấu hình hàm toán học
      return this.prisma.workerProfile.findMany({
        where: {
          isOnline: true,
          currentLat: { not: null },
          currentLng: { not: null },
        },
        take: 10,
      });
    }
  }

  async create(orderData, changedByUserId = null) {
    const { initialStatus = 'SEARCHING', historyNote = 'Khởi tạo đơn hàng mới', ...restData } = orderData;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...restData,
          status: initialStatus,
          statusHistory: {
            create: {
              status: initialStatus,
              note: historyNote,
              changedBy: changedByUserId,
            },
          },
        },
        include: {
          customer: true,
          service: true,
          address: true,
          statusHistory: true,
        },
      });

      return order;
    });
  }

  async updateStatusWithHistory(orderId, newStatus, { updateData = {}, note = null, changedByUserId = null } = {}) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...updateData,
        },
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
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: note || `Chuyển trạng thái sang ${newStatus}`,
          changedBy: changedByUserId,
        },
      });

      return order;
    });
  }
}
