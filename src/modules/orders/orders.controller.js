import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
@Dependencies(OrdersService)
export class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đơn dịch vụ mới (Dành cho Khách hàng)' })
  async createOrder(@Request() req, @Body() createOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn của người dùng hiện tại' })
  async getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn hàng' })
  async getOrderById(@Param('id') id) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Thợ chấp nhận đơn hàng' })
  async acceptOrder(@Param('id') id, @Request() req) {
    return this.ordersService.acceptOrder(id, req.user.id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Thợ bắt đầu thực hiện công việc' })
  async startWork(@Param('id') id, @Request() req) {
    return this.ordersService.startWork(id, req.user.id);
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Thợ hoàn thành công việc và gửi ảnh nghiệm thu' })
  async finishWork(@Param('id') id, @Request() req, @Body('afterImageUrl') afterImageUrl) {
    return this.ordersService.finishWork(id, req.user.id, afterImageUrl);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng' })
  async cancelOrder(@Param('id') id, @Body('reason') reason) {
    return this.ordersService.cancelOrder(id, reason);
  }
}
