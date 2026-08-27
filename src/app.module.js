import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';

@Module({
  imports: [HealthModule, PrismaModule],
})
export class AppModule { }