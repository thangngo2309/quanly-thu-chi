"use client";

import { Box, CircularProgress } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { UserRole } from "@/features/auth/types/auth.types";

import { AppNavigation } from "./AppNavigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, loading } = useAuth();

  const isLoginPage = pathname === "/login";

  const isAdminAllowedPage = pathname === "/";

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && !isLoginPage) {
      router.replace("/login");
      return;
    }

    if (user && isLoginPage) {
      router.replace("/");
      return;
    }

    if (user?.role === UserRole.ADMIN && !isAdminAllowedPage) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, isAdminAllowedPage, router]);

  if (isLoginPage) {
    return children;
  }

  if (loading || !user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (user.role === UserRole.ADMIN && !isAdminAllowedPage) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppNavigation />
      {children}
    </>
  );
}
