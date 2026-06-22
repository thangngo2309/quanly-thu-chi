"use client";
import { Box, CircularProgress } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { UserRole } from "@/features/auth/types/auth.types";
import { AppNavigation } from "./AppNavigation";

type AppShellProps = { children: ReactNode };
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === "/login";
  const isPublicDebtPage =
    pathname === "/public/debts" || pathname.startsWith("/public/debts/");
  const isPublicPage = isLoginPage || isPublicDebtPage;
  const isAdminAllowedPage = pathname === "/";
  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user && !isPublicPage) {
      router.replace("/login");
      return;
    }
    if (user && isLoginPage) {
      router.replace("/");
      return;
    }
    if (user?.role === UserRole.ADMIN && !isAdminAllowedPage && !isPublicPage) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, isPublicPage, isAdminAllowedPage, router]);
  /** * Trang công nợ công khai: * - Không chờ AuthProvider * - Không hiển thị AppNavigation * - Không chuyển về login */ if (
    isPublicDebtPage
  ) {
    return <>{children}</>;
  }
  if (isLoginPage) {
    return <>{children}</>;
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
      <AppNavigation /> {children}
    </>
  );
}
