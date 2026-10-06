import { useMemo, useRef } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SportsEsportsIcon from '@mui/icons-material/SportsEsportsOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { podium } from '../lib/hotlap';
import { activeOf, isHotLap, typeLabel } from '../lib/tournament';
import { DISPLAY_FONT, MEDALS } from '../theme';
import { useStore } from '../store/StoreContext';
import { useConfirm } from './ConfirmProvider';
import Flag from './Flag';
import HotLapBoard from './HotLapBoard';
import StandingsImageButton from './StandingsImageButton';
import StandingsTable from './StandingsTable';
import TracksStrip from './TracksStrip';

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';

function Podium({ top }) {
  return (
    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
      {top.map((entry, i) => (
        <Box key={entry.id} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', borderTop: 4, borderTopColor: MEDALS[i + 1], bgcolor: 'rgba(255,255,255,0.025)' }}>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, color: MEDALS[i + 1], letterSpacing: '0.08em' }}>{i + 1}º LUGAR</Typography>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: i === 0 ? '2rem' : '1.6rem', lineHeight: 1.1 }} noWrap>
            {entry.name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{entry.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// Detalle de un torneo (finalizado o en curso, campeonato o Hot Lap): podio, pista(s) y tabla completa.
export default function TournamentDetailDialog({ tournament, onClose }) {
  const { state, actions, editMode } = useStore();
  const confirm = useConfirm();

  // Se conserva el último torneo mostrado para que el diálogo no quede vacío mientras se cierra.
  const lastShown = useRef(null);
  if (tournament) lastShown.current = tournament;
  const shown = tournament ?? lastShown.current;

  const top = useMemo(() => (shown ? podium(shown) : []), [shown]);

  if (!shown) return null;

  const hotlap = isHotLap(shown);
  const finished = shown.status === 'finished';
  const track = shown.rounds[0]?.track;
  const running = activeOf(state.tournaments, shown.categoryId, hotlap ? 'hotlap' : 'championship', shown.id);

  const reopen = async () => {
    if (await confirm({ title: 'Reabrir torneo', message: `"${shown.name}" vuelve a estar en curso y sale del histórico.`, confirmLabel: 'Reabrir' })) {
      actions.reopenTournament(shown.id);
      onClose();
    }
  };

  const remove = async () => {
    if (await confirm({ title: 'Eliminar torneo', message: `Se elimina "${shown.name}" con todos sus resultados. No se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) {
      actions.deleteTournament(shown.id);
      onClose();
    }
  };

  return (
    <Dialog open={Boolean(tournament)} onClose={onClose} maxWidth="md" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        {shown.name}
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
          <Chip size="small" color={hotlap ? 'primary' : 'default'} icon={hotlap ? <TimerIcon /> : undefined} label={typeLabel(shown)} variant={hotlap ? 'filled' : 'outlined'} />
          <Chip size="small" icon={<SportsEsportsIcon />} label={shown.game} variant="outlined" />
          <Chip size="small" label={finished ? `Finalizado el ${formatDate(shown.finishedAt)}` : 'En curso'} variant="outlined" color={finished ? 'default' : 'success'} />
        </Stack>
        <IconButton aria-label="Cerrar" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {top.length > 0 && <Podium top={top} />}
          {hotlap ? (
            <>
              {track && (
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Flag code={track.countryCode} name={track.countryName} height={22} />
                  <Typography sx={{ fontWeight: 600 }}>{track.name} · {track.countryName}</Typography>
                </Stack>
              )}
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>Mejores vueltas</Typography>
                <HotLapBoard tournament={shown} />
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>Pistas</Typography>
                <TracksStrip tournament={shown} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ mb: 1 }}>{finished ? 'Tabla final' : 'Tabla de posiciones'}</Typography>
                <StandingsTable tournament={shown} />
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
          <StandingsImageButton tournament={shown} />
          <Box sx={{ flex: 1 }} />
          {editMode && <Button color="error" startIcon={<DeleteIcon />} onClick={remove}>Eliminar</Button>}
          {editMode && finished && (
            <Button startIcon={<ReplayIcon />} onClick={reopen} disabled={Boolean(running)}>
              {running ? `Ya hay un ${typeLabel(shown)} en curso` : 'Reabrir torneo'}
            </Button>
          )}
        </DialogActions>
    </Dialog>
  );
}
