import type { Sale } from "@/features/sales/types/sale.types";
import type { PaginatedResponse } from "@/types/pagination";

export type DebtSearchValues = {
  customerName: string;
  fromDate: string;
  toDate: string;
};

export type DebtQueryParams = {
  page: number;
  limit: number;
  customerName?: string;
  fromDate?: string;
  toDate?: string;
};

export type DebtExportParams = {
  customerName?: string;
  fromDate?: string;
  toDate?: string;
};

export type DebtSummary = {
  totalOrders: number;
  totalRevenue: number;
  totalCollected: number;
  totalDebt: number;
};

export type DebtListResponse = PaginatedResponse<Sale> & {
  summary: DebtSummary;
};
