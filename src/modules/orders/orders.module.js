import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrderWorkflowService],
  exports: [OrdersService, OrdersRepository, OrderWorkflowService],
})
export class OrdersModule {}
