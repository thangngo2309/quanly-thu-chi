"use client";
import { Alert, Snackbar, type AlertColor } from "@mui/material";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
type ToastOptions = { duration?: number };
type ToastItem = {
  id: number;
  message: string;
  severity: AlertColor;
  duration: number;
};
type ToastContextValue = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};
type ToastProviderProps = { children: ReactNode };
const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION = 4000;
export function ToastProvider({ children }: ToastProviderProps) {
  const idRef = useRef(0);
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const [open, setOpen] = useState(false);
  const processQueue = useCallback(
    (nextQueue: ToastItem[]) => {
      if (currentToast || nextQueue.length === 0) {
        return;
      }
      const [nextToast, ...remaining] = nextQueue;
      setCurrentToast(nextToast);
      setQueue(remaining);
      setOpen(true);
    },
    [currentToast]
  );
  const enqueueToast = useCallback(
    (severity: AlertColor, message: string, options?: ToastOptions) => {
      const normalizedMessage = message.trim();
      if (!normalizedMessage) {
        return;
      }
      idRef.current += 1;
      const newToast: ToastItem = {
        id: idRef.current,
        message: normalizedMessage,
        severity,
        duration: options?.duration ?? DEFAULT_DURATION,
      };
      if (!currentToast) {
        setCurrentToast(newToast);
        setOpen(true);
        return;
      }
      setQueue((previous) => [...previous, newToast]);
    },
    [currentToast]
  );
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ): void => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };
  const handleExited = (): void => {
    setCurrentToast(null);
    if (queue.length > 0) {
      const [nextToast, ...remaining] = queue;
      setQueue(remaining);
      setCurrentToast(nextToast);
      setOpen(true);
    }
  };
  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message, options) => {
        enqueueToast("success", message, options);
      },
      error: (message, options) => {
        enqueueToast("error", message, options);
      },
      warning: (message, options) => {
        enqueueToast("warning", message, options);
      },
      info: (message, options) => {
        enqueueToast("info", message, options);
      },
    }),
    [enqueueToast]
  );
  return (
    <ToastContext.Provider value={value}>
      {" "}
      {children}{" "}
      <Snackbar
        key={currentToast?.id ?? 0}
        open={open}
        autoHideDuration={currentToast?.duration ?? DEFAULT_DURATION}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{
          transition: {
            onExited: handleExited,
          },
        }}
        sx={{
          top: {
            xs: 12,
            sm: 20,
          },

          width: {
            xs: "calc(100% - 24px)",
            sm: "auto",
          },

          maxWidth: {
            xs: "calc(100% - 24px)",
            sm: 520,
          },

          zIndex: (theme) => theme.zIndex.modal + 100,
        }}
        children={
          <Alert
            severity={currentToast?.severity ?? "info"}
            variant="filled"
            onClose={handleClose}
            elevation={8}
            sx={{
              width: "100%",

              minWidth: {
                sm: 360,
              },

              borderRadius: 2.5,
              alignItems: "center",

              "& .MuiAlert-message": {
                fontSize: {
                  xs: 14,
                  sm: 15,
                },

                fontWeight: 600,
                lineHeight: 1.45,
              },
            }}
          >
            {currentToast?.message ?? ""}
          </Alert>
        }
      />
    </ToastContext.Provider>
  );
}
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider");
  }
  return context;
}
