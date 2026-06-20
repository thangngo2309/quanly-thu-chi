import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from '../expenses/entities/expense.entity';
import { Sale } from '../sales/entities/sale.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Expense])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
