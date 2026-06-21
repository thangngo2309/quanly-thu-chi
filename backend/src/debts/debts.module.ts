import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sale } from '../sales/entities/sale.entity';
import { DebtsController } from './debts.controller';
import { DebtsPdfService } from './debts-pdf.service';
import { DebtsService } from './debts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale])],

  controllers: [DebtsController],

  providers: [DebtsService, DebtsPdfService],
})
export class DebtsModule {}
