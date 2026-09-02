import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({
    type: String,
    description: 'Lý do hủy đơn hàng',
    example: 'Thay đổi kế hoạch hoặc đã tự sửa được',
  })
  @IsString({ message: 'Lý do hủy đơn phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Lý do hủy đơn không được để trống' })
  reason;
}
