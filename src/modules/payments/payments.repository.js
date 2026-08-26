import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class PaymentsRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findByOrderId(orderId) {
    return this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });
  }

  async createPaymentWithSplit(paymentData) {
    const {
      orderId,
      amount,
      commissionAmount,
      workerPayout,
      method,
      workerId,
    } = paymentData;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount,
          commissionAmount,
          workerPayout,
          method: method || 'VNPAY',
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      if (workerId) {
        // Cộng tiền vào ví thợ
        await tx.workerProfile.update({
          where: { id: workerId },
          data: {
            walletBalance: { increment: workerPayout },
          },
        });

        await tx.walletTransaction.create({
          data: {
            workerId,
            orderId,
            amount: workerPayout,
            type: 'CREDIT',
          },
        });
      }

      return payment;
    });
  }
}
