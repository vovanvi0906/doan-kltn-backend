import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLES } from '../../../common/constants/roles.constant';

export class RegisterDto {
  @ApiProperty({
    type: String,
    description: 'Họ và tên người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @ApiProperty({
    type: String,
    description: 'Địa chỉ Email cá nhân',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email;

  @ApiProperty({
    type: String,
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password;

  @ApiPropertyOptional({
    type: String,
    description: 'Số điện thoại liên hệ',
    example: '0912345678',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone;

  @ApiPropertyOptional({
    type: String,
    description: 'Vai trò tài khoản (CUSTOMER hoặc WORKER)',
    enum: ['CUSTOMER', 'WORKER'],
    default: 'CUSTOMER',
  })
  @IsOptional()
  @IsEnum(ROLES, { message: 'Role phải là CUSTOMER hoặc WORKER' })
  role;

  @ApiPropertyOptional({
    type: String,
    description: 'Số CCCD/CMND (bắt buộc đối với thợ)',
    example: '079123456789',
  })
  @IsOptional()
  @IsString({ message: 'Số CCCD/CMND phải là chuỗi ký tự' })
  cccdNumber;

  @ApiPropertyOptional({
    type: String,
    description: 'Tiểu sử / Giới thiệu kinh nghiệm (Dành cho thợ)',
    example: '5 năm kinh nghiệm sửa chữa điện lạnh dân dụng',
  })
  @IsOptional()
  @IsString({ message: 'Bio phải là chuỗi ký tự' })
  bio;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách kỹ năng chuyên môn (Dành cho thợ)',
    example: ['Sửa điện nước', 'Sửa máy lạnh'],
  })
  @IsOptional()
  skills;
}
