"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import {
  type SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

import { createSale } from "@/api/sales.api";
import { HDatePicker, HForm, HInput, HRadio } from "@/components/form";
import { HCustomerAutocomplete } from "@/components/form/HCustomerAutocomplete";
import { useToast } from "@/components/toast/ToastProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatVnd } from "@/utils/currency";

import type { SaleFormValues } from "../types/sale.types";

type SaleItemFormValue = {
  itemName: string;
  amount: string;
};

type SaleCreateFormValues = Omit<SaleFormValues, "content" | "totalAmount"> & {
  items: SaleItemFormValue[];
};

const createEmptyItem = (): SaleItemFormValue => ({
  itemName: "",
  amount: "",
});

const createDefaultValues = (): SaleCreateFormValues => ({
  customerName: "",
  paymentStatus: "UNPAID",
  saleDate: "",
  deliveryAt: "",
  note: "",

  items: [createEmptyItem()],
});

const parseAmount = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalizedValue = String(value).replace(/[^\d]/g, "");

  if (!normalizedValue) {
    return 0;
  }

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const calculateTotalAmount = (items: SaleItemFormValue[]): number =>
  items.reduce((total, item) => total + parseAmount(item.amount), 0);

const buildContent = (items: SaleItemFormValue[]): string =>
  items
    .map((item) => ({
      itemName: item.itemName.trim(),

      amount: parseAmount(item.amount),
    }))
    .filter((item) => item.itemName.length > 0 && item.amount > 0)
    .map(
      (item, index) =>
        `${index + 1}. ${item.itemName}: ${formatVnd(item.amount)}`
    )
    .join("; ");

