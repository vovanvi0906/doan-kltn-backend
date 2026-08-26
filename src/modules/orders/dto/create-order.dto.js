import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'serviceId không được để trống' })
  serviceId;

  @IsNumber({}, { message: 'pickupLat phải là số' })
  pickupLat;

  @IsNumber({}, { message: 'pickupLng phải là số' })
  pickupLng;

  @IsOptional()
  @IsString()
  beforeImageUrl;

  @IsOptional()
  @IsNumber()
  price;
}
