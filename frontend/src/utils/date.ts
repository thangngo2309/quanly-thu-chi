import dayjs from "dayjs";

export function formatDateVi(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "—";
  }

  return date.format("DD/MM/YYYY");
}

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "Chưa đặt";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};
