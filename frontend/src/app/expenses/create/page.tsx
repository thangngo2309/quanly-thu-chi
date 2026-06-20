import {
    Box,
    Container,
    Stack,
    Typography,
  } from '@mui/material';
  
  import { ExpenseCreateForm } from '@/features/expenses/components/ExpenseCreateForm';
  
  export default function CreateExpensePage() {
    return (
      <Box
        component="main"
        sx={{
          minHeight: 'calc(100vh - 64px)',
          py: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  fontSize: {
                    xs: 26,
                    md: 32,
                  },
                }}
              >
                Tạo khoản chi
              </Typography>
  
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                Lưu lại các chi phí phát sinh để tính
                toán lợi nhuận chính xác.
              </Typography>
            </Box>
  
            <ExpenseCreateForm />
          </Stack>
        </Container>
      </Box>
    );
  }