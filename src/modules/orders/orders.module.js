import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { OrdersGateway } from './orders.gateway';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Module({
  imports: [PrismaModule, UsersModule, RedisModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderWorkflowService,
    OrdersGateway,
  ],
  exports: [
    OrdersService,
    OrdersRepository,
    OrderWorkflowService,
    OrdersGateway,
  ],
})
export class OrdersModule {}
