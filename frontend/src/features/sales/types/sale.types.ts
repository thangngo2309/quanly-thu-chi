export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export type SaleFormPaymentStatus = "UNPAID" | "PAID";

export type SaleFormValues = {
  customerName: string;
  content: string;
  totalAmount: string;
  paymentStatus: SaleFormPaymentStatus;
  saleDate: string;
  note: string;
};

export type CreateSalePayload = {
  customerName: string;
  content: string;
  totalAmount: number;
  paidAmount: number;
  saleDate: string;
  note?: string;
};

export type Sale = {
  id: string;
  customerName: string;
  content: string;

  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;

  paymentStatus: PaymentStatus;
  saleDate: string;
  note: string | null;

  pendingDebtPaymentRequestId: string | null;

  createdAt: string;
  updatedAt: string;
};

export type SalesSearchValues = {
  q: string;
  paymentStatus: "" | PaymentStatus;
  fromDate: string;
  toDate: string;
};

export type SalesQueryParams = {
  page: number;
  limit: number;
  q?: string;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
};
