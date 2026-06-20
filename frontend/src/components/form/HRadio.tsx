'use client';

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  type SxProps,
  type Theme,
} from '@mui/material';
import type { ReactNode } from 'react';
import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from 'react-hook-form';

export type HRadioOption = {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
};

type HRadioProps<T extends FieldValues> = {
  name: Path<T>;
  label?: ReactNode;
  options: HRadioOption[];
  rules?: RegisterOptions<T, Path<T>>;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  row?: boolean;
  sx?: SxProps<Theme>;
};

function isRequiredRule(required: unknown): boolean {
  if (!required) {
    return false;
  }

  if (
    typeof required === 'object' &&
    required !== null &&
    'value' in required
  ) {
    return Boolean(
      (required as { value?: unknown }).value,
    );
  }

  return true;
}

export function HRadio<T extends FieldValues>({
  name,
  label,
  options,
  rules,
  helperText,
  required,
  disabled = false,
  row = false,
  sx,
}: HRadioProps<T>) {
  const { control } = useFormContext<T>();

  const isRequired =
    required || isRequiredRule(rules?.required);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl
          component="fieldset"
          required={isRequired}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          sx={sx}
        >
          {label && (
            <FormLabel
              component="legend"
              sx={{
                mb: 0.5,
                fontSize: 14,
                fontWeight: 600,
                color: 'text.primary',

                '&.Mui-focused': {
                  color: 'text.primary',
                },
              }}
            >
              {label}
            </FormLabel>
          )}

          <RadioGroup
            {...field}
            row={row}
            value={field.value ?? ''}
            onChange={(event) => {
              field.onChange(event.target.value);
            }}
          >
            {options.map((option) => (
              <FormControlLabel
                key={String(option.value)}
                value={option.value}
                disabled={option.disabled}
                control={<Radio size="small" />}
                label={option.label}
              />
            ))}
          </RadioGroup>

          {(fieldState.error?.message ||
            helperText) && (
            <FormHelperText sx={{ mx: 0 }}>
              {fieldState.error?.message ||
                helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}