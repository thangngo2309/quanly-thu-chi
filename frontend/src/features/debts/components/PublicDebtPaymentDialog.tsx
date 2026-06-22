"use client";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import type { PublicPaymentRequestScope } from "../types/public-debt.types";
import { createPublicPaymentRequest } from "@/api/public-debts.api";
type PublicDebtPaymentDialogProps = {
  open: boolean;
  customerName: string;
  token: string;
  amount: number;
  scope: PublicPaymentRequestScope;
  saleId?: string;
  title: string;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
};
export function PublicDebtPaymentDialog({
  open,
  customerName,
  token,
  amount,
  scope,
  saleId,
  title,
  onClose,
  onSubmitted,
}: PublicDebtPaymentDialogProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const qrImageUrl = `${basePath}/payment/payment-qr.png`;
  const handleConfirm = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const result = await createPublicPaymentRequest(customerName, token, {
        scope,
        saleId,
      });
      toast.success(
        `Đã gửi yêu cầu thanh toán ${result.code}. Vui lòng chờ xác nhận.`,
        { duration: 6000 }
      );
      await onSubmitted();
      onClose();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể gửi yêu cầu xác nhận thanh toán.")
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            width: { xs: "calc(100% - 24px)", sm: "100%" },
            mx: { xs: 1.5, sm: 4 },
            borderRadius: 3,
          },
        },
      }}
    >
      
      <DialogTitle sx={{ pb: 1, fontWeight: 900 }}> {title} </DialogTitle>
      <DialogContent>
        
        <Stack spacing={2}>
          
          <Alert severity="info" variant="outlined">
            
            Quét mã bên dưới để thanh toán. Sau khi chuyển khoản thành công, bấm
            nút “Tôi đã thanh toán”.
          </Alert>
          <Box
            component="img"
            src={qrImageUrl}
            alt="Mã thanh toán"
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 300,
              maxHeight: 360,
              objectFit: "contain",
              mx: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              backgroundColor: "common.white",
              p: 1,
            }}
          />
          <Divider />
          <Box>
            
            <Typography variant="body2" color="text.secondary">
              
              Khách hàng
            </Typography>
            <Typography sx={{ mt: 0.25, fontWeight: 900 }}>
              
              {customerName}
            </Typography>
          </Box>
          <Box>
            
            <Typography variant="body2" color="text.secondary">
              
              Số tiền thanh toán
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 0.25, color: "error.main", fontWeight: 900 }}
            >
              
              {formatVnd(amount)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            
            Hệ thống chưa tự động kiểm tra giao dịch ngân hàng. Yêu cầu sẽ được
            chuyển đến quản trị viên để xác nhận.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
          "& .MuiButton-root": {
            width: { xs: "100%", sm: "auto" },
            minHeight: 46,
          },
          "& .MuiButton-root + .MuiButton-root": { ml: { xs: 0, sm: 1 } },
        }}
      >
        
        <Button
          type="button"
          variant="outlined"
          disabled={submitting}
          onClick={onClose}
        >
          
          Đóng
        </Button>
        <Button
          type="button"
          variant="contained"
          color="success"
          disabled={submitting}
          onClick={() => {
            void handleConfirm();
          }}
        >
          
          {submitting && (
            <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
          )}
          {submitting ? "Đang gửi..." : "Tôi đã thanh toán"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
