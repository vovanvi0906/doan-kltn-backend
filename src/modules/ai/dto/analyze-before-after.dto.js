import { IsNotEmpty, IsString } from 'class-validator';

export class AnalyzeBeforeAfterDto {
  @IsString()
  @IsNotEmpty({ message: 'beforeImageUrl không được để trống' })
  beforeImageUrl;

  @IsString()
  @IsNotEmpty({ message: 'afterImageUrl không được để trống' })
  afterImageUrl;
}
