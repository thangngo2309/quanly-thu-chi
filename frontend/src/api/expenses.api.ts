import { CreateExpensePayload, Expense } from "@/features/expenses/types/expense.types";
import { api } from "./http";


export const createExpense = async (
  payload: CreateExpensePayload,
): Promise<Expense> => {
  const response = await api.post<Expense>(
    '/expenses',
    payload,
  );

  return response.data;
};