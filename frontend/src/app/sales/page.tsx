import {
    Box,
    Container,
    Typography,
  } from '@mui/material';
  
  export default function SalesPage() {
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
            Quản lý khoản thu
          </Typography>
  
          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Danh sách doanh thu và công nợ sẽ được xây
            dựng ở bước tiếp theo.
          </Typography>
        </Container>
      </Box>
    );
  }