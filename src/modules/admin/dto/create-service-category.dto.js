import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  name;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description;

  @IsOptional()
  @IsString({ message: 'URL biểu tượng phải là chuỗi ký tự' })
  iconUrl;

  @IsOptional()
  @IsBoolean({ message: 'isActive phải là kiểu boolean (true/false)' })
  isActive;
}
