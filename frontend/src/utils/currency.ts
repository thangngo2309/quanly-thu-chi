export const formatVnd = (
    value: number | string | null | undefined,
  ): string => {
    const amount = Number(value ?? 0);
  
    if (!Number.isFinite(amount)) {
      return '0 ₫';
    }
  
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };