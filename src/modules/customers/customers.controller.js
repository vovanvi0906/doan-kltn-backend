import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Bind,
  Req,
  Body,
  Param,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CUSTOMER')
@Dependencies(CustomersService)
export class CustomersController {
  constructor(customersService) {
    this.customersService = customersService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ cá nhân của khách hàng' })
  @Bind(Req())
  async getProfile(req) {
    return this.customersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân của khách hàng' })
  @Bind(Req(), Body())
  async updateProfile(req, body) {
    return this.customersService.updateProfile(req.user.userId, body);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Lấy danh sách sổ địa chỉ của khách hàng' })
  @Bind(Req())
  async getAddresses(req) {
    return this.customersService.getAddresses(req.user.userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới vào sổ địa chỉ' })
  @Bind(Req(), Body())
  async createAddress(req, body) {
    return this.customersService.createAddress(req.user.userId, body);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin một địa chỉ' })
  @Bind(Req(), Param('id'), Body())
  async updateAddress(req, id, body) {
    return this.customersService.updateAddress(req.user.userId, id, body);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Xóa một địa chỉ khỏi sổ địa chỉ' })
  @Bind(Req(), Param('id'))
  async deleteAddress(req, id) {
    return this.customersService.deleteAddress(req.user.userId, id);
  }
}
