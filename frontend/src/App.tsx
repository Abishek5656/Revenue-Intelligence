import  { Suspense, lazy } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Loading from './components/Loading';

// Lazy load the Dashboard component
const Dashboard = lazy(() => import('./components/Dashboard'));

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C4DFF', // Deep Purple
    },
    secondary: {
      main: '#00E5FF', // Cyan Accent
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
