import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
