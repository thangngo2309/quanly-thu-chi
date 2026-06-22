"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { HDatePicker, HForm } from "@/components/form";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import { formatDateVi } from "@/utils/date";

import type {
  DashboardFilterValues,
  DashboardSummary,
} from "../types/dashboard.types";
import { getDashboardSummary } from "@/api/dashboard.api";
import { ExportExcelDialog } from "@/features/reports/components/ExportExcelDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardDateFilter } from "./DashboardDateFilter";

const emptySummary: DashboardSummary = {
  fromDate: null,
  toDate: null,

  totalRevenue: 0,
  totalCollected: 0,
  totalDebt: 0,
  totalExpenses: 0,

  estimatedProfit: 0,
  cashBalance: 0,

  totalSales: 0,
  totalExpenseItems: 0,
};

const defaultFilterValues: DashboardFilterValues = {
  fromDate: "",
  toDate: "",
};

type SummaryCardProps = {
  title: string;
  value: number;
  description?: string;
  color?: string;
  backgroundColor?: string;
};

function SummaryCard({
  title,
  value,
  description,
  color = "text.primary",
  backgroundColor = "background.paper",
}: SummaryCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        backgroundColor,
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            sm: 2.5,
          },

          "&:last-child": {
            pb: {
              xs: 2,
              sm: 2.5,
            },
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            fontWeight: 900,
            fontSize: {
              xs: 19,
              sm: 24,
            },
            lineHeight: 1.25,
            color,
            overflowWrap: "anywhere",
          }}
        >
          {formatVnd(value)}
        </Typography>

        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mt: 1,
              lineHeight: 1.45,
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

type ProgressSummaryProps = {
  label: string;
  value: number;
  displayValue: string;
  color: "primary" | "success" | "warning" | "error";
};

function ProgressSummary({
  label,
  value,
  displayValue,
  color,
}: ProgressSummaryProps) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.75,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
          }}
        >
          {displayValue}
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(Math.max(value, 0), 100)}
        color={color}
        sx={{
          height: 9,
          borderRadius: 999,

          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
          },
        }}
      />
    </Box>
  );
}

