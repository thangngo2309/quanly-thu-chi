import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { ThemeRegistry } from '@/components/theme/ThemeRegistry';
import { AuthProvider } from '@/features/auth/context/AuthProvider';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Quản lý thu chi',
  description:
    'Quản lý doanh thu, công nợ và chi phí',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <ThemeRegistry>
          <Providers>
            <AuthProvider>
              <AppShell>
                {children}
              </AppShell>
            </AuthProvider>
          </Providers>
        </ThemeRegistry>
      </body>
    </html>
  );
}