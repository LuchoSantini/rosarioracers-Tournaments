import { useMemo } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { makeTheme } from './theme';
import { StoreProvider } from './store/StoreContext';
import { ConfirmProvider } from './components/ConfirmProvider';
import Landing from './pages/Landing';
import CategoryPage from './pages/CategoryPage';
import TournamentsPage from './pages/TournamentsPage';
import CategoriesPage from './pages/CategoriesPage';
import AdminLoginPage from './pages/AdminLoginPage';

export default function App() {
  const theme = useMemo(() => makeTheme(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <ConfirmProvider>
          {/* HashRouter: la SPA funciona en cualquier hosting estático sin configurar redirecciones. */}
          <HashRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/categoria/:slug" element={<CategoryPage />} />
              <Route path="/torneos" element={<TournamentsPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/adminFer" element={<AdminLoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ConfirmProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
