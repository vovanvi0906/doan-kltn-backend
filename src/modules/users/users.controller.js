import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Dependencies,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
@Dependencies(UsersService)
export class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin cá nhân của người dùng hiện tại' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  async updateProfile(@Request() req, @Body() updateDto) {
    return this.usersService.updateProfile(req.user.id, updateDto);
  }
}
