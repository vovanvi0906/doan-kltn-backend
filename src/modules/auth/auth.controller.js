import { Controller, Post, Body, Dependencies } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (Customer / Worker)' })
  async register(@Body() registerDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  async login(@Body() loginDto) {
    return this.authService.login(loginDto);
  }
}
