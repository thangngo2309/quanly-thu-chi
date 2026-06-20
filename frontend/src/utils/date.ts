import dayjs from 'dayjs';

export function formatDateVi(
  value?: string | Date | null,
): string {
  if (!value) {
    return '—';
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return '—';
  }

  return date.format('DD/MM/YYYY');
}