'use client';

import {
  Box,
  Button,
  Stack,
  Typography,
  type ButtonProps,
} from '@mui/material';
import Link from 'next/link';

import { ExportExcelDialog } from '@/features/reports/components/ExportExcelDialog';

type PageHeaderProps = {
  title: string;
  description?: string;

  actionHref?: string;
  actionLabel?: string;
  actionColor?: ButtonProps['color'];
};

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  actionColor = 'primary',
}: PageHeaderProps) {
  return (
    <Stack
      spacing={2}
      sx={{
        flexDirection: {
          xs: 'column',
          sm: 'row',
        },
        alignItems: {
          xs: 'stretch',
          sm: 'flex-start',
        },
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            fontSize: {
              xs: 25,
              sm: 28,
              md: 32,
            },
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        spacing={1}
        sx={{
          width: {
            xs: '100%',
            sm: 'auto',
          },
          flexShrink: 0,
        }}
      >
        <ExportExcelDialog fullWidth />

        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            style={{
              textDecoration: 'none',
              width: '100%',
            }}
          >
            <Button
              variant="contained"
              color={actionColor}
              fullWidth
              sx={{
                minHeight: 44,
                whiteSpace: 'nowrap',
              }}
            >
              {actionLabel}
            </Button>
          </Link>
        )}
      </Stack>
    </Stack>
  );
}