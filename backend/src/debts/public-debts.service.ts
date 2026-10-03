import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';

import { Sale } from '../sales/entities/sale.entity';

type PublicDebtTokenPayload = {
  customerName: string;

  /**
   * Giữ optional để tương thích với token cũ.
   *
   * Token mới không tạo exp nữa.
   * Token cũ có exp vẫn tiếp tục được chấp nhận,
   * nhưng hệ thống không kiểm tra thời hạn.
   */
  exp?: number;
};

type PublicDebtAccessQuery = {
  customerName: string;
  token: string;
};

@Injectable()
export class PublicDebtsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    private readonly configService: ConfigService,
  ) {}

  /**
   * ============================================================
   * CREATE PUBLIC LINK
   * ============================================================
   *
   * Token mới không có thời hạn.
   *
   * Payload:
   *
   * {
   *   customerName: "Tên khách hàng"
   * }
   */
  async createPublicLink(customerName: string): Promise<{
    customerName: string;
    token: string;
  }> {
    const normalizedCustomerName = customerName.trim();

    if (!normalizedCustomerName) {
      throw new NotFoundException('Không xác định được khách hàng.');
    }

    const canonicalCustomerName = await this.findCanonicalCustomerName(
      normalizedCustomerName,
    );

    if (!canonicalCustomerName) {
      throw new NotFoundException(
        `Không tìm thấy dữ liệu của khách hàng ${normalizedCustomerName}.`,
      );
    }

    const token = this.createToken({
      customerName: canonicalCustomerName,
    });

    return {
      customerName: canonicalCustomerName,
      token,
    };
  }

  /**
   * ============================================================
   * GET PUBLIC DEBT OVERVIEW
   * ============================================================
   */
  async getPublicDebtOverview(query: PublicDebtAccessQuery): Promise<{
    customerName: string;
    items: Sale[];
    summary: {
      totalOrders: number;
      totalRevenue: number;
      totalCollected: number;
      totalDebt: number;
    };
  }> {
    const customerName = await this.resolveAuthorizedCustomer(query);

    /**
     * Không dùng:
     *
     * sale."customerName"
     * sale."remainingAmount"
     *
     * vì đây là tên property TypeScript chứ không phải
     * tên column thật trong PostgreSQL.
     *
     * Dùng property path của TypeORM để TypeORM tự map:
     *
     * customerName -> customer_name
     * remainingAmount -> remaining_amount
     * saleDate -> sale_date
     */
    const items = await this.saleRepository
      .createQueryBuilder('sale')
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
      )
      .orderBy('sale.saleDate', 'ASC')
      .addOrderBy('sale.id', 'ASC')
      .getMany();

    const summary = items.reduce(
      (result, item) => {
        result.totalOrders += 1;

        result.totalRevenue += Number(item.totalAmount ?? 0);

        result.totalCollected += Number(item.paidAmount ?? 0);

        result.totalDebt += Number(item.remainingAmount ?? 0);

        return result;
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        totalCollected: 0,
        totalDebt: 0,
      },
    );

    return {
      customerName,
      items,
      summary,
    };
  }

  /**
   * ============================================================
   * RESOLVE AUTHORIZED CUSTOMER
   * ============================================================
   *
   * Dùng chung cho:
   *
   * GET /public/debts
   * POST /public/debts/payment-requests
   * GET /public/debts/export-pdf
   */
  async resolveAuthorizedCustomer(
    query: PublicDebtAccessQuery,
  ): Promise<string> {
    const customerName = query.customerName?.trim();

    const token = query.token?.trim();

    if (!customerName || !token) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    const payload = this.verifyToken(token);

    const requestCustomerName = this.normalizeCustomerName(customerName);

    const tokenCustomerName = this.normalizeCustomerName(payload.customerName);

    /**
     * customerName trên URL phải đúng với
     * customerName nằm trong token.
     */
    if (requestCustomerName !== tokenCustomerName) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    /**
     * Lấy lại tên khách hàng canonical từ DB.
     *
     * Ví dụ:
     *
     * URL:
     * c508
     *
     * DB:
     * C508
     *
     * thì hệ thống trả lại đúng giá trị trong DB.
     */
    const canonicalCustomerName =
      await this.findCanonicalCustomerName(customerName);

    if (!canonicalCustomerName) {
      throw new NotFoundException(
        'Không tìm thấy thông tin công nợ của khách hàng.',
      );
    }

    /**
     * Kiểm tra lần cuối tên trong DB
     * phải khớp tên trong token.
     */
    if (
      this.normalizeCustomerName(canonicalCustomerName) !== tokenCustomerName
    ) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    return canonicalCustomerName;
  }

  /**
   * ============================================================
   * FIND CANONICAL CUSTOMER NAME
   * ============================================================
   *
   * Quan trọng:
   *
   * Không dùng:
   *
   * .select(`sale."customerName"`)
   *
   * vì PostgreSQL thực tế dùng customer_name.
   *
   * Ở đây lấy entity trực tiếp để TypeORM tự map column.
   */
  private async findCanonicalCustomerName(
    customerName: string,
  ): Promise<string | null> {
    const normalizedCustomerName = customerName.trim();

    if (!normalizedCustomerName) {
      return null;
    }

    const sale = await this.saleRepository
      .createQueryBuilder('sale')
      .where(
        `
          LOWER(TRIM(sale.customerName))
          =
          LOWER(TRIM(:customerName))
        `,
        {
          customerName: normalizedCustomerName,
        },
      )
      .orderBy('sale.id', 'DESC')
      .getOne();

    const result = sale?.customerName?.trim();

    return result || null;
  }

  /**
   * ============================================================
   * CREATE TOKEN
   * ============================================================
   *
   * Token mới KHÔNG có exp.
   *
   * Format:
   *
   * base64url(payload).signature
   *
   * Payload:
   *
   * {
   *   "customerName": "C508"
   * }
   */
  private createToken(payload: PublicDebtTokenPayload): string {
    const tokenPayload: PublicDebtTokenPayload = {
      customerName: payload.customerName.trim(),
    };

    const encodedPayload = Buffer.from(
      JSON.stringify(tokenPayload),
      'utf8',
    ).toString('base64url');

    const signature = this.createSignature(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  /**
   * ============================================================
   * VERIFY TOKEN
   * ============================================================
   *
   * Token mới:
   *
   * {
   *   customerName
   * }
   *
   * Token cũ:
   *
   * {
   *   customerName,
   *   exp
   * }
   *
   * Cả hai đều được chấp nhận.
   *
   * exp của token cũ KHÔNG còn được kiểm tra.
   */
  private verifyToken(token: string): PublicDebtTokenPayload {
    const parts = token.split('.');

    if (parts.length !== 2) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    const [encodedPayload, receivedSignature] = parts;

    if (!encodedPayload || !receivedSignature) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    const expectedSignature = this.createSignature(encodedPayload);

    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    /**
     * timingSafeEqual yêu cầu hai Buffer
     * có cùng length.
     */
    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    let payload: PublicDebtTokenPayload;

    try {
      const decodedPayload = Buffer.from(encodedPayload, 'base64url').toString(
        'utf8',
      );

      payload = JSON.parse(decodedPayload) as PublicDebtTokenPayload;
    } catch {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    if (
      !payload ||
      typeof payload.customerName !== 'string' ||
      !payload.customerName.trim()
    ) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    /**
     * QUAN TRỌNG:
     *
     * Không kiểm tra payload.exp.
     *
     * Điều này giúp:
     *
     * - token mới không hết hạn;
     * - token cũ dù exp đã qua vẫn dùng được;
     * - chữ ký HMAC vẫn được kiểm tra,
     *   nên người dùng không thể tự thay customerName.
     */

    return payload;
  }

  /**
   * ============================================================
   * CREATE SIGNATURE
   * ============================================================
   */
  private createSignature(encodedPayload: string): string {
    const secret = this.configService.get<string>('PUBLIC_DEBT_LINK_SECRET');

    if (!secret?.trim()) {
      throw new InternalServerErrorException(
        'Chưa cấu hình PUBLIC_DEBT_LINK_SECRET.',
      );
    }

    return createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
  }

  /**
   * ============================================================
   * NORMALIZE CUSTOMER NAME
   * ============================================================
   */
  private normalizeCustomerName(value: string): string {
    return value.trim().toLocaleLowerCase('vi-VN');
  }
}
