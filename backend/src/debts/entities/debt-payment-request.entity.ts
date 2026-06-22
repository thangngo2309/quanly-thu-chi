import { DebtPaymentRequestScope, DebtPaymentRequestStatus } from 'src/common/enums/debt-payment-request.enum';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { DebtPaymentRequestItem } from './debt-payment-request-item.entity';
  
  
  @Entity({
    name: 'debt_payment_requests',
  })
  @Index(
    'IDX_debt_payment_requests_status',
    ['status'],
  )
  export class DebtPaymentRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({
      name: 'code',
      type: 'varchar',
      length: 50,
      unique: true,
    })
    code: string;
  
    @Column({
      name: 'customer_name',
      type: 'varchar',
      length: 150,
    })
    customerName: string;
  
    @Column({
      name: 'scope',
      type: 'enum',
      enum: DebtPaymentRequestScope,
    })
    scope: DebtPaymentRequestScope;
  
    @Column({
      name: 'status',
      type: 'enum',
      enum: DebtPaymentRequestStatus,
      default:
        DebtPaymentRequestStatus.PENDING,
    })
    status: DebtPaymentRequestStatus;
  
    @Column({
      name: 'amount',
      type: 'numeric',
      precision: 15,
      scale: 2,
    })
    amount: number;
  
    @Column({
      name: 'reviewed_by_user_id',
      type: 'uuid',
      nullable: true,
    })
    reviewedByUserId: string | null;
  
    @Column({
      name: 'reviewed_at',
      type: 'timestamptz',
      nullable: true,
    })
    reviewedAt: Date | null;
  
    @Column({
      name: 'review_note',
      type: 'text',
      nullable: true,
    })
    reviewNote: string | null;
  
    @OneToMany(
      () => DebtPaymentRequestItem,
      (item) => item.request,
    )
    items: DebtPaymentRequestItem[];
  
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