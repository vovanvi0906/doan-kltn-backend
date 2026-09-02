import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    type: String,
    description: 'ID của dịch vụ muốn đặt (Service UUID)',
    example: 'd9b3a0e8-78b1-4f1b-8012-3a5c89e20a11',
  })
  @IsString({ message: 'serviceId phải là chuỗi ký tự (UUID)' })
  @IsNotEmpty({ message: 'serviceId không được để trống' })
  serviceId;

  @ApiProperty({
    type: Number,
    description: 'Vĩ độ điểm đón/thực hiện dịch vụ (Latitude từ Google Maps GPS)',
    example: 10.762622,
  })
  @IsNumber({}, { message: 'pickupLat phải là số thực (Float)' })
  @Min(-90, { message: 'pickupLat không hợp lệ (>= -90)' })
  @Max(90, { message: 'pickupLat không hợp lệ (<= 90)' })
  @IsNotEmpty({ message: 'pickupLat (Vĩ độ) không được để trống' })
  pickupLat;

  @ApiProperty({
    type: Number,
    description: 'Kinh độ điểm đón/thực hiện dịch vụ (Longitude từ Google Maps GPS)',
    example: 106.660172,
  })
  @IsNumber({}, { message: 'pickupLng phải là số thực (Float)' })
  @Min(-180, { message: 'pickupLng không hợp lệ (>= -180)' })
  @Max(180, { message: 'pickupLng không hợp lệ (<= 180)' })
  @IsNotEmpty({ message: 'pickupLng (Kinh độ) không được để trống' })
  pickupLng;

  @ApiPropertyOptional({
    type: String,
    description: 'Địa chỉ dạng chuỗi văn bản lấy từ Google Places Reverse Geocoding',
    example: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
  })
  @IsOptional()
  @IsString({ message: 'pickupAddress phải là chuỗi văn bản' })
  pickupAddress;

  @ApiPropertyOptional({
    type: String,
    description: 'ID địa chỉ đã lưu trong sổ địa chỉ (tùy chọn)',
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  })
  @IsOptional()
  @IsString({ message: 'addressId phải là chuỗi ký tự' })
  addressId;

  @ApiPropertyOptional({
    type: String,
    description: 'Mô tả chi tiết tình trạng hư hỏng hoặc yêu cầu của khách hàng',
    example: 'Bồn cầu bị rò rỉ nước liên tục dưới chân đế',
  })
  @IsOptional()
  @IsString({ message: 'description phải là chuỗi ký tự' })
  description;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú thêm cho thợ khi di chuyển',
    example: 'Vào hẻm 268 rẽ trái nhà thứ 3',
  })
  @IsOptional()
  @IsString({ message: 'note phải là chuỗi ký tự' })
  note;

  @ApiPropertyOptional({
    type: String,
    description: 'Thời gian hẹn lịch thực hiện dịch vụ (nếu đặt trước, định dạng ISO 8601)',
    example: '2026-09-03T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'scheduledAt phải là định dạng ISO date string' })
  scheduledAt;
}
