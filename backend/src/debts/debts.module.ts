import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sale } from '../sales/entities/sale.entity';
import { DebtsController } from './debts.controller';
import { DebtsPdfService } from './debts-pdf.service';
import { DebtsService } from './debts.service';
import { PublicDebtsController } from './public-debts.controller';
import { PublicDebtsService } from './public-debts.service';
import { DebtPaymentRequest } from './entities/debt-payment-request.entity';
import { DebtPaymentRequestItem } from './entities/debt-payment-request-item.entity';
import { DebtPaymentRequestsController } from './debt-payment-requests.controller';
import { DebtPaymentRequestsService } from './debt-payment-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, DebtPaymentRequest, DebtPaymentRequestItem,])],

  controllers: [ DebtsController, PublicDebtsController, DebtPaymentRequestsController, ],

  providers: [ DebtsService, DebtsPdfService, PublicDebtsService, DebtPaymentRequestsService, ],
})
export class DebtsModule {}
