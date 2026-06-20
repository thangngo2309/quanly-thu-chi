'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { viVN as coreViVN } from '@mui/material/locale';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import 'dayjs/locale/vi';
import { useServerInsertedHTML } from 'next/navigation';
import {
  type ReactNode,
  useState,
} from 'react';

type ProvidersProps = {
  children: ReactNode;
};

type InsertedStyle = {
  name: string;
  isGlobal: boolean;
};

const theme = createTheme(
  {
    palette: {
      mode: 'light',

      primary: {
        main: '#2563eb',
      },

      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
    },

    shape: {
      borderRadius: 10,
    },

    typography: {
      fontFamily:
        'Arial, Helvetica, sans-serif',
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            minHeight: '100%',
          },

          body: {
            minHeight: '100%',
            margin: 0,
          },

          '*': {
            boxSizing: 'border-box',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 8,
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
    },
  },
  coreViVN,
);

export function Providers({
  children,
}: ProvidersProps) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: 'mui',
    });

    cache.compat = true;

    const previousInsert = cache.insert;

    let inserted: InsertedStyle[] = [];

    cache.insert = (...args) => {
      const selector = args[0];
      const serialized = args[1];

      if (
        cache.inserted[serialized.name] ===
        undefined
      ) {
        inserted.push({
          name: serialized.name,
          isGlobal: !selector,
        });
      }

      return previousInsert(...args);
    };

    const flush = (): InsertedStyle[] => {
      const previouslyInserted = inserted;

      inserted = [];

      return previouslyInserted;
    };

    return {
      cache,
      flush,
    };
  });

  useServerInsertedHTML(() => {
    const insertedStyles = flush();

    if (insertedStyles.length === 0) {
      return null;
    }

    const globalStyles: Array<{
      name: string;
      css: string;
    }> = [];

    const componentNames: string[] = [];
    let componentCss = '';

    insertedStyles.forEach(
      ({ name, isGlobal }) => {
        const style = cache.inserted[name];

        if (typeof style !== 'string') {
          return;
        }

        if (isGlobal) {
          globalStyles.push({
            name,
            css: style,
          });

          return;
        }

        componentNames.push(name);
        componentCss += style;
      },
    );

    return (
      <>
        {globalStyles.map(({ name, css }) => (
          <style
            key={`mui-global-${name}`}
            data-emotion={`mui-global ${name}`}
            dangerouslySetInnerHTML={{
              __html: css,
            }}
          />
        ))}

        {componentCss && (
          <style
            data-emotion={`mui ${componentNames.join(
              ' ',
            )}`}
            dangerouslySetInnerHTML={{
              __html: componentCss,
            }}
          />
        )}
      </>
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="vi"
        >
          <CssBaseline />

          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}