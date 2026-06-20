"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  type ButtonProps,
} from "@mui/material";
import type { ReactNode } from "react";

type HConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ButtonProps["color"];
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function HConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmColor = "primary",
  loading = false,
  onClose,
  onConfirm,
}: HConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            mx: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          gap: 1,
        }}
      >
        <Button
          type="button"
          variant="outlined"
          disabled={loading}
          onClick={onClose}
          sx={{
            minHeight: 44,
          }}
        >
          {cancelText}
        </Button>

        <Button
          type="button"
          variant="contained"
          color={confirmColor}
          disabled={loading}
          onClick={onConfirm}
          sx={{
            minHeight: 44,
            minWidth: 110,
          }}
        >
          {loading && (
            <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
          )}

          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
