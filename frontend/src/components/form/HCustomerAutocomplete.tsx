"use client";

import { getCustomerSuggestions } from "@/api/sales.api";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Controller,
  type ControllerProps,
  type FieldValues,
  type Path,
  useFormContext,
} from "react-hook-form";

type HCustomerAutocompleteProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  freeSolo?: boolean;

  rules?: ControllerProps<TFieldValues, Path<TFieldValues>>["rules"];
};

export function HCustomerAutocomplete<TFieldValues extends FieldValues>({
  name,
  label = "Tên khách hàng",
  placeholder = "Nhập hoặc chọn khách hàng",
  disabled = false,
  freeSolo = true,
  rules,
}: HCustomerAutocompleteProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const result = await getCustomerSuggestions(searchText);

        if (active) {
          setOptions(result);
        }
      } catch {
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;

      window.clearTimeout(timeoutId);
    };
  }, [open, searchText]);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const fieldValue = typeof field.value === "string" ? field.value : "";

        return (
          <Autocomplete<string, false, false, boolean>
            freeSolo={freeSolo}
            open={open}
            disabled={disabled}
            loading={loading}
            options={options}
            value={fieldValue || null}
            inputValue={fieldValue}
            openOnFocus
            autoHighlight
            selectOnFocus
            clearOnBlur={false}
            forcePopupIcon
            filterOptions={(items) => items}
            onOpen={() => {
              setSearchText(fieldValue);

              setOpen(true);
            }}
            onClose={() => {
              setOpen(false);
            }}
            onChange={(_, newValue) => {
              field.onChange(newValue ?? "");
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === "reset") {
                return;
              }

              field.onChange(newInputValue);

              setSearchText(newInputValue);
            }}
            onBlur={field.onBlur}
            isOptionEqualToValue={(option, value) =>
              option.trim().toLocaleLowerCase("vi-VN") ===
              value.trim().toLocaleLowerCase("vi-VN")
            }
            noOptionsText={
              searchText.trim()
                ? "Không tìm thấy. Bạn vẫn có thể sử dụng tên đang nhập."
                : "Chưa có khách hàng trong hệ thống"
            }
            loadingText="Đang tìm khách hàng..."
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  borderRadius: 2.5,
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
                },
              },

              listbox: {
                sx: {
                  maxHeight: 300,

                  "& .MuiAutocomplete-option": {
                    minHeight: 48,
                    px: 2,
                    fontSize: 15,
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={field.ref}
                label={label}
                placeholder={placeholder}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        );
      }}
    />
  );
}
