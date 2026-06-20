'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Pagination,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

import { HForm } from '@/components/form';

type HMobileListProps<
  TSearch extends FieldValues,
> = {
  title: string;
  description?: string;

  loading?: boolean;
  totalItems: number;
  totalPages: number;
  page: number;

  searchMethods: UseFormReturn<TSearch>;
  onSearch: SubmitHandler<TSearch>;
  searchContent: ReactNode;
  onResetSearch: () => void;

  actions?: ReactNode;
  children: ReactNode;

  onRefresh: () => void;
  onPageChange: (page: number) => void;
};

export function HMobileList<
  TSearch extends FieldValues,
>({
  title,
  description,
  loading = false,
  totalItems,
  totalPages,
  page,
  searchMethods,
  onSearch,
  searchContent,
  onResetSearch,
  actions,
  children,
  onRefresh,
  onPageChange,
}: HMobileListProps<TSearch>) {
  return (
    <Stack spacing={2}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                }}
              >
                {title}
              </Typography>

              {description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {description}
                </Typography>
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={loading}
                onClick={onRefresh}
                sx={{
                  minHeight: 44,
                }}
              >
                Tải lại
              </Button>

              {actions}
            </Stack>
          </Stack>
        </CardContent>

        <Divider />

        <CardContent>
          <HForm
            methods={searchMethods}
            onSubmit={onSearch}
          >
            <Stack spacing={1.5}>
              {searchContent}

              <Stack
                direction="row"
                spacing={1}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={loading}
                  onClick={onResetSearch}
                  fullWidth
                  sx={{
                    minHeight: 46,
                  }}
                >
                  Xóa lọc
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  sx={{
                    minHeight: 46,
                  }}
                >
                  Tìm kiếm
                </Button>
              </Stack>
            </Stack>
          </HForm>
        </CardContent>
      </Card>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          px: 0.5,
        }}
      >
        Tìm thấy {totalItems} bản ghi
      </Typography>

      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={210}
              sx={{
                borderRadius: 3,
              }}
            />
          ))}
        </Stack>
      ) : (
        children
      )}

      {!loading && totalItems > 0 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 1.5,
            }}
          >
            <Pagination
              count={Math.max(totalPages, 1)}
              page={page + 1}
              size="small"
              siblingCount={0}
              boundaryCount={1}
              onChange={(_, nextPage) => {
                onPageChange(nextPage - 1);
              }}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}