import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Quản lý thu chi',
  description: 'Quản lý doanh thu, công nợ và chi phí',
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
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}