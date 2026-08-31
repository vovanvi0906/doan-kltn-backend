import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone;

  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password;

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
  @IsEnum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'], {
    message: 'approvalStatus phải là DRAFT, PENDING, APPROVED hoặc REJECTED',
  })
  approvalStatus;

  @IsOptional()
  skills;
}
