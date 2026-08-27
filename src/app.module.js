import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [HealthModule, PrismaModule, RedisModule],
})
export class AppModule {}