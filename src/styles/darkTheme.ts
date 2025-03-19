'use client';

import { createTheme } from '@mui/material/styles';
import globalStyles from '@/styles/globalStyle';

const PAPER_BG = '#22262c';

const darkTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#1c2025',
      paper: PAPER_BG,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        '*': {
          scrollbarWidth: '10px',
          scrollbarColor: '#474c50',
        },
        '*::-webkit-scrollbar': {
          width: '10px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(202,204,206,0.04)',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#474c50',
          borderRadius: '10px',
        },
        '*::-webkit-scrollbar-corner': {
          backgroundColor: '#474c50',
        },
        ...globalStyles(theme),
      }),
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: PAPER_BG,
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: PAPER_BG,
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: PAPER_BG,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
  },
});

export default darkTheme;
