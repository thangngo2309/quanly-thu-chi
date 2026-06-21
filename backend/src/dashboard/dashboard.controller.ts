import { Controller, Get, Query } from '@nestjs/common';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
@Controller('dashboard')
@Roles(UserRole.SYSTEM_ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('summary') getSummary(@Query() query: DashboardSummaryQueryDto) {
    return this.dashboardService.getSummary(query);
  }
}
