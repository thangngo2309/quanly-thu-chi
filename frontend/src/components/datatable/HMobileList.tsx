'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Pagination,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  type ReactNode,
  useState,
} from 'react';
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

  activeFilterCount?: number;

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
  activeFilterCount = 0,
  searchMethods,
  onSearch,
  searchContent,
  onResetSearch,
  actions,
  children,
  onRefresh,
  onPageChange,
}: HMobileListProps<TSearch>) {
  const [filterOpen, setFilterOpen] =
    useState(false);

  const handleSearch: SubmitHandler<
    TSearch
  > = async (values, event) => {
    await onSearch(values, event);
    setFilterOpen(false);
  };

  const handleReset = (): void => {
    onResetSearch();
    setFilterOpen(false);
  };

  return (
    <Stack spacing={1.5}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          overflow: 'hidden',
        }}
      >
        <CardContent
          sx={{
            p: 2,

            '&:last-child': {
              pb: 2,
            },
          }}
        >
          <Stack spacing={1.75}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: 'flex-start',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 21,
                    lineHeight: 1.3,
                    fontWeight: 900,
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
                      lineHeight: 1.5,
                    }}
                  >
                    {description}
                  </Typography>
                )}
              </Box>

              <IconButton
                type="button"
                aria-label="Tải lại dữ liệu"
                disabled={loading}
                onClick={onRefresh}
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  color: 'primary.main',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Stack>

            {actions && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: 1,

                  '& .MuiButton-root': {
                    width: '100%',
                    minWidth: 0,
                    minHeight: 44,
                    px: 1,
                    whiteSpace: 'nowrap',
                    fontSize: 14,
                  },
                }}
              >
                {actions}
              </Box>
            )}

            <Button
              type="button"
              variant="outlined"
              startIcon={<FilterListIcon />}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: filterOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                    transition:
                      'transform 0.2s ease',
                  }}
                />
              }
              onClick={() =>
                setFilterOpen(
                  (current) => !current,
                )
              }
              sx={{
                minHeight: 44,
                justifyContent: 'flex-start',
                borderColor: 'divider',
                color: 'text.primary',

                '& .MuiButton-endIcon': {
                  ml: 'auto',
                },
              }}
            >
              Bộ lọc tìm kiếm

              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  color="primary"
                  size="small"
                  sx={{
                    ml: 1,
                    height: 22,
                    minWidth: 22,
                    fontWeight: 800,
                  }}
                />
              )}
            </Button>
          </Stack>
        </CardContent>

        <Collapse
          in={filterOpen}
          timeout="auto"
          unmountOnExit
        >
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor:
                'rgba(248, 250, 252, 0.8)',
            }}
          >
            <CardContent
              sx={{
                p: 2,

                '&:last-child': {
                  pb: 2,
                },

                '& .MuiFormControl-root': {
                  width: '100%',
                },
              }}
            >
              <HForm
                methods={searchMethods}
                onSubmit={handleSearch}
              >
                <Stack spacing={1.5}>
                  {searchContent}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: 1,
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={loading}
                      onClick={handleReset}
                      sx={{
                        minHeight: 44,
                      }}
                    >
                      Xóa lọc
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        minHeight: 44,
                      }}
                    >
                      Tìm kiếm
                    </Button>
                  </Box>
                </Stack>
              </HForm>
            </CardContent>
          </Box>
        </Collapse>
      </Card>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 0.5,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {totalItems.toLocaleString(
            'vi-VN',
          )}{' '}
          bản ghi
        </Typography>

        {totalPages > 1 && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Trang {page + 1}/
            {totalPages}
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Stack spacing={1.25}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={190}
              sx={{
                borderRadius: 2.5,
              }}
            />
          ))}
        </Stack>
      ) : (
        children
      )}

      {!loading &&
        totalItems > 0 &&
        totalPages > 1 && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
            }}
          >
            <CardContent
              sx={{
                py: 1.25,
                px: 1,

                '&:last-child': {
                  pb: 1.25,
                },
              }}
            >
              <Pagination
                count={Math.max(
                  totalPages,
                  1,
                )}
                page={page + 1}
                size="small"
                siblingCount={0}
                boundaryCount={1}
                onChange={(
                  _,
                  nextPage,
                ) => {
                  onPageChange(
                    nextPage - 1,
                  );

                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  });
                }}
                sx={{
                  '& .MuiPagination-ul': {
                    justifyContent:
                      'center',
                  },

                  '& .MuiPaginationItem-root':
                    {
                      minWidth: 36,
                      height: 36,
                    },
                }}
              />
            </CardContent>
          </Card>
        )}
    </Stack>
  );
}