import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { randomBytes } from 'node:crypto';

import { User } from '../users/entities/user.entity';
import { Sale } from '../sales/entities/sale.entity';
import { CreatePublicPaymentRequestDto } from './dto/create-public-payment-request.dto';
import { PublicDebtQueryDto } from './dto/public-debt-query.dto';
import { ReviewDebtPaymentRequestDto } from './dto/review-debt-payment-request.dto';
import { DebtPaymentRequestItem } from './entities/debt-payment-request-item.entity';
import { DebtPaymentRequest } from './entities/debt-payment-request.entity';
import { PublicDebtsService } from './public-debts.service';
import {
  DebtPaymentRequestScope,
  DebtPaymentRequestStatus,
} from 'src/common/enums/debt-payment-request.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

@Injectable()
export class DebtPaymentRequestsService {
  constructor(
    private readonly dataSource: DataSource,

    private readonly publicDebtsService: PublicDebtsService,
  ) {}

  async createPublicRequest(
    query: PublicDebtQueryDto,
    dto: CreatePublicPaymentRequestDto,
  ) {
    const customerName =
      this.publicDebtsService.resolveAuthorizedCustomer(query);

    return this.dataSource.transaction(async (manager) => {
      const saleRepository = manager.getRepository(Sale);

      let salesQuery = saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where(
          `
                  LOWER(TRIM(sale.customerName))
                  =
                  LOWER(TRIM(:customerName))
                `,
          {
            customerName,
          },
        )
        .andWhere(
          `
                  COALESCE(
                    sale.remainingAmount,
                    0
                  ) > 0
                `,
        );

      if (dto.scope === DebtPaymentRequestScope.SINGLE) {
        if (!dto.saleId) {
          throw new BadRequestException('Thiếu khoản công nợ cần thanh toán');
        }

        salesQuery = salesQuery.andWhere('sale.id = :saleId', {
          saleId: dto.saleId,
        });
      }

      const sales = await salesQuery
        .orderBy('sale.saleDate', 'ASC')
        .addOrderBy('sale.createdAt', 'ASC')
        .getMany();

      if (sales.length === 0) {
        throw new NotFoundException('Không tìm thấy khoản công nợ phù hợp');
      }

      const pendingSale = sales.find((sale) =>
        Boolean(sale.pendingDebtPaymentRequestId),
      );

      if (pendingSale) {
        throw new ConflictException(
          'Có khoản công nợ đang chờ xác nhận thanh toán',
        );
      }

      const amount = sales.reduce(
        (total, sale) => total + Number(sale.remainingAmount),
        0,
      );

      if (amount <= 0) {
        throw new BadRequestException('Khách hàng không còn công nợ');
      }

      const requestRepository = manager.getRepository(DebtPaymentRequest);

      const itemRepository = manager.getRepository(DebtPaymentRequestItem);

      const request = requestRepository.create({
        code: this.generateRequestCode(),

        customerName,

        scope: dto.scope,

        status: DebtPaymentRequestStatus.PENDING,

        amount,

        reviewedByUserId: null,

        reviewedAt: null,

        reviewNote: null,
      });

      const savedRequest = await requestRepository.save(request);

      const items = sales.map((sale) =>
        itemRepository.create({
          requestId: savedRequest.id,

          saleId: sale.id,

          requestedAmount: Number(sale.remainingAmount),
        }),
      );

      await itemRepository.save(items);

      for (const sale of sales) {
        sale.pendingDebtPaymentRequestId = savedRequest.id;
      }

      await saleRepository.save(sales);

      return {
        id: savedRequest.id,
        code: savedRequest.code,
        customerName,
        amount,
        status: savedRequest.status,
        itemCount: items.length,
      };
    });
  }

