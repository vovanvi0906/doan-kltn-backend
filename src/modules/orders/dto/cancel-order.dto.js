import { IsNotEmpty, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Lý do hủy đơn không được để trống' })
  reason;
}
