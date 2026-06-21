import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

import { DebtsPdfService } from './debts-pdf.service';
import { DebtsService } from './debts.service';
import { DebtQueryDto } from './dto/debt-query.dto';

@Controller('debts')
export class DebtsController {
  constructor(
    private readonly debtsService: DebtsService,

    private readonly debtsPdfService: DebtsPdfService,
  ) {}

  @Get('export-pdf')
  async exportPdf(
    @Query()
    query: DebtQueryDto,

    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<StreamableFile> {
    const { buffer, fileName } = await this.debtsPdfService.exportPdf(query);

    response.setHeader('Content-Type', 'application/pdf');

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
        fileName,
      )}`,
    );

    response.setHeader('Content-Length', String(buffer.length));

    return new StreamableFile(buffer);
  }

  @Get()
  findAll(
    @Query()
    query: DebtQueryDto,
  ) {
    return this.debtsService.findAll(query);
  }
}
