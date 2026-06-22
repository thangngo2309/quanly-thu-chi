import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePublicPaymentRequestDto } from './dto/create-public-payment-request.dto';
import { PublicDebtQueryDto } from './dto/public-debt-query.dto';
import { DebtPaymentRequestsService } from './debt-payment-requests.service';
import { DebtsPdfService } from './debts-pdf.service';
import { PublicDebtsService } from './public-debts.service';
@Public()
@Controller('public/debts')
export class PublicDebtsController {
    
  constructor(
    private readonly publicDebtsService: PublicDebtsService,
    private readonly paymentRequestsService: DebtPaymentRequestsService,
    private readonly debtsPdfService: DebtsPdfService,
  ) {}

  @Get() getPublicDebtOverview(@Query() query: PublicDebtQueryDto) {
    return this.publicDebtsService.getPublicDebtOverview(query);
  }

  @Post('payment-requests') createPaymentRequest(
    @Query() query: PublicDebtQueryDto,
    @Body() dto: CreatePublicPaymentRequestDto,
  ) {
    return this.paymentRequestsService.createPublicRequest(query, dto);
  }

  @Get('export-pdf') async exportPdf(
    @Query() query: PublicDebtQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const customerName =
      this.publicDebtsService.resolveAuthorizedCustomer(query);
    const { buffer, fileName } = await this.debtsPdfService.exportPdf({
      customerName,
      page: 1,
      limit: 100,
    });
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    response.setHeader('Content-Length', String(buffer.length));
    return new StreamableFile(buffer);
  }
}
