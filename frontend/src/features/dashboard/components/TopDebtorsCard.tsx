"use client";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";
import type { DashboardTopDebtor } from "../types/dashboard.types";
import { createPublicDebtLink } from "@/api/public-debts.api";
type TopDebtorsCardProps = { items: DashboardTopDebtor[] };
const normalizeBasePath = (value: string): string => {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `/${normalized}` : "";
};
export function TopDebtorsCard({ items }: TopDebtorsCardProps) {
  const toast = useToast();
  const [openingCustomerName, setOpeningCustomerName] = useState<string | null>(
    null
  );
  const handleOpenCustomerPage = async (
    customerName: string
  ): Promise<void> => {
    const normalizedCustomerName = customerName.trim();
    if (!normalizedCustomerName) {
      toast.warning("Không xác định được tên khách hàng.");
      return;
    }
    /* * Mở tab trước khi gọi API để Safari * trên iPhone không chặn popup. */ const popup =
      window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }
    setOpeningCustomerName(normalizedCustomerName);
    try {
      const result = await createPublicDebtLink({
        customerName: normalizedCustomerName,
      });
      const basePath = normalizeBasePath(
        process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      );
      const publicUrl = new URL(
        `${basePath}/public/debts`,
        window.location.origin
      );
      publicUrl.searchParams.set("customerName", result.customerName);
      publicUrl.searchParams.set("token", result.token);
      if (popup) {
        popup.location.replace(publicUrl.toString());
      } else {
        window.location.assign(publicUrl.toString());
      }
    } catch (error) {
      popup?.close();
      toast.error(
        getApiErrorMessage(error, "Không thể mở trang công nợ của khách hàng.")
      );
    } finally {
      setOpeningCustomerName(null);
    }
  };
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            {" "}
            <Box>
              {" "}
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, fontSize: { xs: 19, sm: 21 } }}
              >
                {" "}
                Top 10 khách hàng có công nợ cao nhất{" "}
              </Typography>{" "}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {" "}
                Tổng hợp theo khoảng thời gian đang được chọn.{" "}
              </Typography>{" "}
            </Box>{" "}
            <Button
              component={Link}
              href="/debts"
              variant="outlined"
              sx={{ minHeight: 42, whiteSpace: "nowrap" }}
            >
              {" "}
              Quản lý công nợ{" "}
            </Button>{" "}
          </Stack>{" "}
          <Divider />{" "}
          {items.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              {" "}
              Không có khách hàng đang nợ trong khoảng thời gian này.{" "}
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {" "}
              {items.map((item) => {
                const isOpening = openingCustomerName === item.customerName;
                return (
                  <Box
                    key={`${item.rank}-${item.customerName}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "44px minmax(0, 1fr)",
                        md: "44px minmax(0, 1fr) minmax(150px, auto) 180px",
                      },
                      gap: { xs: 1, md: 1.5 },
                      alignItems: "center",
                      py: 1.5,
                    }}
                  >
                    {" "}
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        fontSize: 15,
                        fontWeight: 900,
                        color:
                          item.rank <= 3
                            ? "warning.contrastText"
                            : "primary.main",
                        backgroundColor:
                          item.rank <= 3 ? "warning.main" : "action.selected",
                      }}
                    >
                      {" "}
                      {item.rank}{" "}
                    </Avatar>{" "}
                    <Box sx={{ minWidth: 0 }}>
                      {" "}
                      <Typography
                        sx={{
                          fontWeight: 900,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {" "}
                        {item.customerName}{" "}
                      </Typography>{" "}
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          mt: 0.5,
                          alignItems: "center",
                          flexWrap: "wrap",
                          rowGap: 0.5,
                        }}
                      >
                        {" "}
                        <Chip
                          label={`${item.debtCount.toLocaleString(
                            "vi-VN"
                          )} khoản nợ`}
                          size="small"
                          variant="outlined"
                        />{" "}
                        <Typography variant="caption" color="text.secondary">
                          {" "}
                          Xếp hạng #{item.rank}{" "}
                        </Typography>{" "}
                      </Stack>{" "}
                      <Typography
                        sx={{
                          display: { xs: "block", md: "none" },
                          mt: 1,
                          color: "error.main",
                          fontWeight: 900,
                          fontSize: 16,
                        }}
                      >
                        {" "}
                        {formatVnd(item.totalDebt)}{" "}
                      </Typography>{" "}
                    </Box>{" "}
                    <Box
                      sx={{
                        display: { xs: "none", md: "block" },
                        textAlign: "right",
                      }}
                    >
                      {" "}
                      <Typography variant="caption" color="text.secondary">
                        {" "}
                        Tổng công nợ{" "}
                      </Typography>{" "}
                      <Typography
                        sx={{
                          mt: 0.25,
                          color: "error.main",
                          fontWeight: 900,
                          fontSize: 18,
                        }}
                      >
                        {" "}
                        {formatVnd(item.totalDebt)}{" "}
                      </Typography>{" "}
                    </Box>{" "}
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<OpenInNewOutlinedIcon />}
                      disabled={Boolean(openingCustomerName)}
                      onClick={() => {
                        void handleOpenCustomerPage(item.customerName);
                      }}
                      sx={{
                        minHeight: 42,
                        whiteSpace: "nowrap",
                        gridColumn: { xs: "1 / -1", md: "auto" },
                        width: { xs: "100%", md: 180 },
                        mt: { xs: 0.5, md: 0 },
                      }}
                    >
                      {" "}
                      {isOpening ? "Đang mở..." : "Trang của khách hàng"}{" "}
                    </Button>{" "}
                  </Box>
                );
              })}{" "}
            </Stack>
          )}{" "}
        </Stack>{" "}
      </CardContent>{" "}
    </Card>
  );
}
