import axios from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.',
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(', ');
    }

    if (typeof responseMessage === 'string') {
      return responseMessage;
    }

    if (error.code === 'ECONNABORTED') {
      return 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.';
    }

    if (!error.response) {
      return 'Không thể kết nối đến máy chủ.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}