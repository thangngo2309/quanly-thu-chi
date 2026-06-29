"use client";

import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import type { ReactNode } from "react";
import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from "react-hook-form";

type HDatePickerMode = "date" | "datetime";

type HDatePickerValueFormat =
  | "date"
  | "datetime"
  | "iso"
  | "dayjs"
  | "native-date";

type HDatePickerProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;

  label?: ReactNode;

  mode?: HDatePickerMode;

  valueFormat?: HDatePickerValueFormat;

  format?: string;

  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;

  helperText?: ReactNode;

  required?: boolean;

  disabled?: boolean;

  fullWidth?: boolean;

  disablePast?: boolean;

  disableFuture?: boolean;

  minDate?: Dayjs;

  maxDate?: Dayjs;

  minutesStep?: number;

  size?: "small" | "medium";

  compact?: boolean;

  /**
   * Chỉ nhận object style để tránh lỗi
   * mảng lồng của SxProps.
   */
  sx?: SystemStyleObject<Theme>;
};

const compactTextFieldSx: SystemStyleObject<Theme> = {
  "& .MuiInputBase-root": {
    minHeight: 44,
    borderRadius: 2,
  },

  "& .MuiOutlinedInput-input": {
    minHeight: 44,
    boxSizing: "border-box",
    paddingTop: 0,
    paddingBottom: 0,
  },

  "& .MuiInputLabel-root": {
    fontSize: 14,
  },

  "& .MuiInputAdornment-root": {
    maxHeight: 44,
  },

  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0.5,
    fontSize: 12,
    lineHeight: 1.35,
  },
};

function parsePickerValue(value: unknown): Dayjs | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value : null;
  }

  if (value instanceof Date) {
    const parsed = dayjs(value);

    return parsed.isValid() ? parsed : null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = dayjs(value);

    return parsed.isValid() ? parsed : null;
  }

  return null;
}

function resolveOutputValue(
  value: Dayjs | null,
  valueFormat: HDatePickerValueFormat
): unknown {
  if (!value || !value.isValid()) {
    return "";
  }

  switch (valueFormat) {
    case "dayjs":
      return value;

    case "native-date":
      return value.toDate();

    case "iso":
      return value.toISOString();

    case "datetime":
      return value.format("YYYY-MM-DDTHH:mm:ss");

    case "date":
    default:
      return value.format("YYYY-MM-DD");
  }
}

function hasRequiredRule(requiredRule: unknown): boolean {
  if (!requiredRule) {
    return false;
  }

  if (
    typeof requiredRule === "object" &&
    requiredRule !== null &&
    "value" in requiredRule
  ) {
    return Boolean(
      (
        requiredRule as {
          value?: unknown;
        }
      ).value
    );
  }

  return true;
}

export function HDatePicker<TFieldValues extends FieldValues>({
  name,
  label,
  mode = "date",
  valueFormat,
  format,
  rules,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  disablePast = false,
  disableFuture = false,
  minDate,
  maxDate,
  minutesStep = 5,
  size = "small",
  compact = true,
  sx,
}: HDatePickerProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  const resolvedRequired = required || hasRequiredRule(rules?.required);

  const resolvedDisplayFormat =
    format ?? (mode === "datetime" ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY");

  const resolvedValueFormat: HDatePickerValueFormat =
    valueFormat ?? (mode === "datetime" ? "iso" : "date");

  /**
   * Không dùng mảng SxProps.
   * Chỉ gộp hai object style.
   */
  const resolvedTextFieldSx: SystemStyleObject<Theme> = {
    ...(compact ? compactTextFieldSx : {}),

    ...(sx ?? {}),
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const pickerValue = parsePickerValue(field.value);

        const error = Boolean(fieldState.error);

        const resolvedHelperText = fieldState.error?.message ?? helperText;

        if (mode === "datetime") {
          return (
            <DateTimePicker
              label={label}
              value={pickerValue}
              disabled={disabled}
              format={resolvedDisplayFormat}
              ampm={false}
              minutesStep={minutesStep}
              disablePast={disablePast}
              disableFuture={disableFuture}
              minDate={minDate}
              maxDate={maxDate}
              onChange={(nextValue) => {
                field.onChange(
                  resolveOutputValue(nextValue, resolvedValueFormat)
                );
              }}
              onAccept={() => {
                field.onBlur();
              }}
              onClose={() => {
                field.onBlur();
              }}
              slotProps={{
                textField: {
                  fullWidth,
                  required: resolvedRequired,
                  error,
                  helperText: resolvedHelperText,
                  size,
                  sx: resolvedTextFieldSx,
                },
              }}
            />
          );
        }

        return (
          <DatePicker
            label={label}
            value={pickerValue}
            disabled={disabled}
            format={resolvedDisplayFormat}
            disablePast={disablePast}
            disableFuture={disableFuture}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(nextValue) => {
              field.onChange(
                resolveOutputValue(nextValue, resolvedValueFormat)
              );
            }}
            onAccept={() => {
              field.onBlur();
            }}
            onClose={() => {
              field.onBlur();
            }}
            slotProps={{
              textField: {
                fullWidth,
                required: resolvedRequired,
                error,
                helperText: resolvedHelperText,
                size,
                sx: resolvedTextFieldSx,
              },
            }}
          />
        );
      }}
    />
  );
}
