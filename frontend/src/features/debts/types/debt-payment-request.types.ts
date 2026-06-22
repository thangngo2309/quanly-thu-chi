export type PendingDebtPaymentRequestItem = {
  id: string;
  saleId: string;
  requestedAmount: number;
  sale: {
    id: string;
    saleDate: string;
    content: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
};
export type PendingDebtPaymentRequest = {
  id: string;
  code: string;
  customerName: string;
  scope: "ALL" | "SINGLE";
  status: "PENDING";
  amount: number;
  createdAt: string;
  items: PendingDebtPaymentRequestItem[];
};
