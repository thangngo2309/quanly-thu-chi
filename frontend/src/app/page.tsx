import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import {
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';

import { SaleCreateForm } from '@/features/sales/components/SaleCreateForm';

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: {
          xs: 3,
          md: 5,
        },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{alignItems: 'center'}}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <AccountBalanceWalletOutlinedIcon />
            </Box>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontSize: {
                    xs: 26,
                    md: 32,
                  },
                  fontWeight: 900
                }}
              >
                Quản lý thu chi
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Theo dõi doanh thu, công nợ và
                chi phí
              </Typography>
            </Box>
          </Stack>

          <SaleCreateForm />
        </Stack>
      </Container>
    </Box>
  );
}