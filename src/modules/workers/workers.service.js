import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class WorkersService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getProfile(userId) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        workerServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
        wallet: true,
      },
    });

    if (!workerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin thợ');
    }

    return workerProfile;
  }

  async updateProfile(userId, dto) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy thông tin thợ');
    }

    const {
      fullName,
      avatarUrl,
      bio,
      experienceYears,
      idCardNumber,
      skills,
      currentLat,
      currentLng,
    } = dto;

    return this.prisma.workerProfile.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(idCardNumber !== undefined && { idCardNumber }),
        ...(skills !== undefined && { skills }),
        ...(currentLat !== undefined && { currentLat: parseFloat(currentLat) }),
        ...(currentLng !== undefined && { currentLng: parseFloat(currentLng) }),
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
  }

  async updateServices(userId, dto) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy thông tin thợ');
    }

    const { serviceIds } = dto;

    // Kiem tra cac dich vu co ton tai trong Service table khong
    const existingServices = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
    });

    if (existingServices.length !== serviceIds.length) {
      throw new BadRequestException('Một hoặc nhiều dịch vụ đã chọn không tồn tại hoặc đã ngưng hoạt động');
    }

    // Xoa mapping cu va insert mapping moi trong transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.workerService.deleteMany({
        where: { workerId: worker.id },
      });

      if (serviceIds.length > 0) {
        await tx.workerService.createMany({
          data: serviceIds.map((serviceId) => ({
            workerId: worker.id,
            serviceId,
            isAvailable: true,
          })),
        });
      }
    });

    return this.getProfile(userId);
  }

  async submitApproval(userId) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        workerServices: true,
      },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy thông tin thợ');
    }

    if (worker.approvalStatus === 'PENDING') {
      throw new BadRequestException('Hồ sơ của bạn đang trong trạng thái chờ xét duyệt');
    }

    if (worker.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Hồ sơ của bạn đã được phê duyệt trước đó');
    }

    // Kiem tra dieu kien nop duyet: Phai co ho ten, CCCD va it nhat 1 dich vu
    if (!worker.fullName || !worker.idCardNumber) {
      throw new BadRequestException('Vui lòng cập nhật đầy đủ Họ tên và Số CCCD/CMND trước khi nộp duyệt');
    }

    if (!worker.workerServices || worker.workerServices.length === 0) {
      throw new BadRequestException('Vui lòng đăng ký ít nhất 1 dịch vụ cung cấp trước khi nộp duyệt');
    }

    const updatedWorker = await this.prisma.workerProfile.update({
      where: { id: worker.id },
      data: {
        approvalStatus: 'PENDING',
      },
    });

    return {
      message: 'Nộp hồ sơ xét duyệt thành công. Vui lòng chờ quản trị viên phê duyệt.',
      approvalStatus: updatedWorker.approvalStatus,
    };
  }

  async updateAvailability(userId, dto) {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        workerServices: true,
      },
    });

    if (!worker) {
      throw new NotFoundException('Không tìm thấy thông tin thợ');
    }

    const { isOnline } = dto;

    if (isOnline === true) {
      // 1. User phai ACTIVE
      if (worker.user.status !== 'ACTIVE') {
        throw new BadRequestException('Tài khoản của bạn hiện đang bị khóa hoặc chưa kích hoạt');
      }

      // 2. Worker phai APPROVED
      if (worker.approvalStatus !== 'APPROVED') {
        throw new BadRequestException('Hồ sơ của bạn chưa được duyệt (trạng thái hiện tại: ' + worker.approvalStatus + '). Bạn chưa thể bật nhận việc');
      }

      // 3. Phai co it nhat 1 dich vu trong WorkerService
      if (!worker.workerServices || worker.workerServices.length === 0) {
        throw new BadRequestException('Bạn chưa đăng ký bất kỳ dịch vụ nào để nhận việc');
      }
    }

    const updated = await this.prisma.workerProfile.update({
      where: { id: worker.id },
      data: { isOnline },
    });

    return {
      message: `Đã ${isOnline ? 'bật' : 'tắt'} trạng thái sẵn sàng nhận việc thành công`,
      isOnline: updated.isOnline,
    };
  }
}
