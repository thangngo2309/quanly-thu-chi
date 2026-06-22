import { Body, Controller, Get, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

import { DebtsPdfService } from './debts-pdf.service';
import { DebtsService } from './debts.service';
import { DebtQueryDto } from './dto/debt-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreatePublicDebtLinkDto } from './dto/create-public-debt-link.dto';
import { PublicDebtsService } from './public-debts.service';

@Controller('debts')
@Roles(UserRole.SYSTEM_ADMIN)
export class DebtsController {
  constructor(
    private readonly debtsService: DebtsService,

    private readonly debtsPdfService: DebtsPdfService,

    private readonly publicDebtsService: PublicDebtsService,
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

  @Post('public-link') createPublicDebtLink(
    @Body() dto: CreatePublicDebtLinkDto,
  ) {
    return this.publicDebtsService.createPublicLink(dto);
  }
}
