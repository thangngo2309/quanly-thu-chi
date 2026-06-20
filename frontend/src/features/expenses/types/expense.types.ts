export type ExpenseFormValues = {
    content: string;
    category: string;
    amount: string;
    expenseDate: string;
    note: string;
  };
  
  export type CreateExpensePayload = {
    content: string;
    category?: string;
    amount: number;
    expenseDate: string;
    note?: string;
  };
  
  export type Expense = {
    id: string;
    content: string;
    category?: string | null;
    amount: number;
    expenseDate: string;
    note?: string | null;
    createdAt: string;
    updatedAt: string;
  };