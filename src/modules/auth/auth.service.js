import {
  Injectable,
  Dependencies,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';

@Injectable()
@Dependencies(UsersRepository, JwtService)
export class AuthService {
  constructor(usersRepository, jwtService) {
    this.usersRepository = usersRepository;
    this.jwtService = jwtService;
  }

  async register(registerDto) {
    const { email, password, phone, role } = registerDto;

    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.usersRepository.create({
      email,
      passwordHash,
      phone,
      role: role || 'CUSTOMER',
    });

    const token = this.generateToken(user);
    const { passwordHash: _, ...userInfo } = user;

    return {
      user: userInfo,
      accessToken: token,
    };
  }

  async login(loginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...userInfo } = user;

    return {
      user: userInfo,
      accessToken: token,
    };
  }

  generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
