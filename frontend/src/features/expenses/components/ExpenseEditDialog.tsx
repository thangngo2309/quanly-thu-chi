"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";

import { updateExpense } from "@/api/expenses.api";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import type { Expense } from "../types/expense.types";

type ExpenseEditFormValues = {
  content: string;
  category: string;
  amount: string;
  expenseDate: string;
  note: string;
};

type ExpenseEditDialogProps = {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const parseAmount = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = value.replace(/[^\d]/g, "");

  return normalized ? Number(normalized) : 0;
};

const normalizeAmountInput = (value: string): string =>
  value.replace(/[^\d]/g, "");

export function ExpenseEditDialog({
  open,
  expense,
  onClose,
  onSaved,
}: ExpenseEditDialogProps) {
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseEditFormValues>({
    mode: "all",

    defaultValues: {
      content: "",
      category: "",
      amount: "",
      expenseDate: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open || !expense) {
      return;
    }

    reset({
      content: expense.content ?? "",
      category: expense.category ?? "",

      amount: String(Number(expense.amount ?? 0)),

      expenseDate: expense.expenseDate?.slice(0, 10) ?? "",

      note: expense.note ?? "",
    });
  }, [open, expense, reset]);

  const submitForm: SubmitHandler<ExpenseEditFormValues> = async (values) => {
    if (!expense) {
      return;
    }

    const content = values.content.trim();

    const category = values.category.trim() || null;

    const amount = parseAmount(values.amount);

    const note = values.note.trim() || null;

    if (!content) {
      setError("content", {
        type: "validate",
        message: "Vui lòng nhập nội dung khoản chi",
      });

      return;
    }

    if (amount < 0) {
      setError("amount", {
        type: "validate",
        message: "Số tiền chi không được nhỏ hơn 0",
      });

      return;
    }

    if (!values.expenseDate) {
      setError("expenseDate", {
        type: "validate",
        message: "Vui lòng chọn ngày chi",
      });

      return;
    }

    try {
      await updateExpense(expense.id, {
        content,
        category,
        amount,
        expenseDate: values.expenseDate,
        note,
      });

      toast.success("Đã cập nhật khoản chi thành công.");

      await onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật khoản chi."));
    }
  };

  const handleClose = (): void => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: "calc(100% - 20px)",
              sm: "100%",
            },

            m: {
              xs: 1.25,
              sm: 4,
            },

            borderRadius: 3,
          },
        },
      }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle
          sx={{
            fontWeight: 900,
          }}
        >
          Chỉnh sửa khoản chi
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            <Controller
              name="content"
              control={control}
              rules={{
                required: "Vui lòng nhập nội dung khoản chi",

                validate: (value) =>
                  value.trim().length > 0 || "Vui lòng nhập nội dung khoản chi",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nội dung khoản chi"
                  placeholder="Nhập nội dung khoản chi"
                  multiline
                  minRows={2}
                  fullWidth
                  error={Boolean(errors.content)}
                  helperText={errors.content?.message}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nhóm chi phí"
                  placeholder="Nhập nhóm chi phí"
                  fullWidth
                  error={Boolean(errors.category)}
                  helperText={errors.category?.message}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              rules={{
                required: "Vui lòng nhập số tiền chi",

                validate: (value) =>
                  parseAmount(value) >= 0 || "Số tiền chi không được nhỏ hơn 0",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Số tiền chi"
                  placeholder="0"
                  fullWidth
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  onChange={(event) => {
                    field.onChange(normalizeAmountInput(event.target.value));
                  }}
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                    },
                  }}
                />
              )}
            />

            <Controller
              name="expenseDate"
              control={control}
              rules={{
                required: "Vui lòng chọn ngày chi",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Ngày chi"
                  fullWidth
                  error={Boolean(errors.expenseDate)}
                  helperText={errors.expenseDate?.message}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}
            />

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ghi chú"
                  placeholder="Nhập ghi chú"
                  multiline
                  minRows={2}
                  fullWidth
                  error={Boolean(errors.note)}
                  helperText={errors.note?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,

            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },

            "& .MuiButton-root": {
              width: {
                xs: "100%",
                sm: "auto",
              },

              minHeight: 44,
            },

            "& .MuiButton-root + .MuiButton-root": {
              ml: {
                xs: 0,
                sm: 1,
              },
            },
          }}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            Hủy
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
