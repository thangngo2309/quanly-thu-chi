import { CreateSalePayload, Sale } from "@/features/sales/types/sale.types";
import { api } from "./http";


export const createSale = async (
  payload: CreateSalePayload,
): Promise<Sale> => {
  const response = await api.post<Sale>(
    '/sales',
    payload,
  );

  return response.data;
};