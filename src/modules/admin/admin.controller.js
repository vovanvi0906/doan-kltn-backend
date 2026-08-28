import {
  Controller,
  Get,
  Post,
  Patch,
  Bind,
  Body,
  Param,
  Query,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Dependencies(AdminService)
export class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  // ==========================================
  // SERVICE CATALOG MANAGEMENT
  // ==========================================

  @Post('service-categories')
  @ApiOperation({ summary: 'Tạo danh mục dịch vụ mới' })
  @Bind(Body())
  async createCategory(body) {
    return this.adminService.createCategory(body);
  }

  @Patch('service-categories/:id')
  @ApiOperation({ summary: 'Cập nhật danh mục dịch vụ' })
  @Bind(Param('id'), Body())
  async updateCategory(id, body) {
    return this.adminService.updateCategory(id, body);
  }

  @Post('services')
  @ApiOperation({ summary: 'Tạo dịch vụ mới thuộc danh mục' })
  @Bind(Body())
  async createService(body) {
    return this.adminService.createService(body);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin dịch vụ' })
  @Bind(Param('id'), Body())
  async updateService(id, body) {
    return this.adminService.updateService(id, body);
  }

  // ==========================================
  // WORKER APPROVAL STATE MACHINE
  // ==========================================

  @Get('workers')
  @ApiOperation({ summary: 'Lấy danh sách hồ sơ thợ (mặc định hoặc lọc theo status: PENDING, DRAFT, APPROVED, REJECTED)' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @Bind(Query('status'))
  async getWorkers(status) {
    return this.adminService.getWorkers(status);
  }

  @Post('workers/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt hồ sơ thợ (chuyển trạng thái sang APPROVED)' })
  @Bind(Param('id'))
  async approveWorker(id) {
    return this.adminService.approveWorker(id);
  }

  @Post('workers/:id/reject')
  @ApiOperation({ summary: 'Từ chối hồ sơ thợ (chuyển trạng thái sang REJECTED)' })
  @Bind(Param('id'))
  async rejectWorker(id) {
    return this.adminService.rejectWorker(id);
  }
}
