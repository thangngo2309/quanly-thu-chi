"use client";

import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
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
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { HConfirmDialog } from "@/components/dialog/HConfirmDialog";
import { HCustomerAutocomplete, HDatePicker } from "@/components/form";
import { ExportExcelDialog } from "@/features/reports/components/ExportExcelDialog";
import type { PaymentStatus, Sale } from "@/features/sales/types/sale.types";
import { useResponsiveMode } from "@/hooks/use-responsive-mode";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import { formatDateVi } from "@/utils/date";

import type { DebtSearchValues, DebtSummary } from "../types/debt.types";
import { downloadDebtsPdf, getDebts } from "@/api/debts.api";
import { markSaleAsPaid } from "@/api/sales.api";
import { HDataTable, HMobileList } from "@/components/datatable";

const defaultSearchValues: DebtSearchValues = {
  customerName: "",
  fromDate: "",
  toDate: "",
};

const emptySummary: DebtSummary = {
  totalOrders: 0,
  totalRevenue: 0,
  totalCollected: 0,
  totalDebt: 0,
};

type SummaryItemProps = {
  label: string;
  value: string;
  color?: string;
};

function SummaryItem({
  label,
  value,
  color = "text.primary",
}: SummaryItemProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2.5,
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },

          "&:last-child": {
            pb: {
              xs: 1.5,
              sm: 2,
            },
          },
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: {
              xs: 17,
              sm: 21,
            },
            lineHeight: 1.3,
            fontWeight: 900,
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

function getDebtStatus(status: PaymentStatus) {
  if (status === "PARTIAL") {
    return {
      label: "Đã thanh toán một phần",
      color: "warning" as const,
    };
  }

  return {
    label: "Chưa thanh toán",
    color: "error" as const,
  };
}

