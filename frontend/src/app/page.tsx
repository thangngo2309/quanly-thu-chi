import {
  Box,
  Container,
  Stack,
} from '@mui/material';

import { PageHeader } from '@/components/layout/PageHeader';
import { SaleCreateForm } from '@/features/sales/components/SaleCreateForm';

export default function HomePage() {
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
            title="Tạo khoản thu"
            description="Ghi nhận doanh thu bán hàng, số tiền đã thu và công nợ của khách hàng."
            actionHref="/sales"
            actionLabel="Quản lý khoản thu"
          />

          <SaleCreateForm />
        </Stack>
      </Container>
    </Box>
  );
}