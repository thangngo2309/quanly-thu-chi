import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppNavigation } from '@/components/layout/AppNavigation';

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
        <Providers>
          <AppNavigation />

          {children}
        </Providers>
      </body>
    </html>
  );
}