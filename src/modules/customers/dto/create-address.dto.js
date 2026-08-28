import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề địa chỉ phải là chuỗi ký tự' })
  title;

  @IsNotEmpty({ message: 'Tên đường/Số nhà không được để trống' })
  @IsString({ message: 'Tên đường/Số nhà phải là chuỗi ký tự' })
  street;

  @IsOptional()
  @IsString({ message: 'Phường/Xã phải là chuỗi ký tự' })
  ward;

  @IsOptional()
  @IsString({ message: 'Quận/Huyện phải là chuỗi ký tự' })
  district;

  @IsOptional()
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi ký tự' })
  city;

  @IsNotEmpty({ message: 'Vĩ độ (latitude) không được để trống' })
  @IsNumber({}, { message: 'Vĩ độ (latitude) phải là số' })
  latitude;

  @IsNotEmpty({ message: 'Kinh độ (longitude) không được để trống' })
  @IsNumber({}, { message: 'Kinh độ (longitude) phải là số' })
  longitude;

  @IsOptional()
  @IsBoolean({ message: 'isDefault phải là giá trị boolean (true/false)' })
  isDefault;
}
