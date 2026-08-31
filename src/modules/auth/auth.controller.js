import { Controller, Post, Bind, Body, Dependencies } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng (Khách hàng hoặc Thợ)' })
  @Bind(Body())
  async register(body) {
    return this.authService.register(body);
  }

  @Post('register/customer')
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng (Customer)' })
  @Bind(Body())
  async registerCustomer(body) {
    return this.authService.registerCustomer(body);
  }

  @Post('register/worker')
  @ApiOperation({ summary: 'Đăng ký tài khoản thợ (Worker)' })
  @Bind(Body())
  async registerWorker(body) {
    return this.authService.registerWorker(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @Bind(Body())
  async login(body) {
    const identifier = body.email || body.emailOrPhone || body.phone || body.username;
    return this.authService.login(identifier, body.password);
  }
}
