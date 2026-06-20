import {
    Box,
    Container,
    Typography,
  } from '@mui/material';
  
  export default function ExpensesPage() {
    return (
      <Box
        component="main"
        sx={{ py: 4 }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{ fontWeight: 900 }}
          >
            Quản lý khoản chi
          </Typography>
  
          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Danh sách khoản chi sẽ được xây dựng ở bước
            tiếp theo.
          </Typography>
        </Container>
      </Box>
    );
  }