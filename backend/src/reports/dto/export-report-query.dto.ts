import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ExportReportQueryDto {
  @ApiProperty({
    example: '2026-06-01',
  })
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    example: '2026-06-30',
  })
  @IsDateString()
  toDate: string;
}