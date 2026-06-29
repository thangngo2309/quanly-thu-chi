import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PaymentStatus } from '../common/enums/payment-status.enum';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';
import { CustomerSuggestionQueryDto } from './dto/customer-suggestion-query.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const totalAmount = Number(createSaleDto.totalAmount);
    const paidAmount = Number(createSaleDto.paidAmount ?? 0);

    this.validateAmounts(totalAmount, paidAmount);

    const sale = this.saleRepository.create({
      customerName: createSaleDto.customerName.trim(),
      content: createSaleDto.content.trim(),
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      paymentStatus: this.resolvePaymentStatus(totalAmount, paidAmount),
      saleDate: createSaleDto.saleDate ?? new Date().toISOString().slice(0, 10),
      note: createSaleDto.note?.trim() || null,
      deliveryAt: createSaleDto.deliveryAt
        ? new Date(createSaleDto.deliveryAt)
        : null,
      isDelivered: false,
    });

    return this.saleRepository.save(sale);
  }

  async findAll(query: QuerySalesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.saleRepository.createQueryBuilder('sale');

    if (query.q?.trim()) {
      queryBuilder.andWhere(
        `(
            sale.customerName ILIKE :keyword
            OR sale.content ILIKE :keyword
            OR sale.note ILIKE :keyword
          )`,
        {
          keyword: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.paymentStatus) {
      queryBuilder.andWhere('sale.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('sale.saleDate >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('sale.saleDate <= :toDate', {
        toDate: query.toDate,
      });
    }

    queryBuilder
      .orderBy('sale.deliveryAt', 'ASC', 'NULLS LAST')
      .addOrderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: {
        id,
      },
    });

    if (!sale) {
      throw new NotFoundException('Không tìm thấy khoản doanh thu');
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);

      const sale = await saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id = :id', {
          id,
        })
        .getOne();

      if (!sale) {
        throw new NotFoundException('Không tìm thấy khoản thu');
      }

      if (sale.pendingDebtPaymentRequestId) {
        throw new ConflictException('Khoản thu đang chờ xác nhận thanh toán');
      }

      const totalAmount = Number(updateSaleDto.totalAmount ?? sale.totalAmount);

      const paidAmount = Number(updateSaleDto.paidAmount ?? sale.paidAmount);

      this.validateAmounts(totalAmount, paidAmount);

      if (updateSaleDto.customerName !== undefined) {
        const customerName = updateSaleDto.customerName.trim();

        if (!customerName) {
          throw new BadRequestException('Tên khách hàng không được để trống');
        }

        sale.customerName = customerName;
      }

      if (updateSaleDto.content !== undefined) {
        const content = updateSaleDto.content.trim();

        if (!content) {
          throw new BadRequestException(
            'Nội dung khoản thu không được để trống',
          );
        }

        sale.content = content;
      }

      sale.totalAmount = totalAmount;
      sale.paidAmount = paidAmount;

      sale.remainingAmount = totalAmount - paidAmount;

      sale.paymentStatus = this.resolvePaymentStatus(totalAmount, paidAmount);

      if (updateSaleDto.saleDate !== undefined) {
        sale.saleDate = updateSaleDto.saleDate;
      }

      if (updateSaleDto.note !== undefined) {
        sale.note = updateSaleDto.note?.trim() || null;
      }

      if (updateSaleDto.deliveryAt !== undefined) {
        sale.deliveryAt = updateSaleDto.deliveryAt
          ? new Date(updateSaleDto.deliveryAt)
          : null;
      }

      return saleRepository.save(sale);
    });
  }

  async remove(id: string): Promise<void> {
    const sale = await this.findOne(id);

    await this.saleRepository.remove(sale);
  }

  private validateAmounts(totalAmount: number, paidAmount: number): void {
    if (totalAmount < 0 || paidAmount < 0) {
      throw new BadRequestException('Số tiền không được nhỏ hơn 0');
    }

    if (paidAmount > totalAmount) {
      throw new BadRequestException(
        'Số tiền đã thanh toán không được lớn hơn tổng tiền',
      );
    }
  }

  private resolvePaymentStatus(
    totalAmount: number,
    paidAmount: number,
  ): PaymentStatus {
    if (paidAmount <= 0) {
      return PaymentStatus.UNPAID;
    }

    if (paidAmount >= totalAmount) {
      return PaymentStatus.PAID;
    }

    return PaymentStatus.PARTIAL;
  }

  async getCustomerSuggestions(
    query: CustomerSuggestionQueryDto,
  ): Promise<string[]> {
    const keyword = query.q?.trim() ?? '';
    const limit = query.limit ?? 20;

    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .select('sale.customerName', 'customerName')
      .addSelect('MAX(sale.saleDate)', 'lastSaleDate')
      .where(`TRIM(COALESCE(sale.customerName, '')) <> ''`);

    if (keyword) {
      queryBuilder.andWhere('sale.customerName ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    const rows = await queryBuilder
      .groupBy('sale.customerName')
      .orderBy('MAX(sale.saleDate)', 'DESC')
      .limit(limit)
      .getRawMany<{
        customerName: string;
        lastSaleDate: string;
      }>();

    const uniqueCustomers = new Map<string, string>();

    for (const row of rows) {
      const customerName = row.customerName?.trim();

      if (!customerName) {
        continue;
      }

      const normalizedName = customerName.toLocaleLowerCase('vi-VN');

      if (!uniqueCustomers.has(normalizedName)) {
        uniqueCustomers.set(normalizedName, customerName);
      }
    }

    return Array.from(uniqueCustomers.values()).slice(0, limit);
  }

  async markAsDelivered(id: string): Promise<Sale> {
    const sale = await this.findOne(id);

    if (sale.isDelivered) {
      return sale;
    }

    sale.isDelivered = true;

    return this.saleRepository.save(sale);
  }
}
