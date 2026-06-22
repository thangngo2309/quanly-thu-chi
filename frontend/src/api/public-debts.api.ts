import {
  CreatePublicDebtLinkPayload,
  CreatePublicDebtLinkResponse,
  CreatePublicPaymentRequestPayload,
  CreatePublicPaymentRequestResponse,
  PublicDebtOverview,
} from "@/features/debts/types/public-debt.types";
import { api } from "./http";

export async function createPublicDebtLink(
  payload: CreatePublicDebtLinkPayload
): Promise<CreatePublicDebtLinkResponse> {
  const response = await api.post<CreatePublicDebtLinkResponse>(
    "/debts/public-link",
    payload
  );
  return response.data;
}
export async function getPublicDebtOverview(
  customerName: string,
  token: string
): Promise<PublicDebtOverview> {
  const response = await api.get<PublicDebtOverview>("/public/debts", {
    params: { customerName, token },
  });
  return response.data;
}
export async function createPublicPaymentRequest(
  customerName: string,
  token: string,
  payload: CreatePublicPaymentRequestPayload
): Promise<CreatePublicPaymentRequestResponse> {
  const response = await api.post<CreatePublicPaymentRequestResponse>(
    "/public/debts/payment-requests",
    payload,
    { params: { customerName, token } }
  );
  return response.data;
}
export async function downloadPublicDebtPdf(
  customerName: string,
  token: string
): Promise<void> {
  const response = await api.get<ArrayBuffer>("/public/debts/export-pdf", {
    params: { customerName, token },
    responseType: "arraybuffer",
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `cong-no-${customerName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
