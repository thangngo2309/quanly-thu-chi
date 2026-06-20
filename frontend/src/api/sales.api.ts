import { CreateSalePayload, Sale, SalesQueryParams } from '@/features/sales/types/sale.types';
import type { PaginatedResponse } from '@/types/pagination';
import { api } from './http';

export async function createSale(
  payload: CreateSalePayload,
): Promise<Sale> {
  const response = await api.post<Sale>(
    '/sales',
    payload,
  );

  return response.data;
}

export async function getSales(
  params: SalesQueryParams,
): Promise<PaginatedResponse<Sale>> {
  const response =
    await api.get<PaginatedResponse<Sale>>(
      '/sales',
      {
        params,
      },
    );

  return response.data;
}

export async function markSaleAsPaid(
  sale: Sale,
): Promise<Sale> {
  const response = await api.patch<Sale>(
    `/sales/${sale.id}`,
    {
      paidAmount: sale.totalAmount,
    },
  );

  return response.data;
}

export async function deleteSale(
  id: string,
): Promise<void> {
  await api.delete(`/sales/${id}`);
}