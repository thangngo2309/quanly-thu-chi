import { CreateExpensePayload, Expense, ExpensesQueryParams, UpdateExpensePayload } from '@/features/expenses/types/expense.types';
import type { PaginatedResponse } from '@/types/pagination';
import { api } from './http';

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<Expense> {
  const response = await api.post<Expense>(
    '/expenses',
    payload,
  );

  return response.data;
}

export async function getExpenses(
  params: ExpensesQueryParams,
): Promise<PaginatedResponse<Expense>> {
  const response =
    await api.get<
      PaginatedResponse<Expense>
    >('/expenses', {
      params,
    });

  return response.data;
}

export async function deleteExpense(
  id: string,
): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export async function updateExpense(
  id: string,
  payload: UpdateExpensePayload
): Promise<Expense> {
  const response = await api.patch<Expense>(
    `/expenses/${id}`,
    payload
  );

  return response.data;
}