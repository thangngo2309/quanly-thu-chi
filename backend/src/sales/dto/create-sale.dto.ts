import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSaleDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @ApiProperty({
    example: 'Mua 10 thùng nước ngọt',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    example: 2000000,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  paidAmount?: number = 0;

  @ApiPropertyOptional({
    example: '2026-06-20',
  })
  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @ApiPropertyOptional({
    example: 'Khách hẹn thanh toán phần còn lại cuối tháng',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
