import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'orderId không được để trống' })
  orderId;

  @IsNumber({}, { message: 'amount phải là số' })
  amount;

  @IsOptional()
  @IsString()
  method;
}
