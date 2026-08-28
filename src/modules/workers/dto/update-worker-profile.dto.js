import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';

export class UpdateWorkerProfileDto {
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName;

  @IsOptional()
  @IsString({ message: 'URL ảnh đại diện phải là chuỗi ký tự' })
  avatarUrl;

  @IsOptional()
  @IsString({ message: 'Tiểu sử / giới thiệu phải là chuỗi ký tự' })
  bio;

  @IsOptional()
  @IsNumber({}, { message: 'Số năm kinh nghiệm phải là số' })
  @Min(0, { message: 'Số năm kinh nghiệm không được âm' })
  experienceYears;

  @IsOptional()
  @IsString({ message: 'Số CCCD/CMND phải là chuỗi ký tự' })
  idCardNumber;

  @IsOptional()
  @IsArray({ message: 'Danh sách kỹ năng phải là một mảng chuỗi' })
  @IsString({ each: true, message: 'Mỗi kỹ năng phải là chuỗi ký tự' })
  skills;

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ hiện tại phải là số' })
  currentLat;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ hiện tại phải là số' })
  currentLng;
}
