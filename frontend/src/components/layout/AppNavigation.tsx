'use client';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type ReactNode,
  useState,
} from 'react';

type NavigationItem = {
  label: string;
  mobileLabel: string;
  href: string;
  icon: ReactNode;
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Tạo khoản thu',
    mobileLabel: 'Tạo khoản thu',
    href: '/',
    icon: <AddCircleOutlineOutlinedIcon />,
  },
  {
    label: 'Tạo khoản chi',
    mobileLabel: 'Tạo khoản chi',
    href: '/expenses/create',
    icon: <PaymentsOutlinedIcon />,
  },
  {
    label: 'Quản lý khoản thu',
    mobileLabel: 'Quản lý khoản thu',
    href: '/sales',
    icon: <ReceiptLongOutlinedIcon />,
  },
  {
    label: 'Quản lý khoản chi',
    mobileLabel: 'Quản lý khoản chi',
    href: '/expenses',
    icon: <AccountBalanceWalletOutlinedIcon />,
  },
  {
    label: 'Tổng quát',
    mobileLabel: 'Tổng quát',
    href: '/dashboard',
    icon: <DashboardOutlinedIcon />,
  },
];

export function AppNavigation() {
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const isActive = (
    href: string,
  ): boolean => {
    return pathname === href;
  };

  const closeDrawer = (): void => {
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Thanh menu desktop */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          display: {
            xs: 'none',
            md: 'block',
          },
          backgroundColor:
            'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            px: {
              md: 3,
              lg: 5,
            },
            gap: 1,
          }}
        >
          <Typography
            component={Link}
            href="/"
            variant="h5"
            sx={{
              mr: 3,
              color: 'primary.main',
              fontWeight: 900,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Quản lý thu chi
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: 0,
              overflowX: 'auto',

              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {navigationItems.map(
              (item) => {
                const active = isActive(
                  item.href,
                );

                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    color={
                      active
                        ? 'primary'
                        : 'inherit'
                    }
                    sx={{
                      minHeight: 42,
                      px: 1.75,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      fontWeight: active
                        ? 800
                        : 600,
                      backgroundColor: active
                        ? 'action.selected'
                        : 'transparent',

                      '&:hover': {
                        backgroundColor:
                          'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              },
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Thanh menu mobile */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          backgroundColor:
            'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            minHeight: 56,
            px: 1.5,
          }}
        >
          <Typography
            component={Link}
            href="/"
            sx={{
              flex: 1,
              color: 'primary.main',
              fontWeight: 900,
              fontSize: 20,
              textDecoration: 'none',
            }}
          >
            Quản lý thu chi
          </Typography>

          <IconButton
            type="button"
            edge="end"
            aria-label="Mở menu"
            onClick={() =>
              setDrawerOpen(true)
            }
            sx={{
              width: 44,
              height: 44,
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 'min(82vw, 320px)',
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 3,
            pb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 21,
              fontWeight: 900,
              color: 'primary.main',
            }}
          >
            Quản lý thu chi
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Chọn chức năng cần sử dụng
          </Typography>
        </Box>

        <Divider />

        <List
          sx={{
            px: 1.25,
            py: 1.5,
          }}
        >
          {navigationItems.map(
            (item) => {
              const active = isActive(
                item.href,
              );

              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={active}
                  onClick={closeDrawer}
                  sx={{
                    minHeight: 52,
                    mb: 0.5,
                    borderRadius: 2.5,

                    '&.Mui-selected': {
                      color: 'primary.main',
                      backgroundColor:
                        'action.selected',
                    },

                    '&.Mui-selected:hover': {
                      backgroundColor:
                        'action.selected',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 42,
                      color: active
                        ? 'primary.main'
                        : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      item.mobileLabel
                    }
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: active
                            ? 800
                            : 600,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              );
            },
          )}
        </List>
      </Drawer>
    </>
  );
}