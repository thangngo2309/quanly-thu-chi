"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";

import { updateSale } from "@/api/sales.api";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import type { Sale } from "../types/sale.types";

type SaleEditFormValues = {
  customerName: string;
  content: string;
  totalAmount: string;
  paidAmount: string;
  saleDate: string;
  note: string;
};

type SaleEditDialogProps = {
  open: boolean;
  sale: Sale | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

function parseAmount(value: string): number {
  const normalized = value.replace(/[^\d]/g, "");

  return normalized ? Number(normalized) : 0;
}

function normalizeAmountInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function SaleEditDialog({
  open,
  sale,
  onClose,
  onSaved,
}: SaleEditDialogProps) {
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaleEditFormValues>({
    mode: "all",
    defaultValues: {
      customerName: "",
      content: "",
      totalAmount: "",
      paidAmount: "",
      saleDate: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open || !sale) {
      return;
    }

    reset({
      customerName: sale.customerName ?? "",
      content: sale.content ?? "",
      totalAmount: String(Number(sale.totalAmount ?? 0)),
      paidAmount: String(Number(sale.paidAmount ?? 0)),
      saleDate: sale.saleDate?.slice(0, 10) ?? "",
      note: sale.note ?? "",
    });
  }, [open, sale, reset]);

  const totalAmount = parseAmount(watch("totalAmount") ?? "");
  const paidAmount = parseAmount(watch("paidAmount") ?? "");

  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  const isPendingConfirmation = Boolean(sale?.pendingDebtPaymentRequestId);

  const submitForm: SubmitHandler<SaleEditFormValues> = async (values) => {
    if (!sale) {
      return;
    }

    if (isPendingConfirmation) {
      toast.warning("Khoản thu đang chờ xác nhận thanh toán.");

      return;
    }

    const customerName = values.customerName.trim();
    const content = values.content.trim();
    const normalizedTotalAmount = parseAmount(values.totalAmount);
    const normalizedPaidAmount = parseAmount(values.paidAmount);

    if (!customerName) {
      setError("customerName", {
        type: "validate",
        message: "Vui lòng nhập tên khách hàng",
      });

      return;
    }

    if (!content) {
      setError("content", {
        type: "validate",
        message: "Vui lòng nhập nội dung khoản thu",
      });

      return;
    }

    if (normalizedTotalAmount <= 0) {
      setError("totalAmount", {
        type: "validate",
        message: "Tổng tiền phải lớn hơn 0",
      });

      return;
    }

    if (normalizedPaidAmount > normalizedTotalAmount) {
      setError("paidAmount", {
        type: "validate",
        message: "Số tiền đã thu không được lớn hơn tổng tiền",
      });

      return;
    }

    try {
      await updateSale(sale.id, {
        customerName,
        content,
        totalAmount: normalizedTotalAmount,
        paidAmount: normalizedPaidAmount,
        saleDate: values.saleDate,
        note: values.note.trim() || null,
      });

      toast.success("Đã cập nhật khoản thu thành công.");

      await onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật khoản thu."));
    }
  };

  const handleClose = () => {
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
          Chỉnh sửa khoản thu
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            {isPendingConfirmation && (
              <Alert severity="warning">
                Khoản thu đang chờ xác nhận thanh toán nên chưa thể chỉnh sửa.
              </Alert>
            )}

            <Controller
              name="customerName"
              control={control}
              rules={{
                required: "Vui lòng nhập tên khách hàng",
                validate: (value) =>
                  value.trim().length > 0 || "Vui lòng nhập tên khách hàng",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tên khách hàng"
                  fullWidth
                  disabled={isPendingConfirmation}
                  error={Boolean(errors.customerName)}
                  helperText={errors.customerName?.message}
                />
              )}
            />

            <Controller
              name="saleDate"
              control={control}
              rules={{
                required: "Vui lòng chọn ngày phát sinh",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ngày phát sinh"
                  type="date"
                  fullWidth
                  disabled={isPendingConfirmation}
                  error={Boolean(errors.saleDate)}
                  helperText={errors.saleDate?.message}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}
            />

            <Controller
              name="content"
              control={control}
              rules={{
                required: "Vui lòng nhập nội dung khoản thu",
                validate: (value) =>
                  value.trim().length > 0 || "Vui lòng nhập nội dung khoản thu",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nội dung khoản thu"
                  multiline
                  minRows={2}
                  fullWidth
                  disabled={isPendingConfirmation}
                  error={Boolean(errors.content)}
                  helperText={errors.content?.message}
                />
              )}
            />

            <Controller
              name="totalAmount"
              control={control}
              rules={{
                required: "Vui lòng nhập tổng tiền",
                validate: (value) =>
                  parseAmount(value) > 0 || "Tổng tiền phải lớn hơn 0",
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Tổng tiền"
                  placeholder="0"
                  fullWidth
                  disabled={isPendingConfirmation}
                  error={Boolean(errors.totalAmount)}
                  helperText={errors.totalAmount?.message}
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
              name="paidAmount"
              control={control}
              rules={{
                validate: (value) => {
                  const currentPaidAmount = parseAmount(value);

                  const currentTotalAmount = parseAmount(
                    watch("totalAmount") ?? ""
                  );

                  return (
                    currentPaidAmount <= currentTotalAmount ||
                    "Số tiền đã thu không được lớn hơn tổng tiền"
                  );
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Số tiền đã thu"
                  placeholder="0"
                  fullWidth
                  disabled={isPendingConfirmation}
                  error={Boolean(errors.paidAmount)}
                  helperText={errors.paidAmount?.message}
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

            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2.5,
                backgroundColor: "background.default",
              }}
            >
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography color="text.secondary">Tổng tiền</Typography>

                  <Typography sx={{ fontWeight: 800 }}>
                    {formatVnd(totalAmount)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography color="text.secondary">Đã thu</Typography>

                  <Typography
                    sx={{
                      color: "success.main",
                      fontWeight: 800,
                    }}
                  >
                    {formatVnd(paidAmount)}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography color="text.secondary">Còn nợ</Typography>

                  <Typography
                    sx={{
                      color:
                        remainingAmount > 0 ? "error.main" : "success.main",
                      fontWeight: 900,
                    }}
                  >
                    {formatVnd(remainingAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ghi chú"
                  multiline
                  minRows={2}
                  fullWidth
                  disabled={isPendingConfirmation}
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
            disabled={isSubmitting || isPendingConfirmation}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
