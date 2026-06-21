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
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { HConfirmDialog } from "@/components/dialog/HConfirmDialog";
import { HDatePicker, HDropdown, HInput } from "@/components/form";
import { useResponsiveMode } from "@/hooks/use-responsive-mode";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import { formatDateVi } from "@/utils/date";
import type {
  PaymentStatus,
  Sale,
  SalesSearchValues,
} from "../types/sale.types";
import { HDataTable, HMobileList } from "@/components/datatable";
import { deleteSale, getSales, markSaleAsPaid } from "@/api/sales.api";
import { ExportExcelDialog } from "@/features/reports/components/ExportExcelDialog";
import { useToast } from "@/components/toast/ToastProvider";

const defaultSearchValues: SalesSearchValues = {
  q: "",
  paymentStatus: "",
  fromDate: "",
  toDate: "",
};

const statusOptions = [
  {
    label: "Chưa thanh toán",
    value: "UNPAID",
  },
  {
    label: "Thanh toán một phần",
    value: "PARTIAL",
  },
  {
    label: "Đã thanh toán",
    value: "PAID",
  },
];

function getStatusConfig(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return {
        label: "Đã thanh toán",
        color: "success" as const,
      };

    case "PARTIAL":
      return {
        label: "Thanh toán một phần",
        color: "warning" as const,
      };

    case "UNPAID":
    default:
      return {
        label: "Chưa thanh toán",
        color: "error" as const,
      };
  }
}

