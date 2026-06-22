import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class PublicDebtQueryDto {
  @IsString() @IsNotEmpty() @MaxLength(150) customerName: string;
  @IsString() @IsNotEmpty() token: string;
}
