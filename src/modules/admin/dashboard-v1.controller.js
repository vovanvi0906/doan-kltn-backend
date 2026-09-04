import {
  Controller,
  Get,
  Bind,
  Query,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

/**
 * Dashboard V1 Controller
 * Quản lý các API endpoints phục vụ màn hình Tổng Quan Hệ Thống (Dashboard Overview)
 * Chuẩn RESTful API v1 - FixGo Pro Admin
 */
@ApiTags('v1/dashboard')
@ApiBearerAuth()
@Controller('v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Dependencies(AdminService)
export class DashboardV1Controller {
  constructor(adminService) {
    this.adminService = adminService;
  }

  /**
   * API: GET /api/v1/dashboard/overview
   * Chức năng: Lấy số liệu tổng quan hệ thống (Khách hàng, Đối tác thợ, Hồ sơ chờ duyệt, Tổng đơn đặt)
   * @param {string} timeframe - Khoảng thời gian ('today' | 'week' | 'month')
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Lấy số liệu tổng quan hệ thống (Khách hàng, Đối tác thợ, Hồ sơ chờ duyệt, Tổng đơn đặt)',
    description: 'Trả về các chỉ số KPI vận hành, số lượng tài khoản, đơn hàng và tỷ lệ tăng trưởng trong kỳ.',
  })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['today', 'week', 'month'] })
  @Bind(Query('timeframe'))
  async getOverview(timeframe) {
    return this.adminService.getDashboardOverviewV1(timeframe);
  }

  /**
   * API: GET /api/v1/dashboard/activities
   * Chức năng: Lấy danh sách hoạt động gần đây theo thời gian thực
   * @param {number} limit - Số lượng bản ghi cần lấy (mặc định: 10)
   */
  @Get('activities')
  @ApiOperation({
    summary: 'Lấy danh sách hoạt động gần đây theo thời gian thực',
    description: 'Truy vấn các sự kiện phát sinh từ đơn đặt dịch vụ và đăng ký thợ mới nhất.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Bind(Query('limit'))
  async getActivities(limit) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getDashboardActivitiesV1(parsedLimit);
  }

  /**
   * API: GET /api/v1/dashboard/service-distribution
   * Chức năng: Lấy dữ liệu thống kê phân bổ theo danh mục dịch vụ phục vụ cho biểu đồ
   * @param {string} timeframe - Khoảng thời gian lọc (tùy chọn)
   */
  @Get('service-distribution')
  @ApiOperation({
    summary: 'Lấy dữ liệu thống kê phân bổ theo danh mục dịch vụ phục vụ cho biểu đồ',
    description: 'Phân tích số lượng và tỷ trọng phần trăm đơn đặt theo từng danh mục dịch vụ gia đình.',
  })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['today', 'week', 'month'] })
  @Bind(Query('timeframe'))
  async getServiceDistribution(timeframe) {
    return this.adminService.getServiceDistributionV1(timeframe);
  }
}
