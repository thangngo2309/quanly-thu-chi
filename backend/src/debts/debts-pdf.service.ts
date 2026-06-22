import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import PDFDocument = require('pdfkit');

import { Sale } from '../sales/entities/sale.entity';
import { DebtsService } from './debts.service';
import { DebtQueryDto } from './dto/debt-query.dto';
import { join } from 'node:path';

type PdfColumn = {
  key: 'index' | 'date' | 'customer' | 'content' | 'total' | 'paid' | 'debt';
  title: string;
  width: number;
  align?: 'left' | 'center' | 'right';
};

@Injectable()
export class DebtsPdfService {
  constructor(private readonly debtsService: DebtsService) {}

  async exportPdf(query: DebtQueryDto): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const customerName = query.customerName?.trim();
    if (!customerName) {
      throw new BadRequestException(
        'Vui lòng chọn khách hàng trước khi xuất PDF công nợ',
      );
    }
    const normalizedQuery: DebtQueryDto = { ...query, customerName };
    const debts = await this.debtsService.findAllForExport(query);

    const regularFont = this.resolveFont([
      '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/TTF/DejaVuSans.ttf',
    ]);

    const boldFont = this.resolveFont([
      '/usr/share/fonts/ttf-dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    ]);

    const document = new PDFDocument({
      size: 'A4',
      margin: 36,
      bufferPages: true,
      info: {
        Title: 'Báo cáo công nợ',
        Author: 'Hệ thống quản lý thu chi',
      },
    });

    document.registerFont('Regular', regularFont);

    document.registerFont('Bold', boldFont);

    const chunks: Buffer[] = [];

    const finished = new Promise<Buffer>((resolve, reject) => {
      document.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      document.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      document.on('error', reject);
    });

    const summary = this.calculateSummary(debts);

    this.renderHeader(document, query, summary);

    this.renderTable(document, debts);

    this.renderPageNumbers(document);

    document.end();

    const buffer = await finished;

    return {
      buffer,
      fileName: this.createFileName(query),
    };
  }

  private renderHeader(
    document: PDFKit.PDFDocument,
    query: DebtQueryDto,
    summary: {
      totalOrders: number;
      totalRevenue: number;
      totalCollected: number;
      totalDebt: number;
    },
  ): void {
    const logoPath = join(process.cwd(), 'assets', 'logo-bep-chieu.png');

    const titleStartX = 110;

    if (existsSync(logoPath)) {
      document.image(logoPath, 36, 26, {
        fit: [64, 64],
        align: 'center',
        valign: 'center',
      });
    }
    document
      .font('Bold')
      .fontSize(17)
      .fillColor('#1f2937')
      .text('BẢNG ĐỐI CHIẾU CÔNG NỢ', titleStartX, 34, {
        width: document.page.width - titleStartX - 36,

        align: 'center',
      });

    document
      .font('Bold')
      .fontSize(12)
      .fillColor('#2563eb')
      .text(query.customerName?.trim() ?? '', titleStartX, 58, {
        width: document.page.width - titleStartX - 36,

        align: 'center',
      });

    document.y = 104;
    
    document.moveDown(0.5);

    document
      .font('Regular')
      .fontSize(9.5)
      .fillColor('#4b5563')
      .text(this.getFilterDescription(query), {
        align: 'center',
      });

    document.moveDown(1);

    const startX = 36;
    const startY = document.y;
    const availableWidth = document.page.width - 72;

    const boxWidth = availableWidth / 4;

    const summaryItems = [
      {
        label: 'Số khoản nợ',
        value: summary.totalOrders.toLocaleString('vi-VN'),
      },
      {
        label: 'Tổng doanh thu',
        value: this.formatMoney(summary.totalRevenue),
      },
      {
        label: 'Đã thanh toán',
        value: this.formatMoney(summary.totalCollected),
      },
      {
        label: 'Tổng công nợ',
        value: this.formatMoney(summary.totalDebt),
      },
    ];

    summaryItems.forEach((item, index) => {
      const x = startX + index * boxWidth;

      document
        .roundedRect(x + 2, startY, boxWidth - 4, 48, 4)
        .fillAndStroke(index === 3 ? '#fff1f2' : '#f8fafc', '#d1d5db');

      document
        .font('Regular')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(item.label, x + 8, startY + 8, {
          width: boxWidth - 16,
          align: 'center',
        });

      document
        .font('Bold')
        .fontSize(9.5)
        .fillColor(index === 3 ? '#dc2626' : '#111827')
        .text(item.value, x + 8, startY + 25, {
          width: boxWidth - 16,
          align: 'center',
        });
    });

    document.y = startY + 62;
  }

  private renderTable(document: PDFKit.PDFDocument, debts: Sale[]): void {
    const columns: PdfColumn[] = [
      {
        key: 'index',
        title: 'STT',
        width: 28,
        align: 'center',
      },
      {
        key: 'date',
        title: 'Ngày',
        width: 56,
        align: 'center',
      },
      {
        key: 'customer',
        title: 'Khách hàng',
        width: 100,
      },
      {
        key: 'content',
        title: 'Nội dung',
        width: 124,
      },
      {
        key: 'total',
        title: 'Tổng tiền',
        width: 71,
        align: 'right',
      },
      {
        key: 'paid',
        title: 'Đã thu',
        width: 71,
        align: 'right',
      },
      {
        key: 'debt',
        title: 'Còn nợ',
        width: 71,
        align: 'right',
      },
    ];

    let currentY = this.renderTableHeader(document, columns, document.y);

    if (debts.length === 0) {
      document
        .font('Regular')
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Không có khoản công nợ phù hợp với bộ lọc.', 36, currentY + 16, {
          width: document.page.width - 72,
          align: 'center',
        });

      return;
    }

