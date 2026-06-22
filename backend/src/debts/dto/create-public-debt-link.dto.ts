import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublicDebtLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;
}
