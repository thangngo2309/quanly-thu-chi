import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Expense } from '../expenses/entities/expense.entity';
import { Sale } from '../sales/entities/sale.entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async getSummary(query: DashboardQueryDto) {
    const salesQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'totalRevenue')
      .addSelect('COALESCE(SUM(sale.paidAmount), 0)', 'totalCollected')
      .addSelect('COALESCE(SUM(sale.remainingAmount), 0)', 'totalDebt')
      .addSelect('COUNT(sale.id)', 'totalSales');

    const expensesQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'totalExpenses')
      .addSelect('COUNT(expense.id)', 'totalExpenseItems');

    if (query.fromDate) {
      salesQuery.andWhere('sale.saleDate >= :fromDate', {
        fromDate: query.fromDate,
      });

      expensesQuery.andWhere('expense.expenseDate >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      salesQuery.andWhere('sale.saleDate <= :toDate', {
        toDate: query.toDate,
      });

      expensesQuery.andWhere('expense.expenseDate <= :toDate', {
        toDate: query.toDate,
      });
    }

    const [salesResult, expensesResult] = await Promise.all([
      salesQuery.getRawOne<{
        totalRevenue: string;
        totalCollected: string;
        totalDebt: string;
        totalSales: string;
      }>(),

      expensesQuery.getRawOne<{
        totalExpenses: string;
        totalExpenseItems: string;
      }>(),
    ]);

    const totalRevenue = Number(salesResult?.totalRevenue ?? 0);

    const totalCollected = Number(salesResult?.totalCollected ?? 0);

    const totalDebt = Number(salesResult?.totalDebt ?? 0);

    const totalExpenses = Number(expensesResult?.totalExpenses ?? 0);

    return {
      fromDate: query.fromDate ?? null,
      toDate: query.toDate ?? null,

      totalRevenue,
      totalCollected,
      totalDebt,
      totalExpenses,

      estimatedProfit: totalRevenue - totalExpenses,

      cashBalance: totalCollected - totalExpenses,

      totalSales: Number(salesResult?.totalSales ?? 0),

      totalExpenseItems: Number(expensesResult?.totalExpenseItems ?? 0),
    };
  }
}
