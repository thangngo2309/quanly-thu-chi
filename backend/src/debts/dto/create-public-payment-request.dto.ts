import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { DebtPaymentRequestScope } from 'src/common/enums/debt-payment-request.enum';

export class CreatePublicPaymentRequestDto {
  @IsEnum(DebtPaymentRequestScope)
  scope: DebtPaymentRequestScope;

  @ValidateIf(
    (value: CreatePublicPaymentRequestDto) =>
      value.scope === DebtPaymentRequestScope.SINGLE,
  )
  @IsUUID()
  saleId?: string;

  @IsOptional()
  note?: string;
}
