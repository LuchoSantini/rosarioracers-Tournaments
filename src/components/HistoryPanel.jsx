import { useMemo, useState } from 'react';
import { Box, ButtonBase, Chip, Stack, Typography } from '@mui/material';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import HistoryIcon from '@mui/icons-material/HistoryRounded';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { podium } from '../lib/hotlap';
import { isHotLap } from '../lib/tournament';
import { DISPLAY_FONT } from '../theme';
import PanelCard from './PanelCard';
import TournamentDetailDialog from './TournamentDetailDialog';

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '';

function HistoryItem({ tournament, onOpen }) {
  const top = useMemo(() => podium(tournament), [tournament]);
  const [champion, second, third] = top;
  const hotlap = isHotLap(tournament);
  const track = tournament.rounds[0]?.track;

  return (
    <ButtonBase
      onClick={onOpen}
      sx={{
        display: 'block', textAlign: 'left', width: '100%', p: 2, borderRadius: 2,
        border: 1, borderColor: 'divider', bgcolor: 'rgba(255,255,255,0.025)',
        transition: 'border-color .2s, background-color .2s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(255,255,255,0.05)' },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: champion ? '#ffd24a' : 'action.hover', color: champion ? '#000' : 'text.disabled' }}>
          <TrophyIcon sx={{ fontSize: 30 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" component="h3" noWrap>{tournament.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatDate(tournament.finishedAt)}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
            {hotlap && <Chip size="small" color="primary" icon={<TimerIcon />} label="Hot Lap" sx={{ height: 20, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: 14 } }} />}
            <Typography variant="body2" color="text.secondary" noWrap>
              {tournament.game} · {tournament.participants.length} participantes ·{' '}
              {hotlap ? track?.name ?? 'Sin pista' : `${tournament.rounds.length} ${tournament.rounds.length === 1 ? 'fecha' : 'fechas'}`}
            </Typography>
          </Stack>
          {champion ? (
            <>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 0.75 }}>
                <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: '1.65rem', lineHeight: 1.1, color: '#ffd24a' }} noWrap>
                  {champion.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{champion.label}</Typography>
              </Stack>
              {(second || third) && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {second && <>2º {second.name} ({second.label})</>}
                  {third && <> · 3º {third.name} ({third.label})</>}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>Sin resultados cargados</Typography>
          )}
        </Box>
      </Stack>
    </ButtonBase>
  );
}

const TYPE_COPY = {
  championship: { chip: 'Campeonatos', empty: 'Todavía no hay campeonatos finalizados en esta categoría.' },
  hotlap: { chip: 'Hot Laps', empty: 'Todavía no hay Hot Laps finalizados en esta categoría.' },
};

// Torneos finalizados de la categoría, a todo el ancho, con quién ganó cada uno. `history` ya viene filtrado por
// tipo (`type`: 'championship' | 'hotlap'), así que acá sólo cambian el título y el mensaje de lista vacía.
export default function HistoryPanel({ history, type = 'championship' }) {
  const copy = TYPE_COPY[type];
  const [openId, setOpenId] = useState(null);
  const selected = history.find((t) => t.id === openId) ?? null;

  return (
    <PanelCard>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
        <HistoryIcon sx={{ color: 'text.secondary' }} />
        <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>Histórico</Typography>
        <Chip label={copy.chip} color={type === 'hotlap' ? 'primary' : 'default'} variant={type === 'hotlap' ? 'filled' : 'outlined'} />
      </Stack>

      {history.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {copy.empty}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
          {history.map((t) => (
            <HistoryItem key={t.id} tournament={t} onOpen={() => setOpenId(t.id)} />
          ))}
        </Box>
      )}

      <TournamentDetailDialog tournament={selected} onClose={() => setOpenId(null)} />
    </PanelCard>
  );
}
