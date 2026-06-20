import {
    Box,
    Container,
    Typography,
  } from '@mui/material';
  
  export default function DashboardPage() {
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
            Tổng quát
          </Typography>
  
          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Báo cáo doanh thu, công nợ, chi phí và lợi
            nhuận sẽ hiển thị tại đây.
          </Typography>
        </Container>
      </Box>
    );
  }