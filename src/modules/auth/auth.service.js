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

  async registerCustomer(data) {
    const { email, password, phone, fullName, avatarUrl } = data;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
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
    const { email, password, phone, fullName, avatarUrl, skills, bio } = data;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống');
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
          skills: skills || [],
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

  async login(email, password) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      message: 'Đăng nhập thành công',
      user: sanitizedUser,
      accessToken: token,
    };
  }
}
