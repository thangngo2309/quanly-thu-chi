'use client';

import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavigationItem = {
  label: string;
  href: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Tạo khoản thu',
    href: '/',
  },
  {
    label: 'Tạo khoản chi',
    href: '/expenses/create',
  },
  {
    label: 'Quản lý khoản thu',
    href: '/sales',
  },
  {
    label: 'Quản lý khoản chi',
    href: '/expenses',
  },
  {
    label: 'Tổng quát',
    href: '/dashboard',
  },
];

export function AppNavigation() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            minHeight: 64,
            gap: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              whiteSpace: 'nowrap',
              color: 'primary.main',
            }}
          >
            Quản lý thu chi
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              overflowX: 'auto',
              py: 1,
              flex: 1,

              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {navigationItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 38,
                      px: 1.75,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      fontSize: 14,
                      fontWeight: active ? 800 : 600,
                      color: active
                        ? 'primary.main'
                        : 'text.secondary',
                      backgroundColor: active
                        ? 'primary.50'
                        : 'transparent',
                      transition: 'all 0.2s',

                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Box>
                </Link>
              );
            })}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}