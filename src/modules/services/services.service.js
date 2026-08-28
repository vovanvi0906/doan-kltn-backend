import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class ServicesService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getServices(categoryId) {
    const where = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    };

    return this.prisma.service.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceById(id) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    return service;
  }
}
