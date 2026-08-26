import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ROLES } from '../../../common/constants/roles.constant';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password;

  @IsOptional()
  @IsString()
  phone;

  @IsOptional()
  @IsEnum(ROLES, { message: 'Role phải là CUSTOMER, WORKER hoặc ADMIN' })
  role;
}
