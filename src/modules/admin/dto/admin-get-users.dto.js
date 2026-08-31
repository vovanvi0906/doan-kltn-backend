import { IsOptional, IsString } from 'class-validator';

export class AdminGetUsersDto {
  @IsOptional()
  @IsString({ message: 'Role phải là chuỗi ký tự' })
  role;

  @IsOptional()
  @IsString({ message: 'Status phải là chuỗi ký tự' })
  status;

  @IsOptional()
  @IsString({ message: 'Search phải là chuỗi ký tự' })
  search;

  @IsOptional()
  page;

  @IsOptional()
  limit;
}
