import {
  Injectable,
  Dependencies,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { PaymentClient } from '../../infrastructure/external/payment/payment.client';
import { OrdersRepository } from '../orders/orders.repository';
import { OrderWorkflowService } from '../orders/order-workflow.service';

@Injectable()
@Dependencies(
  PaymentsRepository,
  PaymentClient,
  OrdersRepository,
  OrderWorkflowService,
)
export class PaymentsService {
  constructor(
    paymentsRepository,
    paymentClient,
    ordersRepository,
    orderWorkflowService,
  ) {
    this.paymentsRepository = paymentsRepository;
    this.paymentClient = paymentClient;
    this.ordersRepository = ordersRepository;
    this.orderWorkflowService = orderWorkflowService;
  }

  async createPaymentUrl(createPaymentDto) {
    const { orderId, amount, method } = createPaymentDto;
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return this.paymentClient.createPaymentUrl({
      orderId,
      amount,
      method: method || 'VNPAY',
    });
  }

  async processPaymentSuccess(orderId, amount, method = 'VNPAY') {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const commissionRate = order.commissionPct || 0.15;
    const commissionAmount = Number(amount) * commissionRate;
    const workerPayout = Number(amount) - commissionAmount;

    const payment = await this.paymentsRepository.createPaymentWithSplit({
      orderId,
      amount,
      commissionAmount,
      workerPayout,
      method,
      workerId: order.workerId,
    });

    await this.orderWorkflowService.confirmPayment(orderId);

    return payment;
  }

  async getPaymentByOrderId(orderId) {
    return this.paymentsRepository.findByOrderId(orderId);
  }
}
