import { PendingDebtPaymentRequest } from "@/features/debts/types/debt-payment-request.types";
import { api } from "./http";

export async function getPendingDebtPaymentRequests(): Promise<
  PendingDebtPaymentRequest[]
> {
  const response = await api.get<PendingDebtPaymentRequest[]>(
    "/debts/payment-requests/pending"
  );
  return response.data;
}
export async function approveDebtPaymentRequest(
  id: string,
  note?: string
): Promise<void> {
  await api.patch(`/debts/payment-requests/${id}/approve`, { note });
}
export async function rejectDebtPaymentRequest(
  id: string,
  note?: string
): Promise<void> {
  await api.patch(`/debts/payment-requests/${id}/reject`, { note });
}
