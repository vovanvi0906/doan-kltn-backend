import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class UsersRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async create(userData) {
    return this.prisma.user.create({
      data: userData,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updateStatus(id, status) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }
}
