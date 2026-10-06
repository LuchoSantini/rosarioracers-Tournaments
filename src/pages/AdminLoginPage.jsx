import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import LockIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import { DISPLAY_FONT } from '../theme';
import { useStore } from '../store/StoreContext';
import Logo from '../components/Logo';
import PageBackground from '../components/PageBackground';
import PanelCard from '../components/PanelCard';

// Acceso del administrador (ruta /adminFer). Sólo quien inicia sesión puede editar; el resto ve la app en modo lectura.
// La comprobación es local (ver auth/credentials.js): sirve para pruebas, no es seguridad real.
export default function AdminLoginPage() {
  const { isAdmin, login, logout } = useStore();
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (login(user, password)) {
      navigate('/');
      return;
    }
    setError(true);
    setPassword('');
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
      <PageBackground />

      <PanelCard sx={{ width: '100%', maxWidth: 420 }}>
        <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
          <RouterLink to="/" aria-label="Inicio"><Logo size={84} /></RouterLink>
          <Box sx={{ textAlign: 'center' }}>
            <Typography component="h1" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', fontSize: '2.2rem', lineHeight: 1 }}>
              Acceso administrador
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>Sólo el administrador puede editar.</Typography>
          </Box>

          {isAdmin ? (
            <Stack spacing={1.5} sx={{ width: '100%' }}>
              <Alert severity="success">Ya iniciaste sesión como administrador.</Alert>
              <Button variant="contained" component={RouterLink} to="/">Ir al inicio</Button>
              <Button color="inherit" onClick={logout}>Cerrar sesión</Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={submit} noValidate sx={{ width: '100%' }}>
              <Stack spacing={2}>
                {error && <Alert severity="error">Usuario o contraseña incorrectos.</Alert>}
                <TextField
                  label="Usuario"
                  value={user}
                  autoFocus
                  autoComplete="username"
                  onChange={(e) => { setUser(e.target.value); setError(false); }}
                />
                <TextField
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() => setShowPassword((v) => !v)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button type="submit" variant="contained" size="large" startIcon={<LockIcon />} disabled={!user.trim() || !password}>
                  Ingresar
                </Button>
              </Stack>
            </Box>
          )}

          <Button component={RouterLink} to="/" color="inherit" size="small" startIcon={<ArrowBackIcon />}>Volver a los torneos</Button>
        </Stack>
      </PanelCard>
    </Box>
  );
}
