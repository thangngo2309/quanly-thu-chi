'use client';

import {
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

export function useResponsiveMode() {
  const theme = useTheme();

  const mediaQueryIsMobile = useMediaQuery(
    theme.breakpoints.down('md'),
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    mounted,
    isMobile:
      mounted && mediaQueryIsMobile,
  };
}