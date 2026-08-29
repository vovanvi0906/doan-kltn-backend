import { Injectable, Dependencies } from '@nestjs/common';
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
