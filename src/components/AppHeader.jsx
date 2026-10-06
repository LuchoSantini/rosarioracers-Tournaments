import { Link as RouterLink } from 'react-router-dom';
import { Box, FormControlLabel, IconButton, Stack, Switch, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import ListAltIcon from '@mui/icons-material/ListAltOutlined';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import { DISPLAY_FONT } from '../theme';
import { useStore } from '../store/StoreContext';
import Logo from './Logo';
import DataMenu from './DataMenu';

function HeaderControls() {
  const { editMode, setEditMode, isAdmin, logout } = useStore();
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Tooltip title="Gestionar torneos">
        <IconButton component={RouterLink} to="/torneos" aria-label="Gestionar torneos"><ListAltIcon /></IconButton>
      </Tooltip>
      {isAdmin && (
      <FormControlLabel
        sx={{ m: 0, mr: 0.5, '& .MuiFormControlLabel-label': { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 0.5 } }}
        control={<Switch size="small" checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />}
        label={<><EditIcon sx={{ fontSize: 18 }} />Edición</>}
        labelPlacement="start"
      />
      )}
      {isAdmin && (
        <Tooltip title="Cerrar sesión de administrador">
          <IconButton aria-label="Cerrar sesión de administrador" onClick={logout}><LogoutIcon /></IconButton>
        </Tooltip>
      )}
      <DataMenu />
    </Stack>
  );
}

// variant="hero": logo centrado y grande (landing). variant="compact": barra superior (categorías).
export default function AppHeader({ variant = 'compact' }) {
  if (variant === 'hero') {
    return (
      <Box component="header" sx={{ position: 'relative', pt: { xs: 1, sm: 3, md: 4 }, pb: { xs: 2, md: 3 }, px: 2 }}>
        {/* En celular los controles van arriba, en su propia fila; desde sm flotan en la esquina. */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 1, sm: 0 }, position: { xs: 'static', sm: 'absolute' }, top: { sm: 16, md: 20 }, right: { sm: 16, md: 24 } }}>
          <HeaderControls />
        </Box>
        <Stack spacing={{ xs: 1, md: 1.5 }} sx={{ alignItems: 'center' }}>
          <RouterLink to="/" aria-label="Inicio">
            <Logo size={104} />
          </RouterLink>
          <Typography
            component="h1"
            sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.6rem' }, letterSpacing: '0.42em', pl: '0.42em', lineHeight: 1 }}
          >
            TORNEOS
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="header" sx={{ display: 'flex', alignItems: 'center', gap: 2, px: { xs: 2, md: 4 }, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Stack component={RouterLink} to="/" direction="row" spacing={1.5} sx={{ alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
        <Logo size={48} />
        <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, fontSize: '1.2rem', letterSpacing: '0.32em' }}>TORNEOS</Typography>
      </Stack>
      <Box sx={{ flex: 1 }} />
      <HeaderControls />
    </Box>
  );
}
