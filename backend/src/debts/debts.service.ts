import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Sale } from '../sales/entities/sale.entity';
import { DebtQueryDto } from './dto/debt-query.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async findAll(query: DebtQueryDto) {
    this.validateDateRange(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const baseQuery = this.createBaseQuery(query);

    const [items, total] = await baseQuery
      .clone()
      .orderBy('sale.saleDate', 'DESC')
      .addOrderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const rawSummary = await baseQuery
      .clone()
      .select('COUNT(sale.id)', 'totalOrders')
      .addSelect(`COALESCE(SUM(sale.totalAmount), 0)`, 'totalRevenue')
      .addSelect(`COALESCE(SUM(sale.paidAmount), 0)`, 'totalCollected')
      .addSelect(`COALESCE(SUM(sale.remainingAmount), 0)`, 'totalDebt')
      .getRawOne<{
        totalOrders: string;
        totalRevenue: string;
        totalCollected: string;
        totalDebt: string;
      }>();

    return {
      items,

      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },

      summary: {
        totalOrders: Number(rawSummary?.totalOrders ?? 0),

        totalRevenue: Number(rawSummary?.totalRevenue ?? 0),

        totalCollected: Number(rawSummary?.totalCollected ?? 0),

        totalDebt: Number(rawSummary?.totalDebt ?? 0),
      },
    };
  }

  async findAllForExport(query: DebtQueryDto): Promise<Sale[]> {
    this.validateDateRange(query);

    return this.createBaseQuery(query)
      .orderBy('sale.customerName', 'ASC')
      .addOrderBy('sale.saleDate', 'ASC')
      .addOrderBy('sale.createdAt', 'ASC')
      .getMany();
  }

  private createBaseQuery(query: DebtQueryDto): SelectQueryBuilder<Sale> {
    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .where(`COALESCE(sale.remainingAmount, 0) > 0`);

    const customerName = query.customerName?.trim();

    if (customerName) {
      queryBuilder.andWhere(
        ` LOWER(TRIM(sale.customerName)) = LOWER(TRIM(:customerName)) `,
        { customerName },
      );
    }

    if (query.fromDate) {
      queryBuilder.andWhere(`sale.saleDate >= :fromDate`, {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere(`sale.saleDate <= :toDate`, {
        toDate: query.toDate,
      });
    }

    return queryBuilder;
  }

  private validateDateRange(query: DebtQueryDto): void {
    if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
      throw new BadRequestException(
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }
  }
}
