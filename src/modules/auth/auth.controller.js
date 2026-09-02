import { Controller, Post, Bind, Body, Dependencies } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
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
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Đăng ký tài khoản thành công, trả về JWT Token và User' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc Email/SĐT đã tồn tại' })
  @Bind(Body())
  async register(body) {
    return this.authService.register(body);
  }

  @Post('register/customer')
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng (Customer)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Đăng ký khách hàng thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi validation hoặc trùng email' })
  @Bind(Body())
  async registerCustomer(body) {
    return this.authService.registerCustomer(body);
  }

  @Post('register/worker')
  @ApiOperation({ summary: 'Đăng ký tài khoản thợ (Worker)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Đăng ký thợ thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi validation hoặc trùng email' })
  @Bind(Body())
  async registerWorker(body) {
    return this.authService.registerWorker(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống (Hỗ trợ Email, SĐT, Username)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về accessToken và User info' })
  @ApiResponse({ status: 400, description: 'Thiếu email hoặc mật khẩu' })
  @ApiResponse({ status: 401, description: 'Tài khoản hoặc mật khẩu không chính xác' })
  @ApiResponse({ status: 403, description: 'Tài khoản bị khóa' })
  @Bind(Body())
  async login(body) {
    const identifier = body.email || body.emailOrPhone || body.phone || body.username;
    return this.authService.login(identifier, body.password);
  }
}
