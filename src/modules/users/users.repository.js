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

  async create(data) {
    const { role, ...rest } = data;
    return this.prisma.user.create({
      data: {
        ...rest,
        role: role || 'CUSTOMER',
        ...(role === 'WORKER'
          ? { workerProfile: { create: {} } }
          : { customerProfile: { create: {} } }),
      },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async update(id, data) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });
  }

  async updateWorkerLocation(userId, lat, lng) {
    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        currentLat: lat,
        currentLng: lng,
      },
    });
  }

  async findNearbyWorkers(lat, lng, radiusKm = 10) {
    return this.prisma.workerProfile.findMany({
      where: {
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: true,
      },
    });
  }
}
