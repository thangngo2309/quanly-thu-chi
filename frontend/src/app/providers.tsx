'use client';

import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { viVN as coreViVN } from '@mui/material/locale';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import 'dayjs/locale/vi';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

const theme = createTheme(
  {
    palette: {
      mode: 'light',

      primary: {
        main: '#2563eb',
      },

      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
    },

    shape: {
      borderRadius: 10,
    },

    typography: {
      fontFamily: 'Arial, Helvetica, sans-serif',
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 8,
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
    },
  },
  coreViVN,
);

export function Providers({
  children,
}: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="vi"
      >
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}