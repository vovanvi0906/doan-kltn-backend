import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class AdminService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ==========================================
  // SERVICE CATEGORIES
  // ==========================================

  async createCategory(dto) {
    const { name, description, iconUrl, isActive } = dto;
    return this.prisma.serviceCategory.create({
      data: {
        name,
        description: description || null,
        iconUrl: iconUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
  }

  async updateCategory(id, dto) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục dịch vụ');
    }

    const { name, description, iconUrl, isActive } = dto;
    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  // ==========================================
  // SERVICES
  // ==========================================

  async createService(dto) {
    const {
      categoryId,
      name,
      description,
      basePrice,
      unit,
      estimatedDurationMin,
      isActive,
    } = dto;

    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException('Danh mục dịch vụ (categoryId) không tồn tại');
    }

    return this.prisma.service.create({
      data: {
        categoryId,
        name,
        description: description || null,
        basePrice,
        unit: unit || null,
        estimatedDurationMin: estimatedDurationMin || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true,
      },
    });
  }

  async updateService(id, dto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const {
      categoryId,
      name,
      description,
      basePrice,
      unit,
      estimatedDurationMin,
      isActive,
    } = dto;

    if (categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new BadRequestException('Danh mục dịch vụ (categoryId) không tồn tại');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice }),
        ...(unit !== undefined && { unit }),
        ...(estimatedDurationMin !== undefined && { estimatedDurationMin }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: true,
      },
    });
  }

  // ==========================================
  // WORKER APPROVAL MANAGEMENT
  // ==========================================

  async getWorkers(status) {
    const where = status ? { approvalStatus: status } : { approvalStatus: 'PENDING' };

    return this.prisma.workerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        workerServices: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveWorker(id) {
    const worker = await this.prisma.workerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy hồ sơ thợ');
    }

    const updatedWorker = await this.prisma.workerProfile.update({
      where: { id: worker.id },
      data: {
        approvalStatus: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Phê duyệt hồ sơ thợ thành công',
      worker: updatedWorker,
    };
  }

  async rejectWorker(id) {
    const worker = await this.prisma.workerProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy hồ sơ thợ');
    }

    const updatedWorker = await this.prisma.workerProfile.update({
      where: { id: worker.id },
      data: {
        approvalStatus: 'REJECTED',
        isOnline: false, // Tat trang thai online khi bi tu choi
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Từ chối hồ sơ thợ thành công',
      worker: updatedWorker,
    };
  }
}
