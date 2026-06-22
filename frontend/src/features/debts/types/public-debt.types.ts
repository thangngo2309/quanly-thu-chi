import type { PaymentStatus } from "@/features/sales/types/sale.types";

export type CreatePublicDebtLinkPayload = { customerName: string };

export type CreatePublicDebtLinkResponse = {
  customerName: string;
  token: string;
  expiresAt: string;
};

export type PublicDebtItem = {
  saleId: string;
  saleDate: string;
  content: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  confirmationStatus: PublicDebtConfirmationStatus;
};

export type PublicDebtOverview = {
  customerName: string;
  generatedAt: string;
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalPaid: number;
    totalDebt: number;
  };
  items: PublicDebtItem[];
};

export type PublicDebtConfirmationStatus = "NONE" | "PENDING";

export type PublicPaymentRequestScope = "ALL" | "SINGLE";
export type CreatePublicPaymentRequestPayload = {
  scope: PublicPaymentRequestScope;
  saleId?: string;
};
export type CreatePublicPaymentRequestResponse = {
  id: string;
  code: string;
  customerName: string;
  amount: number;
  status: "PENDING";
  itemCount: number;
};
