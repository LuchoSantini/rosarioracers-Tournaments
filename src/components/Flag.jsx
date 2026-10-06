import { Box } from '@mui/material';
import { DISPLAY_FONT } from '../theme';

// Banderas SVG incluidas en el proyecto (src/assets/flags/<codigo>.svg).
const urls = import.meta.glob('../assets/flags/*.svg', { eager: true, query: '?url', import: 'default' });
const FLAGS = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
);

// Bandera del país; si no hay bandera disponible muestra las 3 primeras letras del nombre.
export default function Flag({ code, name, height = 18 }) {
  const url = code ? FLAGS[code.toLowerCase()] : null;
  const width = Math.round((height * 4) / 3);

  if (url) {
    return (
      <Box
        component="img"
        src={url}
        alt={name ?? code}
        title={name}
        sx={{ width, height, flexShrink: 0, display: 'block', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(255,255,255,0.2)' }}
      />
    );
  }

  const letters = (name ?? code ?? '?').replace(/\s/g, '').slice(0, 3).toUpperCase();
  return (
    <Box
      component="span"
      title={name}
      sx={{
        width: Math.max(width, 28),
        height,
        flexShrink: 0,
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: '2px',
        bgcolor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
        fontFamily: DISPLAY_FONT,
        fontWeight: 700,
        fontSize: height * 0.62,
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}
    >
      {letters}
    </Box>
  );
}
