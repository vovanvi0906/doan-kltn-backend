import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'serviceId không được để trống' })
  serviceId;

  @IsString()
  @IsNotEmpty({ message: 'addressId không được để trống' })
  addressId;

  @IsOptional()
  @IsString()
  description;

  @IsOptional()
  @IsString()
  note;

  @IsOptional()
  @IsDateString({}, { message: 'scheduledAt phải là định dạng ISO date string' })
  scheduledAt;
}
