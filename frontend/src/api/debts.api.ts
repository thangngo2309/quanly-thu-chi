import { DebtExportParams, DebtListResponse, DebtQueryParams } from "@/features/debts/types/debt.types";
import { api } from "./http";

export async function getDebts(
  params: DebtQueryParams,
): Promise<DebtListResponse> {
  const response =
    await api.get<DebtListResponse>(
      '/debts',
      {
        params,
      },
    );

  return response.data;
}

function getDownloadFileName(
  contentDisposition:
    | string
    | undefined,
): string {
  const fallback =
    `bao-cao-cong-no_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (utf8Match?.[1]) {
    return decodeURIComponent(
      utf8Match[1],
    );
  }

  const normalMatch =
    contentDisposition.match(
      /filename="?([^";]+)"?/i,
    );

  return normalMatch?.[1] ?? fallback;
}

export async function downloadDebtsPdf(
  params: DebtExportParams,
): Promise<void> {
  const response =
    await api.get<ArrayBuffer>(
      '/debts/export-pdf',
      {
        params,
        responseType:
          'arraybuffer',
      },
    );

  const blob = new Blob(
    [response.data],
    {
      type: 'application/pdf',
    },
  );

  const fileName =
    getDownloadFileName(
      response.headers[
        'content-disposition'
      ],
    );

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(
      objectUrl,
    );
  }, 1000);
}