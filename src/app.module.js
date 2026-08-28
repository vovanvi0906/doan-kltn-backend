import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ServicesModule } from './modules/services/services.module';
import { AdminModule } from './modules/admin/admin.module';
import { WorkersModule } from './modules/workers/workers.module';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    ServicesModule,
    AdminModule,
    WorkersModule,
  ],
})
export class AppModule {}