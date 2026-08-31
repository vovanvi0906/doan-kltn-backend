import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ROLES } from '../../../common/constants/roles.constant';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone;

  @IsOptional()
  @IsEnum(ROLES, { message: 'Role phải là CUSTOMER hoặc WORKER' })
  role;

  @IsOptional()
  @IsString({ message: 'Số CCCD/CMND phải là chuỗi ký tự' })
  cccdNumber;

  @IsOptional()
  @IsString({ message: 'Bio phải là chuỗi ký tự' })
  bio;

  @IsOptional()
  skills;
}
