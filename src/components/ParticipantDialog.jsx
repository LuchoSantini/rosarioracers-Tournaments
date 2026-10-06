import { useRef } from 'react';
import { Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BallastIcon from '@mui/icons-material/FitnessCenterOutlined';
import { formatLapTime } from '../lib/laptime';
import { ballastOf, hasBallast } from '../lib/tournament';
import { DISPLAY_FONT, MEDALS } from '../theme';
import Flag from './Flag';
import PositionBadge from './PositionBadge';

const played = (r) => Boolean(r.q1Pos || r.q2Pos || r.finalPos);

// Chip de una sesión: P1, P2 y P3 se marcan con oro, plata y bronce; el resto queda neutro.
function ResultChip({ label, position, points, time }) {
  const medal = MEDALS[position];
  const text = position ? `${label} P${position}${time != null ? ` · ${formatLapTime(time)}` : ''} · +${points}` : `${label} —`;
  return (
    <Chip
      size="small"
      variant={medal ? 'filled' : 'outlined'}
      label={text}
      sx={medal ? { bgcolor: medal, color: '#000', fontWeight: 700, '&:hover': { bgcolor: medal } } : undefined}
    />
  );
}

function Stat({ label, value }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.03)' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: '1.9rem', lineHeight: 1.1 }}>{value}</Typography>
    </Box>
  );
}

// Modal con los resultados de un participante: posición, puntos y el detalle de cada fecha disputada.
// `row` es una fila de computeStandings; al cerrar se conserva la última para que no se vacíe durante la animación.
export default function ParticipantDialog({ row, tournament, totalParticipants, onClose }) {
  const last = useRef(null);
  if (row) last.current = row;
  const shown = row ?? last.current;
  if (!shown) return null;

  const rounds = tournament.rounds;
  const playedCount = shown.rounds.filter(played).length;
  const pending = rounds.length - playedCount;

  return (
    <Dialog open={Boolean(row)} onClose={onClose} maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <PositionBadge position={shown.position} size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="span" variant="h4" sx={{ display: 'block' }} noWrap>{shown.participant.name}</Typography>
            <Typography component="span" variant="body2" color="text.secondary" sx={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0, fontWeight: 400, display: 'block' }}>
              {tournament.name}
            </Typography>
          </Box>
        </Stack>
        <IconButton aria-label="Cerrar" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={1.25} sx={{ mb: 2.5 }}>
          <Stat label="Puntos" value={shown.total} />
          <Stat label="Posición" value={`${shown.position}º de ${totalParticipants}`} />
          <Stat label="Fechas" value={`${playedCount}/${rounds.length}`} />
        </Stack>

        <Typography variant="h6" sx={{ mb: 1.25 }}>Resultados por fecha</Typography>
        {playedCount === 0 ? (
          <Typography color="text.secondary">Todavía no tiene resultados cargados.</Typography>
        ) : (
          <Stack spacing={1.75}>
            {rounds.map((round, i) => {
              const r = shown.rounds[i];
              if (!played(r)) return null;
              return (
                <Box key={round.id}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Flag code={round.track.countryCode} name={round.track.countryName} height={18} />
                    <Typography sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>{i + 1}. {round.track.name}</Typography>
                    <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: '1.25rem' }}>{r.total} pts</Typography>
                  </Stack>
                  <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap', mt: 0.75 }}>
                    <ResultChip label="Q1" position={r.q1Pos} points={r.q1Points} time={round.times?.q1?.[shown.participant.id]} />
                    <ResultChip
                      label={r.q2Group ? `Q2 ${r.q2Group}` : 'Q2'}
                      position={r.q2Pos}
                      points={r.q2Points}
                      time={round.times?.[r.q2Group === 'B' ? 'q2B' : 'q2']?.[shown.participant.id]}
                    />
                    <ResultChip label={r.group ? `Final ${r.group}` : 'Final'} position={r.finalPos} points={r.finalPoints} />
                    {hasBallast(tournament) && ballastOf(round, shown.participant.id) > 0 && (
                      <Chip size="small" variant="outlined" color="primary" icon={<BallastIcon />} label={`Lastre ${ballastOf(round, shown.participant.id)} kg`} />
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
        {pending > 0 && playedCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {pending === 1 ? 'Falta 1 fecha' : `Faltan ${pending} fechas`} sin resultados.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
