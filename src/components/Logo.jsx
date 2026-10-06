import { useState } from 'react';
import { Box } from '@mui/material';
import { BRAND_YELLOW, DISPLAY_FONT } from '../theme';

// Logo de Rosario Racers Café: public/logo-rrc.png (si falta, se muestra un monograma).
export default function Logo({ size = 96 }) {
  const [failed, setFailed] = useState(false);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        bgcolor: '#000',
        borderRadius: `${Math.round(size * 0.08)}px`,
        boxShadow: `0 0 0 2px ${BRAND_YELLOW}, 0 8px 32px rgba(255, 204, 1, 0.18)`,
      }}
    >
      {failed ? (
        <Box component="span" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: size * 0.4, color: BRAND_YELLOW }}>
          RRC
        </Box>
      ) : (
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}logo-rrc.png`}
          alt="Rosario Racers Café"
          onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </Box>
  );
}
