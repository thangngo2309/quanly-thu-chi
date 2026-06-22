import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';

import { Sale } from '../sales/entities/sale.entity';
import { CreatePublicDebtLinkDto } from './dto/create-public-debt-link.dto';
import { PublicDebtQueryDto } from './dto/public-debt-query.dto';

type PublicDebtTokenPayload = {
  customerName: string;
  exp: number;
};

@Injectable()
export class PublicDebtsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    private readonly configService: ConfigService,
  ) {}

  async createPublicLink(dto: CreatePublicDebtLinkDto) {
    const customerName = dto.customerName.trim();

    const canonicalCustomerName =
      await this.findCanonicalCustomerName(customerName);

    const ttlDays = Number(
      this.configService.get<string>('PUBLIC_DEBT_LINK_TTL_DAYS') ?? 30,
    );

    const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;

    const token = this.createToken({
      customerName: canonicalCustomerName,
      exp: expiresAt,
    });

    return {
      customerName: canonicalCustomerName,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async getPublicDebtOverview(query: PublicDebtQueryDto) {
    const customerName = this.resolveAuthorizedCustomer(query);

    const payload = this.verifyToken(query.token);

    if (
      this.normalizeCustomerName(payload.customerName) !==
      this.normalizeCustomerName(customerName)
    ) {
      throw new ForbiddenException('Đường dẫn công nợ không hợp lệ');
    }

    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .where(`COALESCE(sale.remainingAmount, 0) > 0`)
      .andWhere(
        `
              LOWER(TRIM(sale.customerName))
              =
              LOWER(TRIM(:customerName))
            `,
        {
          customerName: payload.customerName,
        },
      )
      .orderBy('sale.saleDate', 'ASC')
      .addOrderBy('sale.createdAt', 'ASC')
      .getMany();

    const summary = sales.reduce(
      (result, sale) => ({
        totalOrders: result.totalOrders + 1,

        totalAmount: result.totalAmount + Number(sale.totalAmount ?? 0),

        totalPaid: result.totalPaid + Number(sale.paidAmount ?? 0),

        totalDebt: result.totalDebt + Number(sale.remainingAmount ?? 0),
      }),
      {
        totalOrders: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalDebt: 0,
      },
    );

    return {
      customerName: payload.customerName,

      generatedAt: new Date().toISOString(),

      summary,

      items: sales.map((sale) => ({
        saleId: sale.id,
        saleDate: sale.saleDate,
        content: sale.content,
        totalAmount: Number(sale.totalAmount),
        paidAmount: Number(sale.paidAmount),
        remainingAmount: Number(sale.remainingAmount),
        paymentStatus: sale.paymentStatus,
        confirmationStatus: sale.pendingDebtPaymentRequestId
          ? 'PENDING'
          : 'NONE',
      })),
    };
  }

  private async findCanonicalCustomerName(
    customerName: string,
  ): Promise<string> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .select('sale.customerName', 'customerName')
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
      .orderBy('sale.createdAt', 'DESC')
      .getRawOne<{
        customerName: string;
      }>();

    const canonicalName = result?.customerName?.trim();

    if (!canonicalName) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return canonicalName;
  }

  private createToken(payload: PublicDebtTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );

    const signature = this.createSignature(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): PublicDebtTokenPayload {
    const [encodedPayload, receivedSignature] = token.split('.');

    if (!encodedPayload || !receivedSignature) {
      throw new ForbiddenException('Đường dẫn công nợ không hợp lệ');
    }

    const expectedSignature = this.createSignature(encodedPayload);

    const receivedBuffer = Buffer.from(receivedSignature);

    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException('Đường dẫn công nợ không hợp lệ');
    }

    let payload: PublicDebtTokenPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as PublicDebtTokenPayload;
    } catch {
      throw new ForbiddenException('Đường dẫn công nợ không hợp lệ');
    }

    if (!payload.customerName || !payload.exp || payload.exp < Date.now()) {
      throw new ForbiddenException(
        'Đường dẫn công nợ đã hết hạn hoặc không hợp lệ',
      );
    }

    return payload;
  }

  private createSignature(encodedPayload: string): string {
    const secret = this.configService.get<string>('PUBLIC_DEBT_LINK_SECRET');

    if (!secret) {
      throw new InternalServerErrorException(
        'Chưa cấu hình PUBLIC_DEBT_LINK_SECRET',
      );
    }

    return createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
  }

  private normalizeCustomerName(value: string): string {
    return value.trim().toLocaleLowerCase('vi-VN');
  }

  resolveAuthorizedCustomer(query: PublicDebtQueryDto): string {
    const customerName = query.customerName.trim();

    const payload = this.verifyToken(query.token);

    if (
      this.normalizeCustomerName(payload.customerName) !==
      this.normalizeCustomerName(customerName)
    ) {
      throw new ForbiddenException('Đường dẫn công nợ không hợp lệ');
    }

    return payload.customerName.trim();
  }
}
