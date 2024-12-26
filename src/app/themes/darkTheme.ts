'use client';

import { createTheme } from '@mui/material/styles';
import globalStyles from '@/app/themes/globalStyle';

const darkTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#1c2025',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ...globalStyles(theme),
      }),
    },
  },
});

export default darkTheme;