function getPercentage(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return (value / total) * 100;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  })}%`;
}

export function DashboardOverview() {
  const methods = useForm<DashboardFilterValues>({
    defaultValues: defaultFilterValues,
  });

  const { setValue, reset, setError, clearErrors, getValues } = methods;

  const defaultFilters: DashboardFilterValues = {
    fromDate: "",
    toDate: "",
  };

  const [filters, setFilters] = useState<DashboardFilterValues>({
    ...defaultFilters,
  });

  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await getDashboardSummary({
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      setSummary(result);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải dữ liệu tổng quát.")
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const selectedDateLabel = useMemo(() => {
    if (!filters.fromDate && !filters.toDate) {
      return "Toàn bộ thời gian";
    }

    if (filters.fromDate && filters.toDate) {
      return `${formatDateVi(filters.fromDate)} - ${formatDateVi(
        filters.toDate
      )}`;
    }

    if (filters.fromDate) {
      return `Từ ${formatDateVi(filters.fromDate)}`;
    }

    return `Đến ${formatDateVi(filters.toDate)}`;
  }, [filters]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const collectionRate = useMemo(
    () => getPercentage(summary.totalCollected, summary.totalRevenue),
    [summary.totalCollected, summary.totalRevenue]
  );

  const debtRate = useMemo(
    () => getPercentage(summary.totalDebt, summary.totalRevenue),
    [summary.totalDebt, summary.totalRevenue]
  );

  const expenseRate = useMemo(
    () => getPercentage(summary.totalExpenses, summary.totalRevenue),
    [summary.totalExpenses, summary.totalRevenue]
  );

  const dateRangeLabel = useMemo(() => {
    if (!filters.fromDate && !filters.toDate) {
      return "Toàn bộ thời gian";
    }

    if (filters.fromDate && filters.toDate) {
      return `${formatDateVi(filters.fromDate)} - ${formatDateVi(
        filters.toDate
      )}`;
    }

    if (filters.fromDate) {
      return `Từ ${formatDateVi(filters.fromDate)}`;
    }

    return `Đến ${formatDateVi(filters.toDate)}`;
  }, [filters]);

  const applyDateRange = (fromDate: string, toDate: string): void => {
    clearErrors();

    setValue("fromDate", fromDate);
    setValue("toDate", toDate);

    setFilters({
      fromDate,
      toDate,
    });
  };

  const handleToday = (): void => {
    const today = dayjs().format("YYYY-MM-DD");

    applyDateRange(today, today);
  };

  const handleCurrentMonth = (): void => {
    applyDateRange(
      dayjs().startOf("month").format("YYYY-MM-DD"),

      dayjs().endOf("month").format("YYYY-MM-DD")
    );
  };

  const handleCurrentYear = (): void => {
    applyDateRange(
      dayjs().startOf("year").format("YYYY-MM-DD"),

      dayjs().endOf("year").format("YYYY-MM-DD")
    );
  };

  const handleAllTime = (): void => {
    reset({
      ...defaultFilterValues,
    });

    setFilters({
      ...defaultFilterValues,
    });
  };

  const handleSubmit: SubmitHandler<DashboardFilterValues> = (values) => {
    clearErrors();

    if (
      values.fromDate &&
      values.toDate &&
      dayjs(values.fromDate).isAfter(dayjs(values.toDate), "day")
    ) {
      setError("toDate", {
        type: "validate",
        message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
      });

      return;
    }

    setFilters({
      fromDate: values.fromDate,
      toDate: values.toDate,
    });
  };

  const handleRefresh = (): void => {
    const values = getValues();

    setFilters({
      fromDate: values.fromDate,
      toDate: values.toDate,
    });

    void loadSummary();
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 64px)",

        py: {
          xs: 2,
          sm: 3,
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
        <Stack spacing={2.5}>
          <PageHeader
            title="Tổng quát"
            description="Theo dõi doanh thu, công nợ, chi phí và lợi nhuận."
          />
          <DashboardDateFilter
            loading={loading}
            value={filters}
            onApply={(values) => {
              setFilters(values);
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
            
            Dữ liệu đang hiển thị:
            <Box
              component="span"
              sx={{ fontWeight: 800, color: "text.primary" }}
            >
              
              {selectedDateLabel}
            </Box>
          </Typography>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
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
                <SummaryCard
                  title="Lợi nhuận tạm tính"
                  value={summary.estimatedProfit}
                  color={
                    summary.estimatedProfit >= 0 ? "success.main" : "error.main"
                  }
                  backgroundColor={
                    summary.estimatedProfit >= 0
                      ? "rgba(46, 125, 50, 0.05)"
                      : "rgba(211, 47, 47, 0.05)"
                  }
                  description="Tổng doanh thu trừ tổng chi phí, bao gồm cả phần khách còn nợ."
                />

                <SummaryCard
                  title="Dòng tiền thực tế"
                  value={summary.cashBalance}
                  color={
                    summary.cashBalance >= 0 ? "primary.main" : "error.main"
                  }
                  backgroundColor={
                    summary.cashBalance >= 0
                      ? "rgba(37, 99, 235, 0.05)"
                      : "rgba(211, 47, 47, 0.05)"
                  }
                  description="Tiền đã thu thực tế trừ tổng chi phí."
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: {
                    xs: 1.25,
                    sm: 2,
                  },
                }}
              >
                <SummaryCard
                  title="Tổng doanh thu"
                  value={summary.totalRevenue}
                />

                <SummaryCard
                  title="Đã thu"
                  value={summary.totalCollected}
                  color="success.main"
                />

                <SummaryCard
                  title="Công nợ"
                  value={summary.totalDebt}
                  color="warning.main"
                />

                <SummaryCard
                  title="Tổng chi phí"
                  value={summary.totalExpenses}
                  color="error.main"
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
                  },
                  gap: 2,
                }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
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
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                      }}
                    >
                      Tỷ lệ tài chính
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        mb: 3,
                      }}
                    >
                      So sánh với tổng doanh thu trong khoảng thời gian đang
                      chọn.
                    </Typography>

                    <Stack spacing={3}>
                      <ProgressSummary
                        label="Tỷ lệ đã thu"
                        value={collectionRate}
                        displayValue={formatPercent(collectionRate)}
                        color="success"
                      />

                      <ProgressSummary
                        label="Tỷ lệ công nợ"
                        value={debtRate}
                        displayValue={formatPercent(debtRate)}
                        color="warning"
                      />

                      <ProgressSummary
                        label="Chi phí trên doanh thu"
                        value={expenseRate}
                        displayValue={formatPercent(expenseRate)}
                        color={expenseRate > 100 ? "error" : "primary"}
                      />
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
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
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                      }}
                    >
                      Số lượng phát sinh
                    </Typography>

                    <Stack
                      spacing={2}
                      sx={{
                        mt: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số khoản thu
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.25,
                            fontWeight: 900,
                            fontSize: 28,
                            color: "primary.main",
                          }}
                        >
                          {summary.totalSales}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số khoản chi
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.25,
                            fontWeight: 900,
                            fontSize: 28,
                            color: "error.main",
                          }}
                        >
                          {summary.totalExpenseItems}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
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
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                    }}
                  >
                    Thao tác nhanh
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      mb: 2,
                    }}
                  >
                    Thêm dữ liệu mới hoặc xem danh sách chi tiết.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        lg: "repeat(4, minmax(0, 1fr))",
                      },
                      gap: 1.25,
                    }}
                  >
                    <Link
                      href="/"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          minHeight: 46,
                        }}
                      >
                        Tạo khoản thu
                      </Button>
                    </Link>

                    <Link
                      href="/expenses/create"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        sx={{
                          minHeight: 46,
                        }}
                      >
                        Tạo khoản chi
                      </Button>
                    </Link>

                    <Link
                      href="/sales"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          minHeight: 46,
                        }}
                      >
                        Quản lý khoản thu
                      </Button>
                    </Link>

                    <Link
                      href="/expenses"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        sx={{
                          minHeight: 46,
                        }}
                      >
                        Quản lý khoản chi
                      </Button>
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function DashboardSkeleton() {
  return (
    <Stack spacing={2}>
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
        {[1, 2].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={160}
            sx={{
              borderRadius: 3,
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={130}
            sx={{
              borderRadius: 3,
            }}
          />
        ))}
      </Box>

      <Skeleton
        variant="rounded"
        height={320}
        sx={{
          borderRadius: 3,
        }}
      />
    </Stack>
  );
}
