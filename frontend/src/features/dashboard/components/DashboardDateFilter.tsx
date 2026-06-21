"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { type SubmitHandler, useForm } from "react-hook-form";
import { HDatePicker, HForm } from "@/components/form";
export type DashboardFilterValues = { fromDate: string; toDate: string };
type DashboardDateFilterProps = {
  loading?: boolean;
  value: DashboardFilterValues;
  onApply: (values: DashboardFilterValues) => void;
};
export function DashboardDateFilter({
  loading = false,
  value,
  onApply,
}: DashboardDateFilterProps) {
  const methods = useForm<DashboardFilterValues>({ defaultValues: value });
  const { reset, setValue, setError, clearErrors } = methods;
  const applyDateRange = (fromDate: string, toDate: string): void => {
    clearErrors();
    setValue("fromDate", fromDate);
    setValue("toDate", toDate);
    onApply({ fromDate, toDate });
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
    const emptyValues: DashboardFilterValues = { fromDate: "", toDate: "" };
    reset(emptyValues);
    clearErrors();
    onApply(emptyValues);
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
    onApply({ fromDate: values.fromDate, toDate: values.toDate });
  };
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      {" "}
      <CardContent
        sx={{
          p: { xs: 2, md: 2.5 },
          "&:last-child": { pb: { xs: 2, md: 2.5 } },
        }}
      >
        {" "}
        <Stack spacing={2}>
          {" "}
          <Box>
            {" "}
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, fontSize: { xs: 18, md: 20 } }}
            >
              {" "}
              Lọc báo cáo theo thời gian{" "}
            </Typography>{" "}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {" "}
              Chọn khoảng ngày để xem doanh thu, công nợ, chi phí và lợi nhuận.{" "}
            </Typography>{" "}
          </Box>{" "}
          <HForm methods={methods} onSubmit={handleSubmit}>
            {" "}
            <Stack spacing={1.5}>
              {" "}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "minmax(0, 1fr) minmax(0, 1fr) auto",
                  },
                  gap: 1.5,
                  alignItems: "start",
                }}
              >
                {" "}
                <HDatePicker<DashboardFilterValues>
                  name="fromDate"
                  label="Từ ngày"
                />{" "}
                <HDatePicker<DashboardFilterValues>
                  name="toDate"
                  label="Đến ngày"
                />{" "}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minHeight: 56, px: 3, whiteSpace: "nowrap" }}
                >
                  {" "}
                  {loading ? "Đang tải..." : "Xem báo cáo"}{" "}
                </Button>{" "}
              </Box>{" "}
            </Stack>{" "}
          </HForm>{" "}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(4, auto)",
              },
              gap: 1,
              justifyContent: { xs: "stretch", sm: "flex-start" },
            }}
          >
            {" "}
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={handleToday}
              sx={{ minHeight: 42 }}
            >
              {" "}
              Hôm nay{" "}
            </Button>{" "}
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={handleCurrentMonth}
              sx={{ minHeight: 42 }}
            >
              {" "}
              Tháng này{" "}
            </Button>{" "}
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={handleCurrentYear}
              sx={{ minHeight: 42 }}
            >
              {" "}
              Năm nay{" "}
            </Button>{" "}
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              disabled={loading}
              onClick={handleAllTime}
              sx={{ minHeight: 42 }}
            >
              {" "}
              Toàn bộ{" "}
            </Button>{" "}
          </Box>{" "}
        </Stack>{" "}
      </CardContent>{" "}
    </Card>
  );
}
