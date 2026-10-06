import { Box } from '@mui/material';
import { DISPLAY_FONT, MEDALS } from '../theme';

// Número de posición; los 3 primeros llevan color de medalla.
export default function PositionBadge({ position, size = 32 }) {
  const color = MEDALS[position];
  return (
    <Box
      sx={{
        width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1,
        fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: size * 0.36 + 'px',
        bgcolor: color ?? 'transparent', color: color ? '#000' : 'text.secondary',
      }}
    >
      {position}
    </Box>
  );
}
