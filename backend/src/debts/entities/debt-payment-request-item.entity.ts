import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { DebtPaymentRequest } from './debt-payment-request.entity';

@Entity({ name: 'debt_payment_request_items' })
@Index('IDX_debt_payment_request_items_request', ['requestId'])
@Index('IDX_debt_payment_request_items_sale', ['saleId'])
export class DebtPaymentRequestItem {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'request_id', type: 'uuid' }) requestId: string;
  @ManyToOne(() => DebtPaymentRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: DebtPaymentRequest;

  @Column({ name: 'sale_id', type: 'uuid' }) saleId: string;
  @ManyToOne(() => Sale, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({
    name: 'requested_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
  })
  requestedAmount: number;
  
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
