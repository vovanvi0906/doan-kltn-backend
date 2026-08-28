import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty({ message: 'categoryId không được để trống' })
  @IsString({ message: 'categoryId phải là chuỗi UUID' })
  categoryId;

  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  @IsString({ message: 'Tên dịch vụ phải là chuỗi ký tự' })
  name;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description;

  @IsNotEmpty({ message: 'Giá cơ bản không được để trống' })
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
