import { DashboardQueryParams, DashboardSummary } from "@/features/dashboard/types/dashboard.types";
import { api } from "./http";

export async function getDashboardSummary(
  params: DashboardQueryParams,
): Promise<DashboardSummary> {
  const response =
    await api.get<DashboardSummary>(
      '/dashboard/summary',
      {
        params,
      },
    );

  return response.data;
}