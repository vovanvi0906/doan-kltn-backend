import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  phone;

  @IsOptional()
  @IsString()
  address;
}
