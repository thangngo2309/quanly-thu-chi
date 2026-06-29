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
import { formatDateTime, formatDateVi } from "@/utils/date";
import type {
  PaymentStatus,
  Sale,
  SalesSearchValues,
} from "../types/sale.types";
import { HDataTable, HMobileList } from "@/components/datatable";
import {
  deleteSale,
  getSales,
  markSaleAsDelivered,
  markSaleAsPaid,
} from "@/api/sales.api";
import { ExportExcelDialog } from "@/features/reports/components/ExportExcelDialog";
import { useToast } from "@/components/toast/ToastProvider";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { SaleEditDialog } from "./SaleEditDialog";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

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

  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const [saleToMarkPaid, setSaleToMarkPaid] = useState<Sale | null>(null);

  const [saleToMarkDelivered, setSaleToMarkDelivered] = useState<Sale | null>(
    null
  );

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

  const handleMarkSaleAsDelivered = async (): Promise<void> => {
    if (!saleToMarkDelivered) {
      return;
    }

    setActionLoading(true);

    try {
      await markSaleAsDelivered(saleToMarkDelivered.id);

      toast.success("Đã cập nhật trạng thái giao hàng.");

      setSaleToMarkDelivered(null);

      await loadSales();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể cập nhật trạng thái giao hàng.")
      );
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
        field: "deliveryAt",
        headerName: "Ngày giờ giao",
        width: 170,
        sortable: true,

        renderCell: ({ row }) => (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "normal",
              lineHeight: 1.4,
            }}
          >
            {formatDateTime(row.deliveryAt)}
          </Typography>
        ),
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
        field: "isDelivered",
        headerName: "Trạng thái giao",
        width: 145,
        sortable: true,

        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={row.isDelivered ? "success" : "default"}
            variant={row.isDelivered ? "filled" : "outlined"}
            label={row.isDelivered ? "Đã giao" : "Chưa giao"}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 310,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              width: "100%",
              py: 1,
              alignItems: "center",
              flexWrap: "nowrap",

              "& .MuiButton-root": {
                minWidth: "auto",
                whiteSpace: "nowrap",
                px: 1.25,
              },
            }}
          >
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
              startIcon={<EditOutlinedIcon />}
              disabled={Boolean(row.pendingDebtPaymentRequestId)}
              onClick={() => setSaleToEdit(row)}
            >
              Sửa
            </Button>

            <Button
              type="button"
              size="small"
              variant="outlined"
              color="info"
              startIcon={<LocalShippingOutlinedIcon />}
              disabled={row.isDelivered || actionLoading}
              onClick={() => {
                setSaleToMarkDelivered(row);
              }}
            >
              Đã giao
            </Button>

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

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 2,
                              }}
                            >
                              <Typography color="text.secondary">
                                Ngày giờ giao
                              </Typography>

                              <Typography
                                sx={{
                                  textAlign: "right",
                                  fontWeight: 700,
                                }}
                              >
                                {formatDateTime(sale.deliveryAt)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Typography color="text.secondary">
                                Trạng thái giao
                              </Typography>

                              <Chip
                                size="small"
                                color={sale.isDelivered ? "success" : "default"}
                                variant={
                                  sale.isDelivered ? "filled" : "outlined"
                                }
                                label={
                                  sale.isDelivered ? "Đã giao" : "Chưa giao"
                                }
                              />
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
                                startIcon={<EditOutlinedIcon />}
                                fullWidth
                                disabled={Boolean(
                                  sale.pendingDebtPaymentRequestId
                                )}
                                onClick={() => setSaleToEdit(sale)}
                                sx={{
                                  minHeight: 44,
                                }}
                              >
                                Chỉnh sửa khoản thu
                              </Button>

                              <Button
                                type="button"
                                variant="outlined"
                                color="info"
                                startIcon={<LocalShippingOutlinedIcon />}
                                fullWidth
                                disabled={sale.isDelivered || actionLoading}
                                onClick={() => {
                                  setSaleToMarkDelivered(sale);
                                }}
                                sx={{
                                  minHeight: 44,
                                }}
                              >
                                {sale.isDelivered
                                  ? "Đã giao hàng"
                                  : "Xác nhận đã giao"}
                              </Button>

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
            Bạn có chắc muốn xóa khoản thu của
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

      <SaleEditDialog
        open={Boolean(saleToEdit)}
        sale={saleToEdit}
        onClose={() => {
          setSaleToEdit(null);
        }}
        onSaved={async () => {
          setSaleToEdit(null);
          await loadSales();
        }}
      />

      <HConfirmDialog
        open={Boolean(saleToMarkPaid)}
        title="Xác nhận đã thu đủ"
        description={
          <>
            Xác nhận khách hàng <strong>{saleToMarkPaid?.customerName}</strong>
            đã thanh toán đủ
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

      <HConfirmDialog
        open={Boolean(saleToMarkDelivered)}
        title="Xác nhận đã giao hàng"
        description={
          <>
            Xác nhận đơn hàng của khách{" "}
            <strong>{saleToMarkDelivered?.customerName}</strong> đã được giao?
          </>
        }
        confirmText="Xác nhận đã giao"
        confirmColor="success"
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) {
            setSaleToMarkDelivered(null);
          }
        }}
        onConfirm={() => {
          void handleMarkSaleAsDelivered();
        }}
      />
    </Box>
  );
}
