import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Bind,
  Dependencies,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
@Dependencies(OrdersService)
export class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  @Post()
  @Roles('CUSTOMER')
  @ApiOperation({
    summary: 'Tạo đơn dịch vụ mới (Khách hàng - Khởi tạo trạng thái SEARCHING & quét thợ 5km)',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo đơn thành công, trả về orderId và số lượng thợ tìm thấy xung quanh',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (thiếu tọa độ hoặc serviceId)' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực JWT' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy Dịch vụ hoặc Địa chỉ' })
  @Bind(Req(), Body())
  async createOrder(req, createOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn hàng' })
  @Bind(Req())
  async getMyOrders(req) {
    return this.ordersService.getMyOrders(req.user.userId, req.user.role);
  }

  @Get('worker/current')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Lấy đơn hàng đang nhận/đang thực hiện của thợ' })
  @ApiResponse({ status: 200, description: 'Đơn hàng hiện tại hoặc null' })
  @Bind(Req())
  async getCurrentWorkerOrder(req) {
    return this.ordersService.getCurrentWorkerOrder(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn hàng (Có phân quyền)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  @Bind(Req(), Param('id'))
  async getOrderById(req, id) {
    return this.ordersService.getOrderById(id, req.user.userId, req.user.role);
  }

  @Post(':id/accept')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'Thợ nhận đơn hàng (POST - Xử lý tranh chấp Race condition, chuyển SEARCHING -> ASSIGNED)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Nhận đơn thành công (ASSIGNED)' })
  @ApiResponse({ status: 409, description: 'Conflict: Đơn hàng đã có thợ khác nhận trước' })
  @Bind(Req(), Param('id'))
  async acceptOrderPost(req, id) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  @Patch(':id/accept')
  @Roles('WORKER')
  @ApiOperation({
    summary: 'Thợ nhận đơn hàng (PATCH - Xử lý tranh chấp Race condition, chuyển SEARCHING -> ASSIGNED)',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Nhận đơn thành công (ASSIGNED)' })
  @ApiResponse({ status: 409, description: 'Conflict: Đơn hàng đã có thợ khác nhận trước' })
  @Bind(Req(), Param('id'))
  async acceptOrder(req, id) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  @Patch(':id/arriving')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ đang di chuyển đến địa điểm (ASSIGNED -> WORKER_ARRIVING)' })
  @Bind(Req(), Param('id'))
  async markArriving(req, id) {
    return this.ordersService.markArriving(id, req.user.userId);
  }

  @Patch(':id/arrived')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ đã có mặt tại địa điểm (WORKER_ARRIVING -> ARRIVED)' })
  @Bind(Req(), Param('id'))
  async markArrived(req, id) {
    return this.ordersService.markArrived(id, req.user.userId);
  }

  @Patch(':id/start')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ bắt đầu thực hiện công việc (ARRIVED -> IN_PROGRESS)' })
  @Bind(Req(), Param('id'))
  async startWork(req, id) {
    return this.ordersService.startWork(id, req.user.userId);
  }

  @Patch(':id/finish')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Thợ báo cáo hoàn thành công việc (IN_PROGRESS -> AWAITING_CONFIRMATION)' })
  @Bind(Req(), Param('id'))
  async finishWork(req, id) {
    return this.ordersService.finishWork(id, req.user.userId);
  }

  @Patch(':id/confirm-completion')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Khách hàng nghiệm thu dịch vụ (AWAITING_CONFIRMATION -> AWAITING_PAYMENT)' })
  @Bind(Req(), Param('id'))
  async confirmCompletion(req, id) {
    return this.ordersService.confirmCompletion(id, req.user.userId);
  }

  @Patch(':id/complete-payment')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xác nhận thanh toán và hoàn tất đơn (AWAITING_PAYMENT -> COMPLETED)' })
  @Bind(Req(), Param('id'))
  async completePayment(req, id) {
    return this.ordersService.completePayment(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (* -> CANCELLED)' })
  @ApiBody({ type: CancelOrderDto })
  @Bind(Req(), Param('id'), Body())
  async cancelOrder(req, id, cancelDto) {
    return this.ordersService.cancelOrder(
      id,
      req.user.userId,
      req.user.role,
      cancelDto?.reason || 'Hủy theo yêu cầu'
    );
  }
}
