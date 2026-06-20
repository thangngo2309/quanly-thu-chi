'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type SubmitHandler,
  useForm,
  useWatch,
} from 'react-hook-form';

import {
  HDatePicker,
  HDropdown,
  HForm,
  HInput,
} from '@/components/form';
import { formatVnd } from '@/utils/currency';
import type {
  Expense,
  ExpenseFormValues,
} from '../types/expense.types';
import { createExpense } from '@/api/expenses.api';

const expenseCategoryOptions = [
  {
    label: 'Nguyên vật liệu',
    value: 'Nguyên vật liệu',
  },
  {
    label: 'Vận chuyển',
    value: 'Vận chuyển',
  },
  {
    label: 'Điện, nước',
    value: 'Điện, nước',
  },
  {
    label: 'Nhân công',
    value: 'Nhân công',
  },
  {
    label: 'Thuê mặt bằng',
    value: 'Thuê mặt bằng',
  },
  {
    label: 'Chi phí khác',
    value: 'Chi phí khác',
  },
];

const defaultValues: ExpenseFormValues = {
  content: '',
  category: '',
  amount: '',
  expenseDate: '',
  note: '',
};

function getErrorMessage(error: unknown): string {
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

  return 'Đã xảy ra lỗi khi lưu khoản chi.';
}

export function ExpenseCreateForm() {
  const methods = useForm<ExpenseFormValues>({
    defaultValues,
    mode: 'onBlur',
  });

  const {
    control,
    reset,
    setValue,
    formState: {
      isSubmitting,
    },
  } = methods;

  const [successExpense, setSuccessExpense] =
    useState<Expense | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const amountValue = useWatch({
    control,
    name: 'amount',
  });

  const amount = useMemo(() => {
    const parsedAmount = Number(amountValue);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return 0;
    }

    return parsedAmount;
  }, [amountValue]);

  useEffect(() => {
    setValue(
      'expenseDate',
      dayjs().format('YYYY-MM-DD'),
      {
        shouldDirty: false,
        shouldValidate: false,
      },
    );
  }, [setValue]);

  const handleReset = (): void => {
    reset({
      ...defaultValues,
      expenseDate: dayjs().format('YYYY-MM-DD'),
    });

    setSuccessExpense(null);
    setErrorMessage(null);
  };

  const onSubmit: SubmitHandler<
    ExpenseFormValues
  > = async (values) => {
    setSuccessExpense(null);
    setErrorMessage(null);

    try {
      const normalizedAmount = Number(
        values.amount,
      );

      const expense = await createExpense({
        content: values.content.trim(),
        category:
          values.category.trim() || undefined,
        amount: normalizedAmount,
        expenseDate: values.expenseDate,
        note: values.note.trim() || undefined,
      });

      setSuccessExpense(expense);

      reset({
        ...defaultValues,
        expenseDate:
          dayjs().format('YYYY-MM-DD'),
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      );
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Stack spacing={0.75}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
            }}
          >
            Nhập khoản chi
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Ghi nhận các khoản chi phí phát sinh
            trong quá trình hoạt động.
          </Typography>
        </Stack>
      </CardContent>

      <Divider />

      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <HForm
          methods={methods}
          onSubmit={onSubmit}
        >
          <Stack spacing={3}>
            {successExpense && (
              <Alert
                severity="success"
                onClose={() =>
                  setSuccessExpense(null)
                }
              >
                Đã lưu khoản chi{' '}
                <strong>
                  {successExpense.content}
                </strong>{' '}
                với số tiền{' '}
                <strong>
                  {formatVnd(
                    successExpense.amount,
                  )}
                </strong>
                .
              </Alert>
            )}

            {errorMessage && (
              <Alert
                severity="error"
                onClose={() =>
                  setErrorMessage(null)
                }
              >
                {errorMessage}
              </Alert>
            )}

            <HInput<ExpenseFormValues>
              name="content"
              label="Nội dung khoản chi"
              placeholder="Ví dụ: Mua nguyên vật liệu"
              multiline
              minRows={3}
              rules={{
                required:
                  'Vui lòng nhập nội dung khoản chi',
                validate: (value) =>
                  value.trim().length > 0 ||
                  'Vui lòng nhập nội dung khoản chi',
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              <HDropdown<ExpenseFormValues>
                name="category"
                label="Nhóm chi phí"
                placeholder="Chọn nhóm chi phí"
                options={expenseCategoryOptions}
              />

              <HDatePicker<ExpenseFormValues>
                name="expenseDate"
                label="Ngày chi"
                rules={{
                  required:
                    'Vui lòng chọn ngày chi',
                }}
              />
            </Box>

            <HInput<ExpenseFormValues>
              name="amount"
              label="Số tiền chi"
              placeholder="Nhập số tiền"
              type="number"
              slotProps={{
                htmlInput: {
                  min: 1,
                  step: 1000,
                  inputMode: 'numeric',
                },
              }}
              rules={{
                required:
                  'Vui lòng nhập số tiền chi',

                validate: {
                  validNumber: (value) =>
                    Number.isFinite(
                      Number(value),
                    ) ||
                    'Số tiền không hợp lệ',

                  greaterThanZero: (value) =>
                    Number(value) > 0 ||
                    'Số tiền phải lớn hơn 0',
                },
              }}
            />

            <HInput<ExpenseFormValues>
              name="note"
              label="Ghi chú"
              placeholder="Thông tin bổ sung nếu có"
              multiline
              minRows={2}
              rules={{
                maxLength: {
                  value: 1000,
                  message:
                    'Ghi chú không quá 1.000 ký tự',
                },
              }}
            />

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'action.hover',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Tổng khoản chi đang nhập
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  mt: 0.5,
                  fontWeight: 900,
                  color: 'error.main',
                }}
              >
                {formatVnd(amount)}
              </Typography>
            </Paper>

            <Stack
              direction={{
                xs: 'column-reverse',
                sm: 'row',
              }}
              spacing={1.5}
              sx={{
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={isSubmitting}
                onClick={handleReset}
                sx={{
                  minHeight: 44,
                  minWidth: 120,
                }}
              >
                Nhập lại
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={isSubmitting}
                sx={{
                  minHeight: 44,
                  minWidth: 160,
                }}
              >
                {isSubmitting && (
                  <CircularProgress
                    size={18}
                    color="inherit"
                    sx={{
                      mr: 1,
                    }}
                  />
                )}

                {isSubmitting
                  ? 'Đang lưu...'
                  : 'Lưu khoản chi'}
              </Button>
            </Stack>
          </Stack>
        </HForm>
      </CardContent>
    </Card>
  );
}