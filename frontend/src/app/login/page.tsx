"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import { HForm, HInput } from "@/components/form";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getApiErrorMessage } from "@/utils/api-error";
import { useToast } from "@/components/toast/ToastProvider";

type LoginFormValues = {
  username: string;
  password: string;
};

const defaultValues: LoginFormValues = {
  username: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const { login } = useAuth();

  const methods = useForm<LoginFormValues>({
    defaultValues,
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const handleSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    try {
      await login({
        username: values.username.trim(),
        password: values.password,
      });

      router.replace("/");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Tên đăng nhập hoặc mật khẩu không đúng")
      );
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(145deg, #eff6ff 0%, #f8fafc 55%, #eef2ff 100%)",
        py: 3,
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2.5,
                sm: 4,
              },

              "&:last-child": {
                pb: {
                  xs: 2.5,
                  sm: 4,
                },
              },
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: "primary.main",
                    fontWeight: 900,
                    fontSize: {
                      xs: 27,
                      sm: 31,
                    },
                  }}
                >
                  Quản lý thu chi
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.75,
                  }}
                >
                  Đăng nhập để tiếp tục sử dụng hệ thống.
                </Typography>
              </Box>

              <HForm methods={methods} onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <HInput<LoginFormValues>
                    name="username"
                    label="Tên đăng nhập"
                    autoComplete="username"
                    rules={{
                      required: "Vui lòng nhập tên đăng nhập",
                    }}
                  />

                  <HInput<LoginFormValues>
                    name="password"
                    label="Mật khẩu"
                    type="password"
                    autoComplete="current-password"
                    rules={{
                      required: "Vui lòng nhập mật khẩu",
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      minHeight: 50,
                      fontWeight: 800,
                    }}
                  >
                    {isSubmitting && (
                      <CircularProgress
                        size={19}
                        color="inherit"
                        sx={{ mr: 1 }}
                      />
                    )}

                    {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                </Stack>
              </HForm>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
