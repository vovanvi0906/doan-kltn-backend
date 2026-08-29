import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class CustomersService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getProfile(userId) {
    const customerProfile = await this.prisma.customerProfile.findUnique({
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
      },
    });

    if (!customerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    return customerProfile;
  }

  async updateProfile(userId, updateData) {
    const existingProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const { fullName, avatarUrl } = updateData;

    const updatedProfile = await this.prisma.customerProfile.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return updatedProfile;
  }

  async getAddresses(userId) {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    return this.prisma.address.findMany({
      where: { customerId: customerProfile.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId, createAddressDto) {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const {
      title,
      street,
      ward,
      district,
      city,
      latitude,
      longitude,
      lat,
      lng,
      isDefault,
    } = createAddressDto;

    const rawLat = latitude !== undefined ? latitude : lat;
    const rawLng = longitude !== undefined ? longitude : lng;

    const parsedLat =
      rawLat !== undefined && rawLat !== null ? parseFloat(rawLat) : NaN;
    const parsedLng =
      rawLng !== undefined && rawLng !== null ? parseFloat(rawLng) : NaN;

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      throw new BadRequestException(
        'Tọa độ (latitude/lat, longitude/lng) không hợp lệ',
      );
    }

    const existingCount = await this.prisma.address.count({
      where: { customerId: customerProfile.id },
    });

    // Neu day la dia chi dau tien, mac dinh set isDefault = true
    const shouldBeDefault = isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await this.prisma.address.updateMany({
        where: { customerId: customerProfile.id },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        customer: {
          connect: { id: customerProfile.id },
        },
        title: title || null,
        street,
        ward: ward || null,
        district: district || null,
        city: city || null,
        latitude: parsedLat,
        longitude: parsedLng,
        isDefault: shouldBeDefault,
      },
    });
  }

  async updateAddress(userId, addressId, updateAddressDto) {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const existingAddress = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        customerId: customerProfile.id,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException(
        'Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu',
      );
    }

    const {
      title,
      street,
      ward,
      district,
      city,
      latitude,
      longitude,
      lat,
      lng,
      isDefault,
    } = updateAddressDto;

    const rawLat = latitude !== undefined ? latitude : lat;
    const rawLng = longitude !== undefined ? longitude : lng;

    let parsedLat;
    if (rawLat !== undefined && rawLat !== null) {
      parsedLat = parseFloat(rawLat);
      if (isNaN(parsedLat)) {
        throw new BadRequestException('Tọa độ latitude không hợp lệ');
      }
    }

    let parsedLng;
    if (rawLng !== undefined && rawLng !== null) {
      parsedLng = parseFloat(rawLng);
      if (isNaN(parsedLng)) {
        throw new BadRequestException('Tọa độ longitude không hợp lệ');
      }
    }

    if (isDefault === true) {
      await this.prisma.address.updateMany({
        where: {
          customerId: customerProfile.id,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(title !== undefined && { title }),
        ...(street !== undefined && { street }),
        ...(ward !== undefined && { ward }),
        ...(district !== undefined && { district }),
        ...(city !== undefined && { city }),
        ...(parsedLat !== undefined && { latitude: parsedLat }),
        ...(parsedLng !== undefined && { longitude: parsedLng }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  }

  async deleteAddress(userId, addressId) {
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const existingAddress = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        customerId: customerProfile.id,
      },
    });

    if (!existingAddress) {
      throw new NotFoundException(
        'Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu',
      );
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return {
      message: 'Xóa địa chỉ thành công',
      id: addressId,
    };
  }
}
