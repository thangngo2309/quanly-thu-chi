import {
    Controller,
    Get,
    Query,
    Res,
    StreamableFile,
  } from '@nestjs/common';
  import {
    ApiOperation,
    ApiProduces,
    ApiTags,
  } from '@nestjs/swagger';
  import type { Response } from 'express';
  
  import { ExportReportQueryDto } from './dto/export-report-query.dto';
  import { ReportsService } from './reports.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
  
  @ApiTags('Reports')
  @Controller('reports')
  @Roles(UserRole.SYSTEM_ADMIN)
  export class ReportsController {
    constructor(
      private readonly reportsService: ReportsService,
    ) {}
  
    @Get('export-excel')
    @ApiOperation({
      summary:
        'Xuất báo cáo thu chi Excel',
    })
    @ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    async exportExcel(
      @Query()
      query: ExportReportQueryDto,
  
      @Res({
        passthrough: true,
      })
      response: Response,
    ): Promise<StreamableFile> {
      const { buffer, fileName } =
        await this.reportsService.exportExcel(
          query,
        );
  
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
  
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(
          fileName,
        )}`,
      );
  
      response.setHeader(
        'Content-Length',
        buffer.length.toString(),
      );
  
      return new StreamableFile(buffer);
    }
  }