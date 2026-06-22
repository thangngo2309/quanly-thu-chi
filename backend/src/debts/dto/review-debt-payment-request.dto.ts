import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDebtPaymentRequestDto {
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
