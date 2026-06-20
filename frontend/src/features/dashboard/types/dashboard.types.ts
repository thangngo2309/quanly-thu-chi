export type DashboardFilterValues = {
    fromDate: string;
    toDate: string;
  };
  
  export type DashboardQueryParams = {
    fromDate?: string;
    toDate?: string;
  };
  
  export type DashboardSummary = {
    fromDate: string | null;
    toDate: string | null;
  
    totalRevenue: number;
    totalCollected: number;
    totalDebt: number;
    totalExpenses: number;
  
    estimatedProfit: number;
    cashBalance: number;
  
    totalSales: number;
    totalExpenseItems: number;
  };