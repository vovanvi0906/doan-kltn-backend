import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
