import {
  Box,
  Container,
  Stack,
} from '@mui/material';

import { PageHeader } from '@/components/layout/PageHeader';
import { ExpenseCreateForm } from '@/features/expenses/components/ExpenseCreateForm';

export default function CreateExpensePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100vh - 64px)',
        py: {
          xs: 2,
          sm: 3,
          md: 5,
        },
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          px: {
            xs: 1.5,
            sm: 3,
          },
        }}
      >
        <Stack spacing={3}>
          <PageHeader
            title="Tạo khoản chi"
            description="Lưu các chi phí phát sinh để theo dõi dòng tiền và tính toán lợi nhuận."
            actionHref="/expenses"
            actionLabel="Quản lý khoản chi"
            actionColor="error"
          />

          <ExpenseCreateForm />
        </Stack>
      </Container>
    </Box>
  );
}