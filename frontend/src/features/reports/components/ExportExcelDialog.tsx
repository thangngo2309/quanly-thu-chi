"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  type ButtonProps,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { HDatePicker, HForm } from "@/components/form";
import { getApiErrorMessage } from "@/utils/api-error";

import type { ExportReportFormValues } from "../types/report.types";
import { downloadReportExcel } from "@/api/reports.api";
import { useToast } from "@/components/toast/ToastProvider";

type ExportExcelDialogProps = {
  buttonColor?: ButtonProps["color"];
  buttonVariant?: ButtonProps["variant"];
  fullWidth?: boolean;
};

const defaultValues: ExportReportFormValues = {
  fromDate: "",
  toDate: "",
};

export function ExportExcelDialog({
  buttonColor = "success",
  buttonVariant = "outlined",
  fullWidth = false,
}: ExportExcelDialogProps) {
  const toast = useToast();

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const methods = useForm<ExportReportFormValues>({
    defaultValues,
  });

  const { reset, setError, clearErrors } = methods;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      fromDate: dayjs().startOf("month").format("YYYY-MM-DD"),

      toDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    });
  }, [open, reset]);

  const handleClose = (): void => {
    if (loading) {
      return;
    }

    setOpen(false);
  };

  const handleSubmit: SubmitHandler<ExportReportFormValues> = async (
    values
  ) => {
    clearErrors();

    if (dayjs(values.fromDate).isAfter(dayjs(values.toDate), "day")) {
      setError("toDate", {
        type: "validate",
        message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      });

      return;
    }

    setLoading(true);

    try {
      await downloadReportExcel({
        fromDate: values.fromDate,
        toDate: values.toDate,
      });

      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xuất file Excel."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        color={buttonColor}
        fullWidth={fullWidth}
        onClick={() => setOpen(true)}
        sx={{
          minHeight: 44,
          whiteSpace: "nowrap",
        }}
      >
        Xuất Excel
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: "calc(100% - 24px)",
                sm: "100%",
              },
              mx: {
                xs: 1.5,
                sm: 4,
              },
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 900,
          }}
        >
          Xuất báo cáo Excel
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            File Excel bao gồm cả khoản thu, khoản chi và phần tổng kết lời lỗ
            trong cùng một sheet.
          </Typography>

          <HForm
            id="export-excel-form"
            methods={methods}
            onSubmit={handleSubmit}
          >
            <Stack spacing={2}>
              <HDatePicker<ExportReportFormValues>
                name="fromDate"
                label="Từ ngày"
                rules={{
                  required: "Vui lòng chọn ngày bắt đầu",
                }}
              />

              <HDatePicker<ExportReportFormValues>
                name="toDate"
                label="Đến ngày"
                rules={{
                  required: "Vui lòng chọn ngày kết thúc",
                }}
              />
            </Stack>
          </HForm>
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
            disabled={loading}
            onClick={handleClose}
          >
            Hủy
          </Button>

          <Button
            type="submit"
            form="export-excel-form"
            variant="contained"
            color="success"
            disabled={loading}
            sx={{
              minWidth: 130,
            }}
          >
            {loading && (
              <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
            )}

            {loading ? "Đang tạo file..." : "Tải Excel"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
