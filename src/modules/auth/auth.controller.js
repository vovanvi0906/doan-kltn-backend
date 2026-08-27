import { Controller, Post, Bind, Body, Dependencies } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
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
    return this.authService.login(body.email, body.password);
  }
}
