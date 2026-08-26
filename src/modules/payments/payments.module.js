import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { PaymentClient } from '../../infrastructure/external/payment/payment.client';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, PaymentClient],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
