import {
    BadRequestException,
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import ExcelJS from 'exceljs';
  import { Repository } from 'typeorm';
  
  import { Expense } from '../expenses/entities/expense.entity';
  import { Sale } from '../sales/entities/sale.entity';
  import { ExportReportQueryDto } from './dto/export-report-query.dto';
  
  type LedgerItem = {
    date: string;
    createdAt: Date;
    type: 'THU' | 'CHI';
    partner: string;
    content: string;
    revenue: number;
    collected: number;
    debt: number;
    expense: number;
    status: string;
    note: string;
  };
  
  @Injectable()
  export class ReportsService {
    constructor(
      @InjectRepository(Sale)
      private readonly saleRepository: Repository<Sale>,
  
      @InjectRepository(Expense)
      private readonly expenseRepository: Repository<Expense>,
    ) {}
  
    async exportExcel(
      query: ExportReportQueryDto,
    ): Promise<{
      buffer: Buffer;
      fileName: string;
    }> {
      this.validateDateRange(
        query.fromDate,
        query.toDate,
      );
  
      const [sales, expenses] =
        await Promise.all([
          this.saleRepository
            .createQueryBuilder('sale')
            .where(
              'sale.saleDate >= :fromDate',
              {
                fromDate: query.fromDate,
              },
            )
            .andWhere(
              'sale.saleDate <= :toDate',
              {
                toDate: query.toDate,
              },
            )
            .orderBy(
              'sale.saleDate',
              'ASC',
            )
            .addOrderBy(
              'sale.createdAt',
              'ASC',
            )
            .getMany(),
  
          this.expenseRepository
            .createQueryBuilder('expense')
            .where(
              'expense.expenseDate >= :fromDate',
              {
                fromDate: query.fromDate,
              },
            )
            .andWhere(
              'expense.expenseDate <= :toDate',
              {
                toDate: query.toDate,
              },
            )
            .orderBy(
              'expense.expenseDate',
              'ASC',
            )
            .addOrderBy(
              'expense.createdAt',
              'ASC',
            )
            .getMany(),
        ]);
  
      const totalRevenue = sales.reduce(
        (total, item) =>
          total + Number(item.totalAmount),
        0,
      );
  
      const totalCollected = sales.reduce(
        (total, item) =>
          total + Number(item.paidAmount),
        0,
      );
  
      const totalDebt = sales.reduce(
        (total, item) =>
          total +
          Number(item.remainingAmount),
        0,
      );
  
      const totalExpenses =
        expenses.reduce(
          (total, item) =>
            total + Number(item.amount),
          0,
        );
  
      const estimatedProfit =
        totalRevenue - totalExpenses;
  
      const cashBalance =
        totalCollected - totalExpenses;
  
      const ledgerItems: LedgerItem[] = [
        ...sales.map(
          (sale): LedgerItem => ({
            date: sale.saleDate,
            createdAt: sale.createdAt,
            type: 'THU',
            partner: sale.customerName,
            content: sale.content,
            revenue: Number(
              sale.totalAmount,
            ),
            collected: Number(
              sale.paidAmount,
            ),
            debt: Number(
              sale.remainingAmount,
            ),
            expense: 0,
            status:
              this.getPaymentStatusLabel(
                sale.paymentStatus,
              ),
            note: sale.note ?? '',
          }),
        ),
  
        ...expenses.map(
          (expense): LedgerItem => ({
            date: expense.expenseDate,
            createdAt:
              expense.createdAt,
            type: 'CHI',
            partner:
              expense.category ??
              'Chưa phân loại',
            content: expense.content,
            revenue: 0,
            collected: 0,
            debt: 0,
            expense: Number(
              expense.amount,
            ),
            status: '',
            note: expense.note ?? '',
          }),
        ),
      ].sort((first, second) => {
        const dateComparison =
          first.date.localeCompare(
            second.date,
          );
  
        if (dateComparison !== 0) {
          return dateComparison;
        }
  
        return (
          new Date(
            first.createdAt,
          ).getTime() -
          new Date(
            second.createdAt,
          ).getTime()
        );
      });
  
      const workbook =
        new ExcelJS.Workbook();
  
      workbook.creator =
        'Hệ thống quản lý thu chi';
  
      workbook.created = new Date();
      workbook.modified = new Date();
  
      const worksheet =
        workbook.addWorksheet(
          'Thu chi',
          {
            views: [
              {
                state: 'frozen',
                ySplit: 8,
              },
            ],
          },
        );
  
      worksheet.properties.defaultRowHeight =
        20;
  
      worksheet.columns = [
        {
          key: 'date',
          width: 14,
        },
        {
          key: 'type',
          width: 11,
        },
        {
          key: 'partner',
          width: 24,
        },
        {
          key: 'content',
          width: 36,
        },
        {
          key: 'revenue',
          width: 18,
        },
        {
          key: 'collected',
          width: 18,
        },
        {
          key: 'debt',
          width: 18,
        },
        {
          key: 'expense',
          width: 18,
        },
        {
          key: 'status',
          width: 21,
        },
        {
          key: 'note',
          width: 32,
        },
      ];
  
      this.renderTitle(
        worksheet,
        query.fromDate,
        query.toDate,
      );
  
      this.renderSummary(
        worksheet,
        {
          totalRevenue,
          totalCollected,
          totalDebt,
          totalExpenses,
          estimatedProfit,
          cashBalance,
          totalSales: sales.length,
          totalExpenseItems:
            expenses.length,
        },
      );
  
      this.renderLedger(
        worksheet,
        ledgerItems,
      );
  
      worksheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      };
  
      worksheet.headerFooter.oddFooter =
        '&LTrang &P / &N&C&RNgày xuất: &D';
  
      const result =
        await workbook.xlsx.writeBuffer();
  
      return {
        buffer: Buffer.from(result),
        fileName:
          `bao-cao-thu-chi_${query.fromDate}_${query.toDate}.xlsx`,
      };
    }
  
    private renderTitle(
      worksheet: ExcelJS.Worksheet,
      fromDate: string,
      toDate: string,
    ): void {
      worksheet.mergeCells('A1:J1');
  
      const titleCell =
        worksheet.getCell('A1');
  
      titleCell.value =
        'BÁO CÁO THU CHI';
  
      titleCell.font = {
        bold: true,
        size: 18,
        color: {
          argb: 'FFFFFFFF',
        },
      };
  
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF1F4E78',
        },
      };
  
      titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
  
      worksheet.getRow(1).height = 32;
  
      worksheet.mergeCells('A2:J2');
  
      const dateCell =
        worksheet.getCell('A2');
  
      dateCell.value =
        `Từ ngày ${this.formatDateVi(
          fromDate,
        )} đến ngày ${this.formatDateVi(
          toDate,
        )}`;
  
      dateCell.font = {
        italic: true,
        size: 11,
        color: {
          argb: 'FF44546A',
        },
      };
  
      dateCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
  
      worksheet.getRow(2).height = 23;
    }
  
    private renderSummary(
      worksheet: ExcelJS.Worksheet,
      summary: {
        totalRevenue: number;
        totalCollected: number;
        totalDebt: number;
        totalExpenses: number;
        estimatedProfit: number;
        cashBalance: number;
        totalSales: number;
        totalExpenseItems: number;
      },
    ): void {
      const summaryData = [
        {
          labelCell: 'A4',
          valueCell: 'B4',
          label: 'Tổng doanh thu',
          value: summary.totalRevenue,
        },
        {
          labelCell: 'C4',
          valueCell: 'D4',
          label: 'Đã thu',
          value: summary.totalCollected,
        },
        {
          labelCell: 'E4',
          valueCell: 'F4',
          label: 'Công nợ',
          value: summary.totalDebt,
        },
        {
          labelCell: 'G4',
          valueCell: 'H4',
          label: 'Tổng chi',
          value: summary.totalExpenses,
        },
        {
          labelCell: 'I4',
          valueCell: 'J4',
          label: 'Lợi nhuận',
          value: summary.estimatedProfit,
        },
        {
          labelCell: 'A5',
          valueCell: 'B5',
          label: 'Dòng tiền thực tế',
          value: summary.cashBalance,
        },
        {
          labelCell: 'C5',
          valueCell: 'D5',
          label: 'Số khoản thu',
          value: summary.totalSales,
          isCurrency: false,
        },
        {
          labelCell: 'E5',
          valueCell: 'F5',
          label: 'Số khoản chi',
          value:
            summary.totalExpenseItems,
          isCurrency: false,
        },
      ];
  
      summaryData.forEach((item) => {
        const labelCell =
          worksheet.getCell(
            item.labelCell,
          );
  
        const valueCell =
          worksheet.getCell(
            item.valueCell,
          );
  
        labelCell.value = item.label;
        labelCell.font = {
          bold: true,
          color: {
            argb: 'FF44546A',
          },
        };
  
        labelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'FFD9EAF7',
          },
        };
  
        valueCell.value = item.value;
        valueCell.font = {
          bold: true,
          color: {
            argb:
              item.value < 0
                ? 'FFC00000'
                : 'FF1F1F1F',
          },
        };
  
        if (item.isCurrency !== false) {
          valueCell.numFmt =
            '#,##0 "₫"';
        }
  
        [labelCell, valueCell].forEach(
          (cell) => {
            cell.alignment = {
              vertical: 'middle',
            };
  
            cell.border = {
              top: {
                style: 'thin',
                color: {
                  argb: 'FFB4C7E7',
                },
              },
              left: {
                style: 'thin',
                color: {
                  argb: 'FFB4C7E7',
                },
              },
              bottom: {
                style: 'thin',
                color: {
                  argb: 'FFB4C7E7',
                },
              },
              right: {
                style: 'thin',
                color: {
                  argb: 'FFB4C7E7',
                },
              },
            };
          },
        );
      });
  
      worksheet.getRow(4).height = 25;
      worksheet.getRow(5).height = 25;
    }
  
    private renderLedger(
      worksheet: ExcelJS.Worksheet,
      items: LedgerItem[],
    ): void {
      const headerRowNumber = 8;
  
      const headerRow =
        worksheet.getRow(
          headerRowNumber,
        );
  
      headerRow.values = [
        'Ngày',
        'Loại',
        'Khách hàng / Nhóm chi',
        'Nội dung',
        'Doanh thu',
        'Đã thu',
        'Công nợ',
        'Khoản chi',
        'Trạng thái',
        'Ghi chú',
      ];
  
      headerRow.font = {
        bold: true,
        color: {
          argb: 'FFFFFFFF',
        },
      };
  
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF4472C4',
        },
      };
  
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
  
      headerRow.height = 30;
  
      headerRow.eachCell((cell) => {
        cell.border = {
          top: {
            style: 'thin',
            color: {
              argb: 'FFD9E2F3',
            },
          },
          left: {
            style: 'thin',
            color: {
              argb: 'FFD9E2F3',
            },
          },
          bottom: {
            style: 'thin',
            color: {
              argb: 'FFD9E2F3',
            },
          },
          right: {
            style: 'thin',
            color: {
              argb: 'FFD9E2F3',
            },
          },
        };
      });
  
      items.forEach((item, index) => {
        const row = worksheet.addRow([
          this.toExcelDate(item.date),
          item.type,
          item.partner,
          item.content,
          item.revenue,
          item.collected,
          item.debt,
          item.expense,
          item.status,
          item.note,
        ]);
  
        row.height = 23;
  
        row.eachCell((cell) => {
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
          };
  
          cell.border = {
            top: {
              style: 'hair',
              color: {
                argb: 'FFD9D9D9',
              },
            },
            left: {
              style: 'hair',
              color: {
                argb: 'FFD9D9D9',
              },
            },
            bottom: {
              style: 'hair',
              color: {
                argb: 'FFD9D9D9',
              },
            },
            right: {
              style: 'hair',
              color: {
                argb: 'FFD9D9D9',
              },
            },
          };
        });
  
        row.getCell(1).numFmt =
          'dd/mm/yyyy';
  
        for (
          let column = 5;
          column <= 8;
          column += 1
        ) {
          row.getCell(column).numFmt =
            '#,##0 "₫"';
  
          row.getCell(
            column,
          ).alignment = {
            horizontal: 'right',
            vertical: 'middle',
          };
        }
  
        row.getCell(2).font = {
          bold: true,
          color: {
            argb:
              item.type === 'THU'
                ? 'FF008000'
                : 'FFC00000',
          },
        };
  
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb: 'FFF7F9FC',
            },
          };
        }
      });
  
      if (items.length === 0) {
        worksheet.mergeCells(
          'A9:J9',
        );
  
        const emptyCell =
          worksheet.getCell('A9');
  
        emptyCell.value =
          'Không có dữ liệu trong khoảng thời gian đã chọn';
  
        emptyCell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
  
        emptyCell.font = {
          italic: true,
          color: {
            argb: 'FF7F7F7F',
          },
        };
  
        worksheet.getRow(9).height = 30;
      }
  
      worksheet.autoFilter = {
        from: {
          row: headerRowNumber,
          column: 1,
        },
        to: {
          row: headerRowNumber,
          column: 10,
        },
      };
    }
  
    private validateDateRange(
      fromDate: string,
      toDate: string,
    ): void {
      if (fromDate > toDate) {
        throw new BadRequestException(
          'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
        );
      }
    }
  
    private getPaymentStatusLabel(
      status: string,
    ): string {
      switch (status) {
        case 'PAID':
          return 'Đã thanh toán';
  
        case 'PARTIAL':
          return 'Thanh toán một phần';
  
        case 'UNPAID':
        default:
          return 'Chưa thanh toán';
      }
    }
  
    private formatDateVi(
      value: string,
    ): string {
      const [year, month, day] =
        value.split('-');
  
      return `${day}/${month}/${year}`;
    }
  
    private toExcelDate(
      value: string,
    ): Date {
      const [year, month, day] =
        value
          .split('-')
          .map(Number);
  
      return new Date(
        Date.UTC(
          year,
          month - 1,
          day,
        ),
      );
    }
  }