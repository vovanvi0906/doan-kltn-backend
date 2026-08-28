import { IsOptional, IsString } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @IsOptional()
  @IsString({ message: 'URL ảnh đại diện phải là chuỗi ký tự' })
  avatarUrl;
}
