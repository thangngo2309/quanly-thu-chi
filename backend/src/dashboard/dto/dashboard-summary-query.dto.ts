import { IsDateString, IsOptional } from 'class-validator';
export class DashboardSummaryQueryDto {
  @IsOptional() @IsDateString() fromDate?: string;
  @IsOptional() @IsDateString() toDate?: string;
}
