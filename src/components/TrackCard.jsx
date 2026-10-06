import { Box, ButtonBase, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SESSIONS } from '../lib/tournament';
import { DISPLAY_FONT } from '../theme';
import CheckeredFlag from './CheckeredFlag';
import Flag from './Flag';
import LiveDot from './LiveDot';

function StatusBadge({ status }) {
  if (status === 'done') return <CheckeredFlag size={22} />;
  if (status === 'next') return <Chip size="small" color="primary" label="PRÓXIMA" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, letterSpacing: '0.1em' }} />;
  if (status === 'live') {
    return (
      <Chip size="small" color="primary" variant="outlined" icon={<LiveDot color="primary.main" size={8} />} label="EN DISPUTA"
        sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, letterSpacing: '0.1em', '& .MuiChip-icon': { ml: 1 } }} />
    );
  }
  return null;
}

// Tarjeta de una fecha: número, pista, país (bandera o 3 letras), estado y 4 barritas con las sesiones cargadas.
// status: 'done' (bandera a cuadros) · 'next' (la que sigue) · 'live' (en disputa) · 'pending'.
// `controls` es un nodo opcional a la derecha (botones de orden) que queda fuera del área clickeable.
export default function TrackCard({ round, index, status, onOpen, controls }) {
  const highlighted = status === 'next' || status === 'live';

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 2,
        border: 1,
        borderColor: highlighted ? 'primary.main' : 'divider',
        boxShadow: highlighted ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
        bgcolor: highlighted ? alpha(theme.palette.primary.main, 0.1) : 'rgba(255,255,255,0.025)',
        transition: 'border-color .2s, background-color .2s',
      })}
    >
      <ButtonBase
        disabled={!onOpen}
        onClick={onOpen}
        sx={{ flex: 1, minWidth: 0, display: 'block', textAlign: 'left', p: 1.5, borderRadius: 2, '&.Mui-disabled': { pointerEvents: 'auto' } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 24, mb: 0.75 }}>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.14em', fontSize: '0.8rem', color: 'text.secondary' }}>
            FECHA {index + 1}
          </Typography>
          <StatusBadge status={status} />
        </Stack>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Flag code={round.track.countryCode} name={round.track.countryName} height={24} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 600, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {round.track.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {round.track.countryName}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
              {SESSIONS.map((s) => (
                <Tooltip key={s.key} title={`${s.label}: ${round.results[s.key].length ? 'cargada' : 'pendiente'}`}>
                  <Box sx={{ width: 12, height: 6, borderRadius: 0.5, bgcolor: round.results[s.key].length ? 'primary.main' : 'rgba(255,255,255,0.14)' }} />
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Stack>
      </ButtonBase>
      {controls}
    </Box>
  );
}
