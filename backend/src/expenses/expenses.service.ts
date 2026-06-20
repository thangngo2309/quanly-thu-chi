import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create({
      content: createExpenseDto.content.trim(),
      category: createExpenseDto.category?.trim() || null,
      amount: Number(createExpenseDto.amount),
      expenseDate:
        createExpenseDto.expenseDate ?? new Date().toISOString().slice(0, 10),
      note: createExpenseDto.note?.trim() || null,
    });

    return this.expenseRepository.save(expense);
  }

  async findAll(query: QueryExpensesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    if (query.q?.trim()) {
      queryBuilder.andWhere(
        `(
            expense.content ILIKE :keyword
            OR expense.category ILIKE :keyword
            OR expense.note ILIKE :keyword
          )`,
        {
          keyword: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.category?.trim()) {
      queryBuilder.andWhere('expense.category = :category', {
        category: query.category.trim(),
      });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('expense.expenseDate >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('expense.expenseDate <= :toDate', {
        toDate: query.toDate,
      });
    }

    queryBuilder
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: {
        id,
      },
    });

    if (!expense) {
      throw new NotFoundException('Không tìm thấy khoản chi');
    }

    return expense;
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findOne(id);

    if (updateExpenseDto.content !== undefined) {
      expense.content = updateExpenseDto.content.trim();
    }

    if (updateExpenseDto.category !== undefined) {
      expense.category = updateExpenseDto.category?.trim() || null;
    }

    if (updateExpenseDto.amount !== undefined) {
      expense.amount = Number(updateExpenseDto.amount);
    }

    if (updateExpenseDto.expenseDate !== undefined) {
      expense.expenseDate = updateExpenseDto.expenseDate;
    }

    if (updateExpenseDto.note !== undefined) {
      expense.note = updateExpenseDto.note?.trim() || null;
    }

    return this.expenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);

    await this.expenseRepository.remove(expense);
  }
}
