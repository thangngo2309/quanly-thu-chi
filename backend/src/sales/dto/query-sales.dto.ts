import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class QuerySalesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Tìm theo tên khách hoặc nội dung mua',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    example: '2026-06-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
