import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Tab, Tabs } from '@mui/material';

// Pestañas de las pantallas de gestión: torneos y categorías.
export default function ManageTabs() {
  const { pathname } = useLocation();
  const value = pathname.startsWith('/categorias') ? '/categorias' : '/torneos';

  return (
    <Tabs value={value} aria-label="Gestión" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Tab label="Torneos" value="/torneos" component={RouterLink} to="/torneos" />
      <Tab label="Categorías" value="/categorias" component={RouterLink} to="/categorias" />
    </Tabs>
  );
}
