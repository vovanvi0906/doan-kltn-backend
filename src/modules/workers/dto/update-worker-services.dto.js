import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateWorkerServicesDto {
  @IsNotEmpty({ message: 'serviceIds không được để trống' })
  @IsArray({ message: 'serviceIds phải là một mảng chuỗi UUID' })
  @IsString({ each: true, message: 'Mỗi serviceId phải là chuỗi ký tự' })
  serviceIds;
}
