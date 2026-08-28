import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Bind,
  Req,
  Body,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkersService } from './workers.service';

@ApiTags('workers')
@ApiBearerAuth()
@Controller('workers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WORKER')
@Dependencies(WorkersService)
export class WorkersController {
  constructor(workersService) {
    this.workersService = workersService;
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ cá nhân và kỹ năng của thợ' })
  @Bind(Req())
  async getProfile(req) {
    return this.workersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ cá nhân của thợ (bio, CCCD, kinh nghiệm, tọa độ...)' })
  @Bind(Req(), Body())
  async updateProfile(req, body) {
    return this.workersService.updateProfile(req.user.userId, body);
  }

  @Put('me/services')
  @ApiOperation({ summary: 'Cập nhật danh sách dịch vụ đăng ký cung cấp (gửi mảng serviceIds)' })
  @Bind(Req(), Body())
  async updateServices(req, body) {
    return this.workersService.updateServices(req.user.userId, body);
  }

  @Post('me/submit-approval')
  @ApiOperation({ summary: 'Nộp hồ sơ để yêu cầu quản trị viên phê duyệt (DRAFT -> PENDING)' })
  @Bind(Req())
  async submitApproval(req) {
    return this.workersService.submitApproval(req.user.userId);
  }

  @Patch('me/availability')
  @ApiOperation({ summary: 'Bật/tắt trạng thái trực tuyến sẵn sàng nhận việc (yêu cầu User ACTIVE, Worker APPROVED, đã chọn dịch vụ)' })
  @Bind(Req(), Body())
  async updateAvailability(req, body) {
    return this.workersService.updateAvailability(req.user.userId, body);
  }
}
