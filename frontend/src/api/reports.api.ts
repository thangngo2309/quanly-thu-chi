import { ExportReportParams } from "@/features/reports/types/report.types";
import { api } from "./http";

function getDownloadFileName(
  contentDisposition:
    | string
    | undefined,
  fallback: string,
): string {
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

export async function downloadReportExcel(
  params: ExportReportParams,
): Promise<void> {
  const response =
    await api.get<ArrayBuffer>(
      '/reports/export-excel',
      {
        params,
        responseType:
          'arraybuffer',
      },
    );

  const blob = new Blob(
    [response.data],
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  );

  const fallbackName =
    `bao-cao-thu-chi_${params.fromDate}_${params.toDate}.xlsx`;

  const fileName =
    getDownloadFileName(
      response.headers[
        'content-disposition'
      ],
      fallbackName,
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

  URL.revokeObjectURL(objectUrl);
}