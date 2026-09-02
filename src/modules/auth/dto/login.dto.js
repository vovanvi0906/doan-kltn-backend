import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    type: String,
    description: 'Email, Số điện thoại hoặc Tên đăng nhập',
    example: 'customer@example.com',
  })
  @IsNotEmpty({ message: 'Thông tin tài khoản không được để trống' })
  @IsString({ message: 'Thông tin tài khoản phải là chuỗi ký tự' })
  email;

  @ApiProperty({
    type: String,
    description: 'Mật khẩu tài khoản',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password;
}
