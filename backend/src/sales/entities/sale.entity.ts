import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity({
  name: 'sales',
})
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({
    name: 'customer_name',
    type: 'varchar',
    length: 150,
  })
  customerName: string;

  @Column({
    type: 'text',
  })
  content: string;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  totalAmount: number;

  @Column({
    name: 'paid_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  paidAmount: number;

  @Column({
    name: 'remaining_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  remainingAmount: number;

  @Index()
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Index()
  @Column({
    name: 'sale_date',
    type: 'date',
  })
  saleDate: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  note?: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
