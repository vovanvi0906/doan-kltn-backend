import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Dependencies,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
@Dependencies(PaymentsService)
export class PaymentsController {
  constructor(paymentsService) {
    this.paymentsService = paymentsService;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('checkout-url')
  @ApiOperation({ summary: 'Tạo URL thanh toán cho đơn hàng' })
  async createPaymentUrl(@Body() createPaymentDto) {
    return this.paymentsService.createPaymentUrl(createPaymentDto);
  }

  @Post('webhook/mock-success')
  @ApiOperation({ summary: 'Giả lập thanh toán thành công (Webhook callback)' })
  async mockPaymentSuccess(@Body() body) {
    return this.paymentsService.processPaymentSuccess(
      body.orderId,
      body.amount,
      body.method,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán theo mã đơn' })
  async getPaymentByOrderId(@Param('orderId') orderId) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }
}
