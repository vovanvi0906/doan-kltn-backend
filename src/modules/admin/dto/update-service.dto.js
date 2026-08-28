import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString({ message: 'categoryId phải là chuỗi UUID' })
  categoryId;

  @IsOptional()
  @IsString({ message: 'Tên dịch vụ phải là chuỗi ký tự' })
  name;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description;

  @IsOptional()
  @IsNumber({}, { message: 'Giá cơ bản phải là số' })
  @Min(0, { message: 'Giá cơ bản không được âm' })
  basePrice;

  @IsOptional()
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  unit;

  @IsOptional()
  @IsNumber({}, { message: 'Thời gian ước tính (phút) phải là số nguyên' })
  @Min(1, { message: 'Thời gian ước tính phải lớn hơn 0' })
  estimatedDurationMin;

  @IsOptional()
  @IsBoolean({ message: 'isActive phải là boolean' })
  isActive;
}
