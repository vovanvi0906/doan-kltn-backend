import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnalyzeIncidentDto {
  @IsString()
  @IsNotEmpty({ message: 'imageUrl không được để trống' })
  imageUrl;

  @IsOptional()
  @IsString()
  description;
}
