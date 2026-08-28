import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsNotEmpty({ message: 'isOnline không được để trống' })
  @IsBoolean({ message: 'isOnline phải là boolean (true/false)' })
  isOnline;
}
