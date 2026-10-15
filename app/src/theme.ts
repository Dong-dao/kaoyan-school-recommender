import { createTheme } from '@mui/material/styles';

// MUI 主题，与现有页面的蓝色系设计保持一致
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E40AF', // 深蓝
      light: '#3B82F6',
      dark: '#1E3A8A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7C3AED', // 紫
    },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    background: {
      default: '#EFF6FF',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Fira Sans", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});

export default theme;
