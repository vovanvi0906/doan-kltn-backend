import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Bind,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminGetUsersDto } from './dto/admin-get-users.dto';

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
  // USER MANAGEMENT (CRUD)
  // ==========================================

  @Get('users')
  @ApiOperation({
    summary:
      'Lấy danh sách người dùng (Customer, Worker, Admin) kèm phân trang và tìm kiếm',
  })
  @ApiQuery({ name: 'role', required: false, enum: ['CUSTOMER', 'WORKER', 'ADMIN', 'ALL'] })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Bind(Query())
  async getUsers(query) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một người dùng' })
  @ApiParam({ name: 'id', required: true, description: 'User ID' })
  @Bind(Param('id'))
  async getUserById(id) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Tạo tài khoản người dùng mới (Customer hoặc Worker)' })
  @Bind(Body())
  async createUser(body) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiParam({ name: 'id', required: true, description: 'User ID' })
  @Bind(Param('id'), Body())
  async updateUser(id, body) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Xóa người dùng khỏi hệ thống' })
  @ApiParam({ name: 'id', required: true, description: 'User ID' })
  @Bind(Param('id'), Req())
  async deleteUser(id, req) {
    const currentUserId = req?.user?.id || req?.user?.userId;
    return this.adminService.deleteUser(id, currentUserId);
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
  // WORKER APPROVAL & MANAGEMENT STATE MACHINE
  // ==========================================

  @Get('workers')
  @ApiOperation({
    summary:
      'Lấy danh sách hồ sơ thợ (có phân trang, tìm kiếm, lọc approvalStatus và isOnline)',
  })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'approvalStatus', required: false, type: String })
  @ApiQuery({ name: 'isOnline', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Bind(Query())
  async getWorkers(query) {
    return this.adminService.getWorkers(query);
  }

  @Post('workers/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt hồ sơ thợ (POST - chuyển trạng thái sang APPROVED)' })
  @Bind(Param('id'))
  async approveWorkerPost(id) {
    return this.adminService.approveWorker(id);
  }

  @Patch('workers/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt hồ sơ thợ (PATCH - chuyển trạng thái sang APPROVED)' })
  @Bind(Param('id'))
  async approveWorkerPatch(id) {
    return this.adminService.approveWorker(id);
  }

  @Post('workers/:id/reject')
  @ApiOperation({ summary: 'Từ chối hồ sơ thợ (POST - chuyển trạng thái sang REJECTED)' })
  @Bind(Param('id'), Body())
  async rejectWorkerPost(id, body) {
    return this.adminService.rejectWorker(id, body?.reason);
  }

  @Patch('workers/:id/reject')
  @ApiOperation({ summary: 'Từ chối hồ sơ thợ (PATCH - chuyển trạng thái sang REJECTED)' })
  @Bind(Param('id'), Body())
  async rejectWorkerPatch(id, body) {
    return this.adminService.rejectWorker(id, body?.reason);
  }

  @Delete('workers/:id')
  @ApiOperation({ summary: 'Xóa hoặc vô hiệu hóa tài khoản thợ' })
  @Bind(Param('id'), Req())
  async deleteWorker(id, req) {
    const currentUserId = req?.user?.id || req?.user?.userId;
    return this.adminService.deleteWorker(id, currentUserId);
  }
}

