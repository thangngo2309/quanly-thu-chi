"use client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import { formatDateVi } from "@/utils/date";
import type { PendingDebtPaymentRequest } from "../types/debt-payment-request.types";
import { approveDebtPaymentRequest, getPendingDebtPaymentRequests, rejectDebtPaymentRequest } from "@/api/debt-payment-requests.api";
type PendingPaymentRequestsProps = {
  reloadKey?: number;
  onChanged: () => Promise<void>;
};
export function PendingPaymentRequests({
  reloadKey,
  onChanged,
}: PendingPaymentRequestsProps) {
  const toast = useToast();
  const [requests, setRequests] = useState<PendingDebtPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const loadRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await getPendingDebtPaymentRequests();
      setRequests(result);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải yêu cầu thanh toán.")
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadRequests();
  }, [reloadKey]);
  const handleApprove = async (
    request: PendingDebtPaymentRequest
  ): Promise<void> => {
    setProcessingId(request.id);
    try {
      await approveDebtPaymentRequest(request.id);
      toast.success(`Đã xác nhận thanh toán ${request.code}.`);
      await loadRequests();
      await onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xác nhận thanh toán."));
    } finally {
      setProcessingId(null);
    }
  };
  const handleReject = async (
    request: PendingDebtPaymentRequest
  ): Promise<void> => {
    setProcessingId(request.id);
    try {
      await rejectDebtPaymentRequest(request.id);
      toast.success(`Đã từ chối yêu cầu ${request.code}.`);
      await loadRequests();
      await onChanged();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể từ chối yêu cầu."));
    } finally {
      setProcessingId(null);
    }
  };
  if (loading) {
    return (
      <Card variant="outlined">
        
        <CardContent>
          
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            
            <CircularProgress size={20} />
            <Typography> Đang tải yêu cầu thanh toán... </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  if (requests.length === 0) {
    return null;
  }
  return (
    <Stack spacing={1.5}>
      
      <Alert severity="warning" variant="outlined">
        
        Có {requests.length} yêu cầu thanh toán đang chờ xác nhận.
      </Alert>
      {requests.map((request) => (
        <Card
          key={request.id}
          variant="outlined"
          sx={{
            borderRadius: 2.5,
            borderLeft: "4px solid",
            borderLeftColor: "warning.main",
          }}
        >
          
          <CardContent>
            
            <Stack spacing={1.5}>
              
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ justifyContent: "space-between" }}
              >
                
                <Box>
                  
                  <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                    
                    {request.customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    
                    {request.code} · {formatDateVi(request.createdAt)}
                  </Typography>
                </Box>
                <Chip
                  label={
                    request.scope === "ALL"
                      ? "Thanh toán toàn bộ"
                      : "Thanh toán một khoản"
                  }
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Divider />
              <Typography
                variant="h6"
                sx={{ color: "error.main", fontWeight: 900 }}
              >
                
                {formatVnd(request.amount)}
              </Typography>
              <Stack spacing={0.75}>
                
                {request.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    
                    <Typography variant="body2">
                      
                      {item.sale.content}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      
                      {formatVnd(item.requestedAmount)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  disabled={processingId === request.id}
                  onClick={() => {
                    void handleReject(request);
                  }}
                >
                  
                  Từ chối
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  disabled={processingId === request.id}
                  onClick={() => {
                    void handleApprove(request);
                  }}
                >
                  
                  Xác nhận thanh toán
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
