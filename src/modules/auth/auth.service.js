import {
  Injectable,
  Dependencies,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService, JwtService)
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async register(data) {
    const role = (data.role || 'CUSTOMER').toUpperCase();
    if (role === 'WORKER') {
      return this.registerWorker(data);
    }
    return this.registerCustomer(data);
  }

  async registerCustomer(data) {
    const { email, password, phone, fullName, avatarUrl } = data;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    if (phone) {
      const existingPhone = await this.usersService.findByPhone(phone);
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại đã tồn tại trong hệ thống');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      passwordHash,
      phone: phone || null,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          fullName: fullName || null,
          avatarUrl: avatarUrl || null,
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      message: 'Đăng ký tài khoản khách hàng thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }

  async registerWorker(data) {
    const { email, password, phone, fullName, avatarUrl, skills, bio, cccdNumber } = data;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
    }

    if (phone) {
      const existingPhone = await this.usersService.findByPhone(phone);
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại đã tồn tại trong hệ thống');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      passwordHash,
      phone: phone || null,
      role: 'WORKER',
      status: 'ACTIVE',
      workerProfile: {
        create: {
          fullName: fullName || null,
          avatarUrl: avatarUrl || null,
          idCardNumber: cccdNumber || null,
          skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
          bio: bio || null,
          approvalStatus: 'DRAFT',
        },
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });

    return {
      message: 'Đăng ký tài khoản thợ thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }

  async login(emailOrPhone, password) {
    console.log('🔑 [Backend AuthService] Nhận yêu cầu đăng nhập:', { identifier: emailOrPhone });

    if (!emailOrPhone || !password) {
      console.warn('⚠️ [Backend AuthService] Thiếu emailOrPhone hoặc password');
      throw new BadRequestException('Vui lòng nhập đầy đủ thông tin đăng nhập');
    }

    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      console.warn('⚠️ [Backend AuthService] Không tìm thấy user với định danh:', emailOrPhone);
      throw new UnauthorizedException('Email / Số điện thoại hoặc mật khẩu không chính xác');
    }

    if (user.status === 'BLOCKED') {
      console.warn('⚠️ [Backend AuthService] User bị khóa:', user.email);
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn('⚠️ [Backend AuthService] Mật khẩu không khớp cho user:', {
        email: user.email,
        phone: user.phone,
      });
      throw new UnauthorizedException('Email / Số điện thoại hoặc mật khẩu không chính xác');
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const { passwordHash: _, ...sanitizedUser } = user;

    console.log('✅ [Backend AuthService] Đăng nhập thành công:', {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    return {
      message: 'Đăng nhập thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }
}
