import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity({
  name: 'expenses',
})
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
  })
  content: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  category?: string | null;

  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Index()
  @Column({
    name: 'expense_date',
    type: 'date',
  })
  expenseDate: string;

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
