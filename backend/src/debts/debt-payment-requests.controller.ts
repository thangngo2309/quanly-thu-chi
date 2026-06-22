import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { DebtPaymentRequestsService } from './debt-payment-requests.service';
import { ReviewDebtPaymentRequestDto } from './dto/review-debt-payment-request.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@Controller('debts/payment-requests')
@Roles(UserRole.SYSTEM_ADMIN)
export class DebtPaymentRequestsController {

  constructor(private readonly service: DebtPaymentRequestsService) {}

  @Get('pending') findPending() {
    return this.service.findPending();
  }
  @Patch(':id/approve') approve(
    @Param('id') id: string,
    @Body() dto: ReviewDebtPaymentRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.approve(id, dto, currentUser);
  }
  
  @Patch(':id/reject') reject(
    @Param('id') id: string,
    @Body() dto: ReviewDebtPaymentRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.service.reject(id, dto, currentUser);
  }
}