export function SaleCreateForm() {
  const toast = useToast();

  const methods = useForm<SaleCreateFormValues>({
    defaultValues: createDefaultValues(),

    mode: "onBlur",
  });

  const {
    control,
    reset,
    setValue,

    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    setValue("saleDate", dayjs().format("YYYY-MM-DD"));
  }, [setValue]);

  const items =
    useWatch({
      control,
      name: "items",
    }) ?? [];

  const paymentStatus = useWatch({
    control,
    name: "paymentStatus",
  });

  const totalAmount = useMemo(() => calculateTotalAmount(items), [items]);

  const contentPreview = useMemo(() => buildContent(items), [items]);

  const paidAmount = paymentStatus === "PAID" ? totalAmount : 0;

  const remainingAmount = totalAmount - paidAmount;

  const handleAddItem = (): void => {
    append(createEmptyItem());
  };

  const handleRemoveItem = (index: number): void => {
    if (fields.length <= 1) {
      return;
    }

    remove(index);
  };

  const handleReset = (): void => {
    reset({
      ...createDefaultValues(),

      saleDate: dayjs().format("YYYY-MM-DD"),
    });
  };

  const onSubmit: SubmitHandler<SaleCreateFormValues> = async (values) => {
    const normalizedItems = values.items
      .map((item) => ({
        itemName: item.itemName.trim(),

        amount: parseAmount(item.amount),
      }))
      .filter((item) => item.itemName.length > 0 && item.amount > 0);

    if (normalizedItems.length === 0) {
      toast.warning("Vui lòng nhập ít nhất một món hàng.");

      return;
    }

    const normalizedTotalAmount = normalizedItems.reduce(
      (total, item) => total + item.amount,
      0
    );

    const normalizedContent = normalizedItems
      .map(
        (item, index) =>
          `${index + 1}. ${item.itemName}: ${formatVnd(item.amount)}`
      )
      .join("; ");

    try {
      const sale = await createSale({
        customerName: values.customerName.trim(),

        content: normalizedContent,

        totalAmount: normalizedTotalAmount,

        paidAmount: values.paymentStatus === "PAID" ? normalizedTotalAmount : 0,

        saleDate: values.saleDate,

        deliveryAt: values.deliveryAt || undefined,

        note: values.note.trim() || undefined,
      });

      toast.success(`Đã tạo khoản thu của ${sale.customerName} thành công.`);

      handleReset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu khoản thu."));
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
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
        <Stack spacing={0.75}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
            }}
          >
            Nhập khoản thu
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ghi nhận doanh thu bán hàng và trạng thái thanh toán của khách.
          </Typography>
        </Stack>
      </CardContent>

      <Divider />

      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <HForm methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3}>
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
              <HCustomerAutocomplete<SaleCreateFormValues>
                name="customerName"
                freeSolo
                label="Tên khách hàng"
                placeholder="Nhập tên mới hoặc chọn khách hàng đã có"
                rules={{
                  required: "Vui lòng nhập tên khách hàng",

                  validate: (value) =>
                    (value as string).trim().length > 0 || "Vui lòng nhập tên khách hàng",
                }}
              />

              <HDatePicker<SaleCreateFormValues>
                name="saleDate"
                label="Ngày phát sinh"
                rules={{
                  required: "Vui lòng chọn ngày phát sinh",
                }}
              />
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: 1.5,
                  md: 2,
                },

                borderRadius: 2.5,
                backgroundColor: "grey.50",
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    Danh sách món hàng
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.25,
                    }}
                  >
                    Nhập tên món hàng và giá tiền tương ứng. Tổng số tiền sẽ
                    được tự động tính.
                  </Typography>
                </Box>

                <Stack spacing={1.5}>
                  {fields.map((field, index) => (
                    <Paper
                      key={field.id}
                      variant="outlined"
                      sx={{
                        p: {
                          xs: 1.5,
                          md: 2,
                        },

                        borderRadius: 2,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",

                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                            }}
                          >
                            Món hàng {index + 1}
                          </Typography>

                          <Button
                            type="button"
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineOutlinedIcon />}
                            disabled={fields.length <= 1}
                            onClick={() => {
                              handleRemoveItem(index);
                            }}
                          >
                            Xóa
                          </Button>
                        </Stack>

                        <Box
                          sx={{
                            display: "grid",

                            gridTemplateColumns: {
                              xs: "1fr",

                              md: "minmax(0, 1fr) minmax(220px, 0.4fr)",
                            },

                            gap: 1.5,
                          }}
                        >
                          <HInput<SaleCreateFormValues>
                            name={`items.${index}.itemName` as const}
                            label="Tên món hàng"
                            placeholder="Ví dụ: Gà, bia, cà phê..."
                            rules={{
                              required: "Vui lòng nhập tên món hàng",

                              validate: (value) =>
                                (value as string).trim().length > 0 ||
                                "Vui lòng nhập tên món hàng",
                            }}
                          />

                          <HInput<SaleCreateFormValues>
                            name={`items.${index}.amount` as const}
                            label="Giá tiền"
                            placeholder="Nhập giá tiền"
                            type="number"
                            slotProps={{
                              htmlInput: {
                                min: 1,
                                step: 1000,
                                inputMode: "numeric",
                              },
                            }}
                            rules={{
                              required: "Vui lòng nhập giá tiền",

                              validate: {
                                validNumber: (value) =>
                                  Number.isFinite(Number(value)) ||
                                  "Số tiền không hợp lệ",

                                greaterThanZero: (value) =>
                                  Number(value) > 0 || "Số tiền phải lớn hơn 0",
                              },
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>

                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<AddOutlinedIcon />}
                  onClick={handleAddItem}
                  sx={{
                    minHeight: 46,
                    borderStyle: "dashed",
                  }}
                >
                  Thêm món hàng
                </Button>

                {contentPreview && (
                  <Alert severity="info" icon={false}>
                    <Typography variant="caption" color="text.secondary">
                      Nội dung sẽ lưu:
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        fontWeight: 600,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {contentPreview}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Paper>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",

                  md: "repeat(2, minmax(0, 1fr))",
                },

                gap: 2,
                alignItems: "start",
              }}
            >
              <TextField
                label="Tổng số tiền"
                value={formatVnd(totalAmount)}
                disabled
                fullWidth
                helperText="Tự động cộng từ danh sách món hàng"
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                  },
                }}
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "text.primary",

                    fontWeight: 800,
                  },
                }}
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "grey.50",
                }}
              >
                <HRadio<SaleCreateFormValues>
                  name="paymentStatus"
                  label="Trạng thái thanh toán"
                  row
                  options={[
                    {
                      label: "Chưa thanh toán",

                      value: "UNPAID",
                    },
                    {
                      label: "Đã thanh toán",

                      value: "PAID",
                    },
                  ]}
                  rules={{
                    required: "Vui lòng chọn trạng thái thanh toán",
                  }}
                />
              </Paper>
            </Box>

            <HDatePicker<SaleCreateFormValues>
              name="deliveryAt"
              label="Ngày giờ giao hàng"
              mode="datetime"
              valueFormat="iso"
              minutesStep={5}
            />

            <HInput<SaleCreateFormValues>
              name="note"
              label="Ghi chú"
              placeholder="Thông tin bổ sung nếu có"
              multiline
              minRows={2}
              rules={{
                maxLength: {
                  value: 1000,

                  message: "Ghi chú không quá 1.000 ký tự",
                },
              }}
            />

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "primary.50",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontWeight: 800,
                }}
              >
                Thông tin ghi nhận
              </Typography>

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr",

                    sm: "repeat(3, minmax(0, 1fr))",
                  },

                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tổng doanh thu
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      fontWeight: 800,
                    }}
                  >
                    {formatVnd(totalAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Đã thu
                  </Typography>

                  <Typography
                    color="success.main"
                    sx={{
                      mt: 0.25,
                      fontWeight: 800,
                    }}
                  >
                    {formatVnd(paidAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Còn nợ
                  </Typography>

                  <Typography
                    color={remainingAmount > 0 ? "error.main" : "text.primary"}
                    sx={{
                      mt: 0.25,
                      fontWeight: 800,
                    }}
                  >
                    {formatVnd(remainingAmount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Stack
              direction={{
                xs: "column-reverse",

                sm: "row",
              }}
              spacing={1.5}
              sx={{
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={isSubmitting}
                onClick={handleReset}
                sx={{
                  minHeight: 44,
                  minWidth: 120,
                }}
              >
                Nhập lại
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || totalAmount <= 0}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveOutlinedIcon />
                  )
                }
                sx={{
                  minHeight: 44,
                  minWidth: 160,
                }}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu khoản thu"}
              </Button>
            </Stack>
          </Stack>
        </HForm>
      </CardContent>
    </Card>
  );
}