export function DebtsManagement() {
  const { mounted, isMobile } = useResponsiveMode();

  const searchMethods = useForm<DebtSearchValues>({
    defaultValues: defaultSearchValues,
  });

  const [debts, setDebts] = useState<Sale[]>([]);

  const [summary, setSummary] = useState<DebtSummary>(emptySummary);

  const [loading, setLoading] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [saleToMarkPaid, setSaleToMarkPaid] = useState<Sale | null>(null);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [rowCount, setRowCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<DebtSearchValues>({
    ...defaultSearchValues,
  });

  const loadDebts = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getDebts({
        page: paginationModel.page + 1,

        limit: paginationModel.pageSize,

        customerName: filters.customerName || undefined,

        fromDate: filters.fromDate || undefined,

        toDate: filters.toDate || undefined,
      });

      setDebts(response.items);

      setRowCount(response.meta.total);

      setTotalPages(response.meta.totalPages);

      setSummary(response.summary);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải danh sách công nợ.")
      );
    } finally {
      setLoading(false);
    }
  }, [filters, paginationModel]);

  useEffect(() => {
    void loadDebts();
  }, [loadDebts]);

  const handleSearch: SubmitHandler<DebtSearchValues> = (values) => {
    searchMethods.clearErrors();

    if (
      values.fromDate &&
      values.toDate &&
      dayjs(values.fromDate).isAfter(dayjs(values.toDate), "day")
    ) {
      searchMethods.setError("toDate", {
        type: "validate",
        message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      });

      return;
    }

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setFilters({
      customerName: values.customerName.trim(),

      fromDate: values.fromDate,
      toDate: values.toDate,
    });
  };

  const handleResetSearch = (): void => {
    searchMethods.reset({
      ...defaultSearchValues,
    });

    setPaginationModel((current) => ({
      ...current,
      page: 0,
    }));

    setFilters({
      ...defaultSearchValues,
    });
  };

  const handleMarkPaid = async (): Promise<void> => {
    if (!saleToMarkPaid) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    try {
      await markSaleAsPaid(saleToMarkPaid);

      setSaleToMarkPaid(null);

      setSuccessMessage("Đã cập nhật khoản thu thành đã thanh toán.");

      await loadDebts();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật trạng thái thanh toán.")
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    const customerName = filters.customerName.trim();
    if (!customerName) {
      setErrorMessage("Vui lòng chọn khách hàng trước khi tải PDF công nợ.");
      return;
    }
    setDownloadingPdf(true);
    setErrorMessage(null);
    try {
      await downloadDebtsPdf({
        customerName,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải file PDF công nợ.")
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const activeFilterCount = useMemo(
    () =>
      [filters.customerName, filters.fromDate, filters.toDate].filter(Boolean)
        .length,
    [filters]
  );

  const columns = useMemo<GridColDef<Sale>[]>(
    () => [
      {
        field: "saleDate",
        headerName: "Ngày",
        width: 110,
        sortable: false,

        renderCell: ({ row }) => formatDateVi(row.saleDate),
      },
      {
        field: "customerName",
        headerName: "Khách hàng",
        minWidth: 170,
        flex: 0.8,
        sortable: false,
      },
      {
        field: "content",
        headerName: "Nội dung",
        minWidth: 220,
        flex: 1.2,
        sortable: false,
      },
      {
        field: "totalAmount",
        headerName: "Tổng tiền",
        width: 135,
        align: "right",
        headerAlign: "right",
        sortable: false,

        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
            }}
          >
            {formatVnd(row.totalAmount)}
          </Typography>
        ),
      },
      {
        field: "paidAmount",
        headerName: "Đã thu",
        width: 130,
        align: "right",
        headerAlign: "right",
        sortable: false,

        renderCell: ({ row }) => formatVnd(row.paidAmount),
      },
      {
        field: "remainingAmount",
        headerName: "Còn nợ",
        width: 135,
        align: "right",
        headerAlign: "right",
        sortable: false,

        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: "error.main",
            }}
          >
            {formatVnd(row.remainingAmount)}
          </Typography>
        ),
      },
      {
        field: "paymentStatus",
        headerName: "Trạng thái",
        width: 190,
        sortable: false,

        renderCell: ({ row }) => {
          const status = getDebtStatus(row.paymentStatus);

          return (
            <Chip
              label={status.label}
              color={status.color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 155,
        sortable: false,
        filterable: false,

        renderCell: ({ row }) => (
          <Button
            type="button"
            size="small"
            variant="outlined"
            color="success"
            onClick={() => setSaleToMarkPaid(row)}
          >
            Đã thanh toán
          </Button>
        ),
      },
    ],
    []
  );

  const searchContent = (
    <>
      <HCustomerAutocomplete<DebtSearchValues>
        name="customerName"
        label="Tên khách hàng"
        placeholder="Nhập hoặc chọn khách hàng"
        freeSolo={false}
      />

      <HDatePicker<DebtSearchValues> name="fromDate" label="Từ ngày" />

      <HDatePicker<DebtSearchValues> name="toDate" label="Đến ngày" />
    </>
  );

  const desktopActions = (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <ExportExcelDialog />

      <Button
        type="button"
        variant="outlined"
        color="error"
        startIcon={<PictureAsPdfOutlinedIcon />}
        disabled={
          downloadingPdf || rowCount === 0 || !filters.customerName.trim()
        }
        onClick={() => {
          void handleDownloadPdf();
        }}
        sx={{
          minHeight: 44,
          whiteSpace: "nowrap",
        }}
      >
        {downloadingPdf
          ? "Đang tạo PDF..."
          : filters.customerName
          ? `PDF ${filters.customerName}`
          : "Chọn khách hàng để tải PDF"}
      </Button>

      <Link
        href="/"
        style={{
          textDecoration: "none",
        }}
      >
        <Button
          variant="contained"
          sx={{
            minHeight: 44,
            whiteSpace: "nowrap",
          }}
        >
          Tạo khoản thu
        </Button>
      </Link>
    </Box>
  );

  const mobileActions = (
    <>
      <ExportExcelDialog fullWidth />

      <Button
        type="button"
        variant="outlined"
        color="error"
        disabled={
          downloadingPdf || rowCount === 0 || !filters.customerName.trim()
        }
        onClick={() => {
          void handleDownloadPdf();
        }}
        sx={{
          minHeight: 44,
          whiteSpace: "nowrap",
        }}
      >
        {downloadingPdf ? 'Đang tạo...' : 'Tải PDF công nợ'}
      </Button>

      <Link
        href="/"
        style={{
          textDecoration: "none",
          width: "100%",
          gridColumn: "1 / -1",
        }}
      >
        <Button
          variant="contained"
          fullWidth
          sx={{
            minHeight: 44,
          }}
        >
          Tạo khoản thu mới
        </Button>
      </Link>
    </>
  );

  if (!mounted) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton
          variant="rounded"
          height={500}
          sx={{
            borderRadius: 3,
          }}
        />
      </Container>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 56px)",

        py: {
          xs: 1.5,
          md: 4,
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          px: {
            xs: 1.25,
            sm: 3,
          },
        }}
      >
        <Stack spacing={2}>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",

                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: {
                xs: 1,
                sm: 1.5,
              },
            }}
          >
            <SummaryItem
              label="Số khoản nợ"
              value={summary.totalOrders.toLocaleString("vi-VN")}
            />

            <SummaryItem
              label="Tổng doanh thu"
              value={formatVnd(summary.totalRevenue)}
            />

            <SummaryItem
              label="Đã thu"
              value={formatVnd(summary.totalCollected)}
              color="success.main"
            />

            <SummaryItem
              label="Tổng công nợ"
              value={formatVnd(summary.totalDebt)}
              color="error.main"
            />
          </Box>

          {isMobile ? (
            <HMobileList<DebtSearchValues>
              title="Quản lý công nợ"
              description="Theo dõi các khoản thu chưa được thanh toán đầy đủ."
              loading={loading}
              totalItems={rowCount}
              totalPages={totalPages}
              page={paginationModel.page}
              activeFilterCount={activeFilterCount}
              searchMethods={searchMethods}
              onSearch={handleSearch}
              searchContent={searchContent}
              onResetSearch={handleResetSearch}
              actions={mobileActions}
              onRefresh={() => {
                void loadDebts();
              }}
              onPageChange={(page) => {
                setPaginationModel((current) => ({
                  ...current,
                  page,
                }));
              }}
            >
              {debts.length === 0 ? (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                  }}
                >
                  <CardContent>
                    <Typography align="center" color="text.secondary">
                      Không có khoản công nợ phù hợp.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.25}>
                  {debts.map((sale) => {
                    const status = getDebtStatus(sale.paymentStatus);

                    return (
                      <Card
                        key={sale.id}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderLeft: "4px solid",
                          borderLeftColor:
                            sale.paymentStatus === "PARTIAL"
                              ? "warning.main"
                              : "error.main",

                          boxShadow: "0 3px 14px rgba(15, 23, 42, 0.05)",
                        }}
                      >
                        <CardContent
                          sx={{
                            p: 1.75,

                            "&:last-child": {
                              pb: 1.75,
                            },
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Stack
                              spacing={1}
                              sx={{
                                flexDirection: "row",

                                alignItems: "flex-start",

                                justifyContent: "space-between",
                              }}
                            >
                              <Box
                                sx={{
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 17,
                                    lineHeight: 1.35,
                                    fontWeight: 900,
                                  }}
                                >
                                  {sale.customerName}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatDateVi(sale.saleDate)}
                                </Typography>
                              </Box>

                              <Chip
                                label={status.label}
                                color={status.color}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                              }}
                            >
                              {sale.content}
                            </Typography>

                            <Divider />

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(3, minmax(0, 1fr))",

                                gap: 1,
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Tổng tiền
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 0.25,
                                    fontWeight: 800,
                                  }}
                                >
                                  {formatVnd(sale.totalAmount)}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Đã thu
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 0.25,
                                    fontWeight: 800,
                                    color: "success.main",
                                  }}
                                >
                                  {formatVnd(sale.paidAmount)}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Còn nợ
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 0.25,
                                    fontWeight: 900,
                                    color: "error.main",
                                  }}
                                >
                                  {formatVnd(sale.remainingAmount)}
                                </Typography>
                              </Box>
                            </Box>

                            {sale.note && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Ghi chú: {sale.note}
                              </Typography>
                            )}

                            <Button
                              type="button"
                              variant="contained"
                              color="success"
                              fullWidth
                              onClick={() => setSaleToMarkPaid(sale)}
                              sx={{
                                minHeight: 44,
                              }}
                            >
                              Xác nhận đã thanh toán
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </HMobileList>
          ) : (
            <HDataTable<Sale, DebtSearchValues>
              title="Quản lý công nợ"
              description="Theo dõi toàn bộ khoản thu chưa được thanh toán đầy đủ."
              rows={debts}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 20, 50]}
              searchMethods={searchMethods}
              onSearch={handleSearch}
              searchContent={searchContent}
              onResetSearch={handleResetSearch}
              actions={desktopActions}
              onRefresh={() => {
                void loadDebts();
              }}
              height={590}
              dataGridProps={{
                disableColumnSorting: true,
              }}
            />
          )}
        </Stack>
      </Container>

      <HConfirmDialog
        open={Boolean(saleToMarkPaid)}
        title="Xác nhận đã thanh toán"
        description={
          <>
            Xác nhận khoản thu của khách hàng{" "}
            <strong>{saleToMarkPaid?.customerName}</strong> đã thanh toán đủ số
            tiền còn nợ là{" "}
            <strong>{formatVnd(saleToMarkPaid?.remainingAmount ?? 0)}</strong>?
          </>
        }
        confirmText="Đã thanh toán"
        confirmColor="success"
        loading={actionLoading}
        onClose={() => setSaleToMarkPaid(null)}
        onConfirm={() => {
          void handleMarkPaid();
        }}
      />
    </Box>
  );
}
