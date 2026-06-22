"use client";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import { formatDateVi } from "@/utils/date";
import type {
  PublicDebtItem,
  PublicDebtOverview,
} from "../types/public-debt.types";
import {
  downloadPublicDebtPdf,
  getPublicDebtOverview,
} from "@/api/public-debts.api";
import { useToast } from "@/components/toast/ToastProvider";
import { PublicDebtPaymentDialog } from "./PublicDebtPaymentDialog";
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

export function PublicCustomerDebts() {
  const searchParams = useSearchParams();
  const customerName = searchParams.get("customerName")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const [data, setData] = useState<PublicDebtOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [paymentTarget, setPaymentTarget] = useState<
    | { scope: "ALL"; amount: number }
    | { scope: "SINGLE"; amount: number; sale: PublicDebtItem }
    | null
  >(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const toast = useToast();

  const loadData = async (): Promise<void> => {
    if (!customerName || !token) {
      setErrorMessage("Đường dẫn công nợ không đầy đủ hoặc không hợp lệ.");

      setLoading(false);
      return;
    }

    try {
      const result = await getPublicDebtOverview(customerName, token);

      setData(result);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải thông tin công nợ.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [customerName, token]);

  const handleDownloadPdf = async (): Promise<void> => {
    setDownloadingPdf(true);

    try {
      await downloadPublicDebtPdf(customerName, token);

      toast.success("Đã tải file PDF công nợ.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải file PDF công nợ."));
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        py: { xs: 2, sm: 4 },
      }}
    >
      
      <Container maxWidth="md" sx={{ px: { xs: 1.25, sm: 3 } }}>
        
        <Stack spacing={2}>
          
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 2.5, sm: 3 },
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "common.white",
              }}
            >
              
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                
                Thông tin công nợ
              </Typography>
              <Typography sx={{ mt: 0.5, opacity: 0.9 }}>
                
                Chi tiết các khoản chưa thanh toán
              </Typography>
            </Box>
            {!loading && data && (
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                
                <Typography variant="body2" color="text.secondary">
                  
                  Khách hàng
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 900 }}>
                  
                  {data.customerName}
                </Typography>
              </CardContent>
            )}
          </Card>
          {loading && (
            <>
              
              <Skeleton
                variant="rounded"
                height={130}
                sx={{ borderRadius: 3 }}
              />
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={190}
                  sx={{ borderRadius: 3 }}
                />
              ))}
            </>
          )}
          {!loading && errorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
              
              {errorMessage}
            </Alert>
          )}
          {!loading && data && (
            <>
              
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                
                <SummaryCard
                  label="Số khoản nợ"
                  value={data.summary.totalOrders.toLocaleString("vi-VN")}
                />
                <SummaryCard
                  label="Tổng tiền"
                  value={formatVnd(data.summary.totalAmount)}
                />
                <SummaryCard
                  label="Đã thanh toán"
                  value={formatVnd(data.summary.totalPaid)}
                  color="success.main"
                />
                <SummaryCard
                  label="Tổng còn nợ"
                  value={formatVnd(data.summary.totalDebt)}
                  color="error.main"
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                
                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  startIcon={<PaymentsOutlinedIcon />}
                  disabled={
                    data.summary.totalDebt <= 0 ||
                    data.items.some(
                      (item) => item.confirmationStatus === "PENDING"
                    )
                  }
                  onClick={() => {
                    setPaymentTarget({
                      scope: "ALL",
                      amount: data.summary.totalDebt,
                    });
                  }}
                  sx={{ minHeight: 48 }}
                >
                  
                  Thanh toán toàn bộ
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  disabled={downloadingPdf}
                  onClick={() => {
                    void handleDownloadPdf();
                  }}
                  sx={{ minHeight: 48 }}
                >
                  
                  {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF công nợ"}
                </Button>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, px: 0.5 }}>
                
                Các khoản chưa thanh toán
              </Typography>
              {data.items.length === 0 ? (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  
                  <CardContent>
                    
                    <Typography
                      align="center"
                      color="success.main"
                      sx={{ fontWeight: 800 }}
                    >
                      
                      Khách hàng hiện không còn công nợ.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.25}>
                  
                  {data.items.map((item, index) => (
                    <Card
                      key={`${item.saleDate}-${index}`}
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        borderLeft: "4px solid",
                        borderLeftColor:
                          item.paymentStatus === "PARTIAL"
                            ? "warning.main"
                            : "error.main",
                      }}
                    >
                      
                      <CardContent
                        sx={{
                          p: { xs: 1.75, sm: 2.25 },
                          "&:last-child": { pb: { xs: 1.75, sm: 2.25 } },
                        }}
                      >
                        
                        <Stack spacing={1.5}>
                          
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                            }}
                          >
                            
                            <Box>
                              
                              <Typography
                                sx={{ fontWeight: 900, fontSize: 16 }}
                              >
                                
                                {item.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                
                                {formatDateVi(item.saleDate)}
                              </Typography>
                            </Box>
                            <Chip
                              label={
                                item.paymentStatus === "PARTIAL"
                                  ? "Đã trả một phần"
                                  : "Chưa thanh toán"
                              }
                              color={
                                item.paymentStatus === "PARTIAL"
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                          <Divider />
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                              gap: 1,
                            }}
                          >
                            
                            <AmountItem
                              label="Tổng tiền"
                              value={formatVnd(item.totalAmount)}
                            />
                            <AmountItem
                              label="Đã trả"
                              value={formatVnd(item.paidAmount)}
                              color="success.main"
                            />
                            <AmountItem
                              label="Còn nợ"
                              value={formatVnd(item.remainingAmount)}
                              color="error.main"
                            />
                          </Box>
                        </Stack>
                        {item.confirmationStatus === "PENDING" ? (
                          <Alert severity="warning" variant="outlined">
                            
                            Khoản thanh toán đang chờ quản trị viên xác nhận.
                          </Alert>
                        ) : (
                          <Button
                            type="button"
                            variant="outlined"
                            color="success"
                            fullWidth
                            onClick={() => {
                              setPaymentTarget({
                                scope: "SINGLE",
                                amount: item.remainingAmount,
                                sale: item,
                              });
                            }}
                            sx={{ minHeight: 46 }}
                          >
                            
                            Thanh toán khoản này
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
              >
                
                Dữ liệu được cập nhật lúc
                {new Date(data.generatedAt).toLocaleString("vi-VN")}
              </Typography>
            </>
          )}
        </Stack>
        {paymentTarget && data && (
          <PublicDebtPaymentDialog
            open
            customerName={data.customerName}
            token={token}
            amount={paymentTarget.amount}
            scope={paymentTarget.scope}
            saleId={
              paymentTarget.scope === "SINGLE"
                ? paymentTarget.sale.saleId
                : undefined
            }
            title={
              paymentTarget.scope === "ALL"
                ? "Thanh toán toàn bộ công nợ"
                : "Thanh toán khoản công nợ"
            }
            onClose={() => setPaymentTarget(null)}
            onSubmitted={async () => {
              setLoading(true);
              await loadData();
            }}
          />
        )}
      </Container>
    </Box>
  );
}
type SummaryCardProps = { label: string; value: string; color?: string };
function SummaryCard({
  label,
  value,
  color = "text.primary",
}: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, height: "100%" }}>
      
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        
        <Typography variant="caption" color="text.secondary">
          
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            fontWeight: 900,
            fontSize: { xs: 16, sm: 19 },
            color,
            overflowWrap: "anywhere",
          }}
        >
          
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
type AmountItemProps = { label: string; value: string; color?: string };
function AmountItem({ label, value, color = "text.primary" }: AmountItemProps) {
  return (
    <Box>
      
      <Typography variant="caption" color="text.secondary">
        
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ mt: 0.25, fontWeight: 900, color, overflowWrap: "anywhere" }}
      >
        
        {value}
      </Typography>
    </Box>
  );
}
