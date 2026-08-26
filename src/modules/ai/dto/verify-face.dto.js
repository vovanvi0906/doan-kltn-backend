import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyFaceDto {
  @IsString()
  @IsNotEmpty({ message: 'faceImageUrl không được để trống' })
  faceImageUrl;

  @IsString()
  @IsNotEmpty({ message: 'idCardImageUrl không được để trống' })
  idCardImageUrl;
}
