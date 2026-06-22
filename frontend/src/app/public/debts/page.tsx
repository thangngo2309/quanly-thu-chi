import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { PublicCustomerDebts } from "@/features/debts/components/PublicCustomerDebts";
export default function PublicDebtsPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <PublicCustomerDebts />
    </Suspense>
  );
}