  async findPending() {
    return this.dataSource
      .getRepository(DebtPaymentRequest)
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.items', 'item')
      .leftJoinAndSelect('item.sale', 'sale')
      .where('request.status = :status', {
        status: DebtPaymentRequestStatus.PENDING,
      })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async approve(
    id: string,
    dto: ReviewDebtPaymentRequestDto,
    currentUser: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const requestRepository = manager.getRepository(DebtPaymentRequest);

      const itemRepository = manager.getRepository(DebtPaymentRequestItem);

      const saleRepository = manager.getRepository(Sale);

      /**
       * Chỉ khóa bảng request.
       * Không LEFT JOIN khi đang dùng pessimistic_write.
       */
      const request = await requestRepository
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.id = :id', {
          id,
        })
        .getOne();

      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu thanh toán');
      }

      if (request.status !== DebtPaymentRequestStatus.PENDING) {
        throw new ConflictException('Yêu cầu thanh toán này đã được xử lý');
      }

      /**
       * Lấy danh sách khoản thu thuộc yêu cầu.
       */
      const requestItems = await itemRepository.find({
        where: {
          requestId: request.id,
        },
      });

      if (requestItems.length === 0) {
        throw new ConflictException(
          'Yêu cầu thanh toán không có khoản công nợ nào',
        );
      }

      const saleIds = requestItems.map((item) => item.saleId);

      /**
       * Khóa riêng các bản ghi Sale.
       */
      const sales = await saleRepository
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.id IN (:...saleIds)', {
          saleIds,
        })
        .getMany();

      if (sales.length !== saleIds.length) {
        throw new ConflictException('Một số khoản công nợ không còn tồn tại');
      }

      for (const sale of sales) {
        if (sale.pendingDebtPaymentRequestId !== request.id) {
          throw new ConflictException(
            `Khoản thu "${sale.content}" không còn ở trạng thái chờ xác nhận`,
          );
        }

        if (Number(sale.remainingAmount) <= 0) {
          throw new ConflictException(
            `Khoản thu "${sale.content}" đã được thanh toán`,
          );
        }

        sale.paidAmount = Number(sale.totalAmount);

        sale.remainingAmount = 0;

        sale.paymentStatus = PaymentStatus.PAID;

        sale.pendingDebtPaymentRequestId = null;
      }

      await saleRepository.save(sales);

      request.status = DebtPaymentRequestStatus.APPROVED;

      request.reviewedByUserId = currentUser.id;

      request.reviewedAt = new Date();

      request.reviewNote = dto.note?.trim() || null;

      await requestRepository.save(request);

      return {
        message: 'Đã xác nhận thanh toán thành công',

        requestId: request.id,

        paidSales: sales.length,

        amount: Number(request.amount),
      };
    });
  }

  async reject(
    id: string,
    dto: ReviewDebtPaymentRequestDto,
    currentUser: User,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const requestRepository = manager.getRepository(DebtPaymentRequest);
      const itemRepository = manager.getRepository(DebtPaymentRequestItem);
      const saleRepository = manager.getRepository(Sale);
      const request = await requestRepository
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.id = :id', { id })
        .getOne();
      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu thanh toán');
      }
      if (request.status !== DebtPaymentRequestStatus.PENDING) {
        throw new ConflictException('Yêu cầu thanh toán này đã được xử lý');
      }
      const requestItems = await itemRepository.find({
        where: { requestId: request.id },
      });
      const saleIds = requestItems.map((item) => item.saleId);
      if (saleIds.length > 0) {
        const sales = await saleRepository
          .createQueryBuilder('sale')
          .setLock('pessimistic_write')
          .where('sale.id IN (:...saleIds)', { saleIds })
          .getMany();
        for (const sale of sales) {
          if (sale.pendingDebtPaymentRequestId === request.id) {
            sale.pendingDebtPaymentRequestId = null;
          }
        }
        await saleRepository.save(sales);
      }
      request.status = DebtPaymentRequestStatus.REJECTED;
      request.reviewedByUserId = currentUser.id;
      request.reviewedAt = new Date();
      request.reviewNote = dto.note?.trim() || null;
      await requestRepository.save(request);
      return {
        message: 'Đã từ chối yêu cầu thanh toán',
        requestId: request.id,
      };
    });
  }

  private generateRequestCode(): string {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');

    const random = randomBytes(3).toString('hex').toUpperCase();

    return `TT-${date}-${random}`;
  }
}
