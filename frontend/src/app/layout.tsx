import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Quản lý thu chi",
  description: "Quản lý doanh thu, công nợ và chi phí",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
