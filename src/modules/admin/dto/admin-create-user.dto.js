import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';

export class AdminCreateUserDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password;

  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone;

  @IsOptional()
  @IsEnum(['CUSTOMER', 'WORKER', 'ADMIN'], {
    message: 'Role phải là CUSTOMER, WORKER hoặc ADMIN',
  })
  role;

  @IsOptional()
  @IsEnum(['ACTIVE', 'BLOCKED'], {
    message: 'Status phải là ACTIVE hoặc BLOCKED',
  })
  status;

  @IsOptional()
  @IsString({ message: 'Bio phải là chuỗi ký tự' })
  bio;

  @IsOptional()
  @IsString({ message: 'CCCD/CMND phải là chuỗi ký tự' })
  cccdNumber;

  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl;

  @IsOptional()
  skills;
}
