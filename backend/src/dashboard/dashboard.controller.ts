import { Controller, Get, Query } from '@nestjs/common';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardService } from './dashboard.service';
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('summary') getSummary(@Query() query: DashboardSummaryQueryDto) {
    return this.dashboardService.getSummary(query);
  }
}
