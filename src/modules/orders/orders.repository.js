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
        customer: { include: { user: true } },
        worker: { include: { user: true } },
        service: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        payment: true,
        review: true,
        dispute: true,
      },
    });
  }

  async findByCustomerId(customerId) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        worker: { include: { user: true } },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByWorkerId(workerId) {
    return this.prisma.order.findMany({
      where: { workerId },
      include: {
        customer: { include: { user: true } },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data) {
    return this.prisma.order.create({
      data: {
        ...data,
        statusHistory: {
          create: {
            status: data.status || 'PENDING',
          },
        },
      },
      include: {
        customer: true,
        service: true,
      },
    });
  }

  async updateStatus(orderId, newStatus, additionalData = {}) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...additionalData,
        },
        include: {
          customer: true,
          worker: true,
          service: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
        },
      });

      return order;
    });
  }

  async assignWorker(orderId, workerId) {
    return this.updateStatus(orderId, 'MATCHED', { workerId });
  }
}
