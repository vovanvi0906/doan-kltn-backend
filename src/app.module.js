import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [HealthModule, PrismaModule, RedisModule, UsersModule],
})
export class AppModule {}