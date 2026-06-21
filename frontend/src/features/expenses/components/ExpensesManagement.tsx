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

import type { Expense, ExpensesSearchValues } from "../types/expense.types";
import { deleteExpense, getExpenses } from "@/api/expenses.api";
import { HDataTable, HMobileList } from "@/components/datatable";
import { ExportExcelDialog } from "@/features/reports/components/ExportExcelDialog";
import { useToast } from "@/components/toast/ToastProvider";

const expenseCategoryOptions = [
  {
    label: "Nguyên vật liệu",
    value: "Nguyên vật liệu",
  },
  {
    label: "Vận chuyển",
    value: "Vận chuyển",
  },
  {
    label: "Điện, nước",
    value: "Điện, nước",
  },
  {
    label: "Nhân công",
    value: "Nhân công",
  },
  {
    label: "Thuê mặt bằng",
    value: "Thuê mặt bằng",
  },
  {
    label: "Chi phí khác",
    value: "Chi phí khác",
  },
];

const defaultSearchValues: ExpensesSearchValues = {
  q: "",
  category: "",
  fromDate: "",
  toDate: "",
};

export function ExpensesManagement() {
  const { mounted, isMobile } = useResponsiveMode();
  const toast = useToast();

  const searchMethods = useForm<ExpensesSearchValues>({
    defaultValues: defaultSearchValues,
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [rowCount, setRowCount] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState<ExpensesSearchValues>({
    ...defaultSearchValues,
  });

  const loadExpenses = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getExpenses({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: filters.q || undefined,
        category: filters.category || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      setExpenses(response.items);
      setRowCount(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải danh sách khoản chi.")
      );
    } finally {
      setLoading(false);
    }
  }, [filters, paginationModel]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const handleSearch: SubmitHandler<ExpensesSearchValues> = (values) => {
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
      category: values.category.trim(),
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
    if (!expenseToDelete) {
      return;
    }

    setActionLoading(true);

    try {
      await deleteExpense(expenseToDelete.id);

      setExpenseToDelete(null);
      toast.success("Đã xóa khoản chi thành công.");

      await loadExpenses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa khoản chi."));
    } finally {
      setActionLoading(false);
    }
  };

  const activeFilterCount = useMemo(
    () =>
      [filters.q, filters.category, filters.fromDate, filters.toDate].filter(
        Boolean
      ).length,
    [filters]
  );

  const columns = useMemo<GridColDef<Expense>[]>(
    () => [
      {
        field: "expenseDate",
        headerName: "Ngày chi",
        width: 120,
        sortable: false,
        renderCell: ({ row }) => formatDateVi(row.expenseDate),
      },
      {
        field: "content",
        headerName: "Nội dung chi",
        minWidth: 230,
        flex: 1.2,
        sortable: false,
      },
      {
        field: "category",
        headerName: "Nhóm chi phí",
        minWidth: 160,
        flex: 0.7,
        sortable: false,
        renderCell: ({ row }) =>
          row.category ? (
            <Chip label={row.category} size="small" variant="outlined" />
          ) : (
            "—"
          ),
      },
      {
        field: "amount",
        headerName: "Số tiền",
        width: 150,
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
            {formatVnd(row.amount)}
          </Typography>
        ),
      },
      {
        field: "note",
        headerName: "Ghi chú",
        minWidth: 200,
        flex: 1,
        sortable: false,
        renderCell: ({ row }) => row.note || "—",
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setExpenseToDelete(row)}
          >
            Xóa
          </Button>
        ),
      },
    ],
    []
  );

  const searchContent = (
    <>
      <HInput<ExpensesSearchValues>
        name="q"
        label="Nội dung khoản chi"
        placeholder="Nhập từ khóa"
      />

      <HDropdown<ExpensesSearchValues>
        name="category"
        label="Nhóm chi phí"
        placeholder="Tất cả nhóm chi phí"
        options={expenseCategoryOptions}
      />

      <HDatePicker<ExpensesSearchValues> name="fromDate" label="Từ ngày" />

      <HDatePicker<ExpensesSearchValues> name="toDate" label="Đến ngày" />
    </>
  );

  const pageActions = (
    <>
      <ExportExcelDialog fullWidth={isMobile} />

      <Button
        component={Link}
        href="/expenses/create"
        variant="contained"
        color="error"
        fullWidth={isMobile}
        sx={{
          minHeight: 44,
          whiteSpace: "nowrap",
        }}
      >
        Tạo khoản chi
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
            <HMobileList<ExpensesSearchValues>
              title="Quản lý khoản chi"
              description="Theo dõi các khoản chi phí phát sinh."
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
                void loadExpenses();
              }}
              onPageChange={(page) => {
                setPaginationModel((current) => ({
                  ...current,
                  page,
                }));
              }}
            >
              {expenses.length === 0 ? (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" align="center">
                      Chưa có khoản chi phù hợp.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {expenses.map((expense) => (
                    <Card
                      key={expense.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        borderLeft: "4px solid",
                        borderLeftColor: "error.main",
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
                                  fontSize: 16,
                                  lineHeight: 1.45,
                                }}
                              >
                                {expense.content}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDateVi(expense.expenseDate)}
                              </Typography>
                            </Box>

                            {expense.category && (
                              <Chip
                                label={expense.category}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>

                          <Divider />

                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Số tiền chi
                            </Typography>

                            <Typography
                              variant="h6"
                              sx={{
                                mt: 0.25,
                                fontWeight: 900,
                                color: "error.main",
                              }}
                            >
                              {formatVnd(expense.amount)}
                            </Typography>
                          </Box>

                          {expense.note && (
                            <Typography variant="body2" color="text.secondary">
                              Ghi chú: {expense.note}
                            </Typography>
                          )}

                          <Button
                            type="button"
                            variant="outlined"
                            color="error"
                            fullWidth
                            onClick={() => setExpenseToDelete(expense)}
                            sx={{
                              minHeight: 44,
                            }}
                          >
                            Xóa khoản chi
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </HMobileList>
          ) : (
            <HDataTable<Expense, ExpensesSearchValues>
              title="Quản lý khoản chi"
              description="Theo dõi các khoản chi phí phát sinh."
              rows={expenses}
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
                void loadExpenses();
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
        open={Boolean(expenseToDelete)}
        title="Xóa khoản chi"
        description={
          <>
            Bạn có chắc muốn xóa khoản chi{" "}
            <strong>{expenseToDelete?.content}</strong> với số tiền{" "}
            <strong>{formatVnd(expenseToDelete?.amount)}</strong>?
          </>
        }
        confirmText="Xóa"
        confirmColor="error"
        loading={actionLoading}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </Box>
  );
}