export function SalesManagement() {
  const { mounted, isMobile } = useResponsiveMode();
  const toast = useToast();

  const searchMethods = useForm<SalesSearchValues>({
    defaultValues: defaultSearchValues,
  });

  const [sales, setSales] = useState<Sale[]>([]);

  const [loading, setLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const [saleToMarkPaid, setSaleToMarkPaid] = useState<Sale | null>(null);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [rowCount, setRowCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<SalesSearchValues>({
    ...defaultSearchValues,
  });

  const loadSales = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getSales({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: filters.q || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      setSales(response.items);
      setRowCount(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải danh sách khoản thu.")
      );
    } finally {
      setLoading(false);
    }
  }, [filters, paginationModel]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const handleSearch: SubmitHandler<SalesSearchValues> = (values) => {
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
      q: values.q.trim(),
      paymentStatus: values.paymentStatus,
      fromDate: values.fromDate,
      toDate: values.toDate,
    });
  };

  const handleResetSearch = () => {
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

  const handleDelete = async () => {
    if (!saleToDelete) {
      return;
    }

    setActionLoading(true);

    try {
      await deleteSale(saleToDelete.id);

      setSaleToDelete(null);
      toast.success("Đã xóa khoản thu thành công.");

      await loadSales();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa khoản thu."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!saleToMarkPaid) {
      return;
    }

    setActionLoading(true);

    try {
      await markSaleAsPaid(saleToMarkPaid);

      setSaleToMarkPaid(null);
      toast.success("Đã cập nhật khách hàng thanh toán đủ.");

      await loadSales();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật khoản thu."));
    } finally {
      setActionLoading(false);
    }
  };

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
        headerName: "Nội dung mua",
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
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
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
        width: 130,
        align: "right",
        headerAlign: "right",
        sortable: false,
        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 800,
              color: row.remainingAmount > 0 ? "error.main" : "success.main",
            }}
          >
            {formatVnd(row.remainingAmount)}
          </Typography>
        ),
      },
      {
        field: "paymentStatus",
        headerName: "Trạng thái",
        width: 170,
        sortable: false,
        renderCell: ({ row }) => {
          const config = getStatusConfig(row.paymentStatus);

          return (
            <Chip
              label={config.label}
              color={config.color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 190,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75}>
            {row.paymentStatus !== "PAID" && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => setSaleToMarkPaid(row)}
              >
                Thu đủ
              </Button>
            )}

            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setSaleToDelete(row)}
            >
              Xóa
            </Button>
          </Stack>
        ),
      },
    ],
    []
  );

  const searchContent = (
    <>
      <HInput<SalesSearchValues>
        name="q"
        label="Tên khách hoặc nội dung"
        placeholder="Nhập từ khóa"
      />

      <HDropdown<SalesSearchValues>
        name="paymentStatus"
        label="Trạng thái"
        placeholder="Tất cả trạng thái"
        options={statusOptions}
      />

      <HDatePicker<SalesSearchValues> name="fromDate" label="Từ ngày" />

      <HDatePicker<SalesSearchValues> name="toDate" label="Đến ngày" />
    </>
  );

  const activeFilterCount = useMemo(
    () =>
      [
        filters.q,
        filters.paymentStatus,
        filters.fromDate,
        filters.toDate,
      ].filter(Boolean).length,
    [filters]
  );

  const pageActions = (
    <>
      <ExportExcelDialog fullWidth={isMobile} />

      <Button
        component={Link}
        href="/"
        variant="contained"
        fullWidth={isMobile}
        sx={{
          minHeight: 44,
          whiteSpace: "nowrap",
        }}
      >
        Tạo khoản thu
      </Button>
    </>
  );

  if (!mounted) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 64px)",
        py: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          px: {
            xs: 1.5,
            sm: 3,
          },
        }}
      >
        <Stack spacing={2}>
          {isMobile ? (
            <HMobileList<SalesSearchValues>
              title="Quản lý khoản thu"
              description="Theo dõi doanh thu, tiền đã thu và công nợ."
              loading={loading}
              totalItems={rowCount}
              totalPages={totalPages}
              page={paginationModel.page}
              activeFilterCount={activeFilterCount}
              searchMethods={searchMethods}
              onSearch={handleSearch}
              searchContent={searchContent}
              onResetSearch={handleResetSearch}
              actions={pageActions}
              onRefresh={() => {
                void loadSales();
              }}
              onPageChange={(page) => {
                setPaginationModel((current) => ({
                  ...current,
                  page,
                }));
              }}
            >
              {sales.length === 0 ? (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" align="center">
                      Chưa có khoản thu phù hợp.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {sales.map((sale) => {
                    const status = getStatusConfig(sale.paymentStatus);

                    return (
                      <Card
                        key={sale.id}
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                        }}
                      >
                        <CardContent
                          sx={{
                            p: 2,
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              <Box>
                                <Typography
                                  sx={{
                                    fontWeight: 900,
                                    fontSize: 17,
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
                                    color:
                                      sale.remainingAmount > 0
                                        ? "error.main"
                                        : "success.main",
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

                            <Stack direction="row" spacing={1}>
                              {sale.paymentStatus !== "PAID" && (
                                <Button
                                  type="button"
                                  variant="outlined"
                                  color="success"
                                  fullWidth
                                  onClick={() => setSaleToMarkPaid(sale)}
                                  sx={{
                                    minHeight: 44,
                                  }}
                                >
                                  Đã thu đủ
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="outlined"
                                color="error"
                                fullWidth
                                onClick={() => setSaleToDelete(sale)}
                                sx={{
                                  minHeight: 44,
                                }}
                              >
                                Xóa
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </HMobileList>
          ) : (
            <HDataTable<Sale, SalesSearchValues>
              title="Quản lý khoản thu"
              description="Theo dõi doanh thu, tiền đã thu và công nợ khách hàng."
              rows={sales}
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
              actions={pageActions}
              onRefresh={() => {
                void loadSales();
              }}
              height={570}
              dataGridProps={{
                disableColumnSorting: true,
              }}
            />
          )}
        </Stack>
      </Container>

      <HConfirmDialog
        open={Boolean(saleToDelete)}
        title="Xóa khoản thu"
        description={
          <>
            Bạn có chắc muốn xóa khoản thu của{" "}
            <strong>{saleToDelete?.customerName}</strong>? Thao tác này không
            thể hoàn tác.
          </>
        }
        confirmText="Xóa"
        confirmColor="error"
        loading={actionLoading}
        onClose={() => setSaleToDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <HConfirmDialog
        open={Boolean(saleToMarkPaid)}
        title="Xác nhận đã thu đủ"
        description={
          <>
            Xác nhận khách hàng <strong>{saleToMarkPaid?.customerName}</strong>{" "}
            đã thanh toán đủ{" "}
            <strong>{formatVnd(saleToMarkPaid?.totalAmount)}</strong>?
          </>
        }
        confirmText="Xác nhận"
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
