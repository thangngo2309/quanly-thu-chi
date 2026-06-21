import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesService } from './sales.service';
import { CustomerSuggestionQueryDto } from './dto/customer-suggestion-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('Sales')
@Controller('sales')
@Roles(UserRole.SYSTEM_ADMIN)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Tạo khoản doanh thu',
  })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Danh sách doanh thu và công nợ',
  })
  findAll(@Query() query: QuerySalesDto) {
    return this.salesService.findAll(query);
  }

  @Get('customer-suggestions')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.ADMIN)
  getCustomerSuggestions(
    @Query()
    query: CustomerSuggestionQueryDto,
  ): Promise<string[]> {
    return this.salesService.getCustomerSuggestions(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết khoản doanh thu',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật khoản doanh thu',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, updateSaleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa khoản doanh thu',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.remove(id);
  }
}