    debts.forEach((sale, index) => {
      document.font('Regular').fontSize(8.2);

      const rowHeight = Math.max(
        28,

        document.heightOfString(sale.customerName, {
          width: 92,
        }) + 10,

        document.heightOfString(sale.content, {
          width: 116,
        }) + 10,
      );

      const pageBottom = document.page.height - 48;

      if (currentY + rowHeight > pageBottom) {
        document.addPage();

        currentY = this.renderTableHeader(document, columns, 40);
      }

      const backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

      document.rect(36, currentY, 521, rowHeight).fill(backgroundColor);

      let currentX = 36;

      const values: Record<PdfColumn['key'], string> = {
        index: String(index + 1),

        date: this.formatDate(sale.saleDate),

        customer: sale.customerName,

        content: sale.content,

        total: this.formatMoney(Number(sale.totalAmount)),

        paid: this.formatMoney(Number(sale.paidAmount)),

        debt: this.formatMoney(Number(sale.remainingAmount)),
      };

      columns.forEach((column) => {
        document
          .rect(currentX, currentY, column.width, rowHeight)
          .stroke('#d1d5db');

        document
          .font(column.key === 'debt' ? 'Bold' : 'Regular')
          .fontSize(8.2)
          .fillColor(column.key === 'debt' ? '#dc2626' : '#1f2937')
          .text(values[column.key], currentX + 4, currentY + 6, {
            width: column.width - 8,

            align: column.align ?? 'left',
          });

        currentX += column.width;
      });

      currentY += rowHeight;
    });
  }

  private renderTableHeader(
    document: PDFKit.PDFDocument,
    columns: PdfColumn[],
    y: number,
  ): number {
    const headerHeight = 28;

    let currentX = 36;

    columns.forEach((column) => {
      document
        .rect(currentX, y, column.width, headerHeight)
        .fillAndStroke('#2563eb', '#d1d5db');

      document
        .font('Bold')
        .fontSize(8.2)
        .fillColor('#ffffff')
        .text(column.title, currentX + 3, y + 9, {
          width: column.width - 6,

          align: column.align ?? 'center',
        });

      currentX += column.width;
    });

    return y + headerHeight;
  }

  private renderPageNumbers(document: PDFKit.PDFDocument): void {
    const range = document.bufferedPageRange();

    for (let index = 0; index < range.count; index += 1) {
      document.switchToPage(index);

      document
        .font('Regular')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          `Trang ${index + 1}/${range.count}`,
          36,
          document.page.height - 30,
          {
            width: document.page.width - 72,
            align: 'right',
          },
        );
    }
  }

  private calculateSummary(debts: Sale[]) {
    return debts.reduce(
      (summary, sale) => ({
        totalOrders: summary.totalOrders + 1,

        totalRevenue: summary.totalRevenue + Number(sale.totalAmount ?? 0),

        totalCollected: summary.totalCollected + Number(sale.paidAmount ?? 0),

        totalDebt: summary.totalDebt + Number(sale.remainingAmount ?? 0),
      }),
      {
        totalOrders: 0,
        totalRevenue: 0,
        totalCollected: 0,
        totalDebt: 0,
      },
    );
  }

  private getFilterDescription(query: DebtQueryDto): string {
    const parts: string[] = [];

    if (query.fromDate && query.toDate) {
      parts.push(
        `Từ ${this.formatDate(query.fromDate)} đến ${this.formatDate(
          query.toDate,
        )}`,
      );
    } else if (query.fromDate) {
      parts.push(`Từ ngày ${this.formatDate(query.fromDate)}`);
    } else if (query.toDate) {
      parts.push(`Đến ngày ${this.formatDate(query.toDate)}`);
    } else {
      parts.push('Thời gian: Toàn bộ');
    }

    return parts.join(' - ');
  }

  private formatMoney(value: number): string {
    return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
  }

  private createFileName(query: DebtQueryDto): string {
    const customerName = query.customerName?.trim() || 'khach-hang';

    const normalizedCustomerName = customerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    const fromDate = query.fromDate || 'tu-dau';

    const toDate = query.toDate || 'hien-tai';

    return (
      ['cong-no', normalizedCustomerName, fromDate, toDate].join('_') + '.pdf'
    );
  }

  private resolveFont(paths: string[]): string {
    const fontPath = paths.find((item) => existsSync(item));

    if (!fontPath) {
      throw new InternalServerErrorException(
        `Không tìm thấy font Unicode để tạo PDF. Các đường dẫn đã kiểm tra: ${paths.join(
          ', ',
        )}`,
      );
    }

    return fontPath;
  }
}
