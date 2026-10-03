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
   * Token mới sẽ KHÔNG tạo exp nữa.
   * Token cũ có exp vẫn được chấp nhận,
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
   * Tạo token cho trang công nợ của khách hàng.
   *
   * Trước đây token có:
   *
   * {
   *   customerName,
   *   exp
   * }
   *
   * Từ phiên bản này token chỉ còn:
   *
   * {
   *   customerName
   * }
   *
   * => Token không hết hạn.
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
   *
   * Giữ logic lấy công nợ như hiện tại.
   *
   * Điểm quan trọng:
   * - customerName + token phải được xác thực trước.
   * - token mới không hết hạn.
   * - token cũ có exp vẫn dùng được.
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

    const normalizedCustomerName = this.normalizeCustomerName(customerName);

    const items = await this.saleRepository
      .createQueryBuilder('sale')
      .where(`LOWER(TRIM(sale."customerName")) = :customerName`, {
        customerName: normalizedCustomerName,
      })
      .andWhere(`sale."remainingAmount" > 0`)
      .orderBy(`sale."saleDate"`, 'ASC')
      .addOrderBy(`sale."id"`, 'ASC')
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
   * Method này được public để:
   *
   * - GET /public/debts
   * - POST /public/debts/payment-requests
   * - GET /public/debts/export-pdf
   *
   * cùng dùng chung một cơ chế xác thực.
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

    if (requestCustomerName !== tokenCustomerName) {
      throw new ForbiddenException('Liên kết công nợ không hợp lệ.');
    }

    const canonicalCustomerName =
      await this.findCanonicalCustomerName(customerName);

    if (!canonicalCustomerName) {
      throw new NotFoundException(
        'Không tìm thấy thông tin công nợ của khách hàng.',
      );
    }

    /**
     * Kiểm tra lần nữa bằng tên canonical trong DB.
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
   * Ví dụ DB lưu:
   *
   *   Công ty ABC
   *
   * request:
   *
   *   công ty abc
   *
   * vẫn trả lại:
   *
   *   Công ty ABC
   */
  private async findCanonicalCustomerName(
    customerName: string,
  ): Promise<string | null> {
    const normalizedCustomerName = this.normalizeCustomerName(customerName);

    if (!normalizedCustomerName) {
      return null;
    }

    const sale = await this.saleRepository
      .createQueryBuilder('sale')
      .select(`sale."customerName"`, 'customerName')
      .where(`LOWER(TRIM(sale."customerName")) = :customerName`, {
        customerName: normalizedCustomerName,
      })
      .orderBy(`sale."id"`, 'DESC')
      .getRawOne<{
        customerName?: string;
      }>();

    const result = sale?.customerName?.trim();

    return result || null;
  }

  /**
   * ============================================================
   * CREATE TOKEN
   * ============================================================
   *
   * TOKEN MỚI KHÔNG CÒN EXP.
   *
   * Format:
   *
   * base64url(payload).signature
   *
   * payload:
   *
   * {
   *   "customerName": "Khách hàng A"
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
   * Quan trọng:
   *
   * KHÔNG kiểm tra payload.exp nữa.
   *
   * Nhờ đó:
   *
   * 1. Token mới không có exp -> dùng vĩnh viễn.
   *
   * 2. Token cũ:
   *
   * {
   *   customerName,
   *   exp
   * }
   *
   * vẫn dùng được kể cả exp đã qua.
   *
   * Chữ ký HMAC vẫn được kiểm tra bình thường nên người dùng
   * không thể tự sửa customerName trong token.
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
     * ==========================================================
     * KHÔNG KIỂM TRA EXP
     * ==========================================================
     *
     * Code cũ có dạng:
     *
     * if (!payload.exp || payload.exp < Date.now()) {
     *   throw new ForbiddenException(...);
     * }
     *
     * ĐÃ BỎ.
     *
     * payload.exp vẫn được phép tồn tại để các token cũ
     * tiếp tục xác thực thành công.
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
