"use client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { viVN as coreViVN } from "@mui/material/locale";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import "dayjs/locale/vi";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast/ToastProvider";
const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: { main: "#2563eb" },
      background: { default: "#f5f7fb", paper: "#ffffff" },
    },
    shape: { borderRadius: 10 },
    typography: { fontFamily: "Arial, Helvetica, sans-serif" },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { minHeight: "100%" },
          body: { minHeight: "100%", margin: 0 },
          "*": { boxSizing: "border-box" },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 8,
          },
        },
      },
    },
  },
  coreViVN
);
type ProvidersProps = { children: ReactNode };
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      {" "}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
        {" "}
        <CssBaseline /> <ToastProvider> {children} </ToastProvider>{" "}
      </LocalizationProvider>{" "}
    </ThemeProvider>
  );
}
