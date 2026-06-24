import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Expense } from '../expenses/entities/expense.entity';
import { Sale } from '../sales/entities/sale.entity';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async getSummary(query: DashboardSummaryQueryDto) {
    const salesQuery = this.saleRepository.createQueryBuilder('sale');
    const expensesQuery = this.expenseRepository.createQueryBuilder('expense');
    const topDebtorsQuery = this.saleRepository
      .createQueryBuilder('sale')
      .select(`MAX(TRIM(sale.customerName))`, 'customerName')
      .addSelect(`COUNT(sale.id)`, 'debtCount')
      .addSelect(` COALESCE( SUM(sale.remainingAmount), 0 ) `, 'totalDebt')
      .where(` COALESCE( sale.remainingAmount, 0 ) > 0 `);
    if (query.fromDate) {
      salesQuery.andWhere('sale.saleDate >= :fromDate', {
        fromDate: query.fromDate,
      });
      expensesQuery.andWhere('expense.expenseDate >= :fromDate', {
        fromDate: query.fromDate,
      });
      topDebtorsQuery.andWhere('sale.saleDate >= :fromDate', {
        fromDate: query.fromDate,
      });
    }
    if (query.toDate) {
      salesQuery.andWhere('sale.saleDate <= :toDate', { toDate: query.toDate });
      expensesQuery.andWhere('expense.expenseDate <= :toDate', {
        toDate: query.toDate,
      });
      topDebtorsQuery.andWhere('sale.saleDate <= :toDate', {
        toDate: query.toDate,
      });
    }
    const [sales, expenses, rawTopDebtors] = await Promise.all([
      salesQuery.getMany(),
      expensesQuery.getMany(),
      topDebtorsQuery
        .groupBy(` LOWER( TRIM(sale.customerName) ) `)
        .orderBy(` SUM( sale.remainingAmount ) `, 'DESC')
        .limit(15)
        .getRawMany<{
          customerName: string;
          debtCount: string;
          totalDebt: string;
        }>(),
    ]);
    const totalRevenue = sales.reduce(
      (total, sale) => total + Number(sale.totalAmount ?? 0),
      0,
    );
    const totalCollected = sales.reduce(
      (total, sale) => total + Number(sale.paidAmount ?? 0),
      0,
    );
    const totalDebt = sales.reduce(
      (total, sale) => total + Number(sale.remainingAmount ?? 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (total, expense) => total + Number(expense.amount ?? 0),
      0,
    );
    const topDebtors = rawTopDebtors.map((item, index) => ({
      rank: index + 1,
      customerName: item.customerName,
      debtCount: Number(item.debtCount ?? 0),
      totalDebt: Number(item.totalDebt ?? 0),
    }));
    return {
      fromDate: query.fromDate ?? null,
      toDate: query.toDate ?? null,
      totalRevenue,
      totalCollected,
      totalDebt,
      totalExpenses,
      estimatedProfit: totalRevenue - totalExpenses,
      cashBalance: totalCollected - totalExpenses,
      totalSales: sales.length,
      totalExpenseItems: expenses.length,
      topDebtors,
    };
  }
}
