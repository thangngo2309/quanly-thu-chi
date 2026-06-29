"use client";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
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
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";

import { HDatePicker, HForm, HInput, HRadio } from "@/components/form";
import { formatVnd } from "@/utils/currency";

import type { Sale, SaleFormValues } from "../types/sale.types";
import { createSale } from "@/api/sales.api";
import { HCustomerAutocomplete } from "@/components/form/HCustomerAutocomplete";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";

const defaultValues: SaleFormValues = {
  customerName: "",
  content: "",
  totalAmount: "",
  paymentStatus: "UNPAID",
  saleDate: "",
  deliveryAt: "",
  note: "",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(", ");
    }

    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    if (error.code === "ECONNABORTED") {
      return "Máy chủ phản hồi quá chậm. Vui lòng thử lại.";
    }

    if (!error.response) {
      return "Không thể kết nối đến máy chủ.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi khi lưu khoản thu.";
}

export function SaleCreateForm() {
  const toast = useToast();

  const methods = useForm<SaleFormValues>({
    defaultValues,
    mode: "onBlur",
  });

  const {
    control,
    reset,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    setValue("saleDate", dayjs().format("YYYY-MM-DD"));
  }, [setValue]);

  const totalAmountValue = useWatch({
    control,
    name: "totalAmount",
  });

  const paymentStatus = useWatch({
    control,
    name: "paymentStatus",
  });

  const totalAmount = useMemo(() => {
    const value = Number(totalAmountValue);

    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [totalAmountValue]);

  const paidAmount = paymentStatus === "PAID" ? totalAmount : 0;

  const remainingAmount = totalAmount - paidAmount;

  const onSubmit: SubmitHandler<SaleFormValues> = async (values) => {
    try {
      const normalizedTotalAmount = Number(values.totalAmount);

      const sale = await createSale({
        customerName: values.customerName.trim(),
        content: values.content.trim(),
        totalAmount: normalizedTotalAmount,
        paidAmount: values.paymentStatus === "PAID" ? normalizedTotalAmount : 0,
        saleDate: values.saleDate,
        deliveryAt: values.deliveryAt || undefined,

        note: values.note.trim() || undefined,
      });

      toast.success(`Đã tạo khoản thu của ${sale.customerName} thành công.`);

      reset({
        ...defaultValues,
        saleDate: dayjs().format("YYYY-MM-DD"),
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu khoản thu."));
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
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
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Nhập khoản thu
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ghi nhận doanh thu bán hàng và trạng thái thanh toán của khách.
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
        <HForm methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <HCustomerAutocomplete<SaleFormValues>
                name="customerName"
                freeSolo
                label="Tên khách hàng"
                placeholder="Nhập tên mới hoặc chọn khách hàng đã có"
                rules={{
                  required: "Vui lòng nhập tên khách hàng",

                  validate: (value) =>
                    value.trim().length > 0 || "Vui lòng nhập tên khách hàng",
                }}
              />

              <HDatePicker<SaleFormValues>
                name="saleDate"
                label="Ngày phát sinh"
                rules={{
                  required: "Vui lòng chọn ngày phát sinh",
                }}
              />
            </Box>

            <HInput<SaleFormValues>
              name="content"
              label="Nội dung mua"
              placeholder="Ví dụ: Mua 10 thùng sản phẩm"
              multiline
              minRows={3}
              rules={{
                required: "Vui lòng nhập nội dung mua",
                validate: (value) =>
                  value.trim().length > 0 || "Vui lòng nhập nội dung mua",
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <HInput<SaleFormValues>
                name="totalAmount"
                label="Tổng số tiền"
                placeholder="Nhập số tiền"
                type="number"
                slotProps={{
                  htmlInput: {
                    min: 1,
                    step: 1000,
                    inputMode: "numeric",
                  },
                }}
                rules={{
                  required: "Vui lòng nhập tổng số tiền",
                  validate: {
                    validNumber: (value) =>
                      Number.isFinite(Number(value)) || "Số tiền không hợp lệ",

                    greaterThanZero: (value) =>
                      Number(value) > 0 || "Số tiền phải lớn hơn 0",
                  },
                }}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "grey.50",
                }}
              >
                <HRadio<SaleFormValues>
                  name="paymentStatus"
                  label="Trạng thái thanh toán"
                  row
                  options={[
                    {
                      label: "Chưa thanh toán",
                      value: "UNPAID",
                    },
                    {
                      label: "Đã thanh toán",
                      value: "PAID",
                    },
                  ]}
                  rules={{
                    required: "Vui lòng chọn trạng thái thanh toán",
                  }}
                />
              </Paper>
            </Box>

            <HDatePicker<SaleFormValues>
              name="deliveryAt"
              label="Ngày giờ giao hàng"
              mode="datetime"
              valueFormat="iso"
              minutesStep={5}
            />

            <HInput<SaleFormValues>
              name="note"
              label="Ghi chú"
              placeholder="Thông tin bổ sung nếu có"
              multiline
              minRows={2}
              rules={{
                maxLength: {
                  value: 1000,
                  message: "Ghi chú không quá 1.000 ký tự",
                },
              }}
            />

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "primary.50",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 800 }}>
                Thông tin ghi nhận
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tổng doanh thu
                  </Typography>

                  <Typography sx={{ mt: 0.25, fontWeight: 800 }}>
                    {formatVnd(totalAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Đã thu
                  </Typography>

                  <Typography
                    color="success.main"
                    sx={{ mt: 0.25, fontWeight: 800 }}
                  >
                    {formatVnd(paidAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Còn nợ
                  </Typography>

                  <Typography
                    color={remainingAmount > 0 ? "error.main" : "text.primary"}
                    sx={{ mt: 0.25, fontWeight: 800 }}
                  >
                    {formatVnd(remainingAmount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Stack
              direction={{
                xs: "column-reverse",
                sm: "row",
              }}
              spacing={1.5}
              sx={{ justifyContent: "flex-end" }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={isSubmitting}
                onClick={() => {
                  reset({
                    ...defaultValues,
                    saleDate: dayjs().format("YYYY-MM-DD"),
                  });
                }}
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
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveOutlinedIcon />
                  )
                }
                sx={{
                  minHeight: 44,
                  minWidth: 160,
                }}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu khoản thu"}
              </Button>
            </Stack>
          </Stack>
        </HForm>
      </CardContent>
    </Card>
  );
}
