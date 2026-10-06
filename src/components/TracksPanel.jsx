import { useEffect, useMemo, useRef } from 'react';
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAddOutlined';
import UpIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import DownIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import DragIcon from '@mui/icons-material/DragIndicator';
import { roundStatuses } from '../lib/tournament';
import { useStore } from '../store/StoreContext';
import CheckeredFlag from './CheckeredFlag';
import PanelCard from './PanelCard';
import SortableList, { SortableItem } from './SortableList';
import TrackCard from './TrackCard';

// Mitad derecha del torneo en curso: las pistas en orden de fecha. Las disputadas llevan una bandera a cuadros,
// la que sigue queda destacada y, en modo edición, se pueden reordenar arrastrando o con las flechas.
export default function TracksPanel({ tournament, onOpenResults, onAddTrack }) {
  const { actions, editMode } = useStore();
  const statuses = useMemo(() => roundStatuses(tournament), [tournament]);
  const ids = useMemo(() => tournament.rounds.map((r) => r.id), [tournament.rounds]);
  const doneCount = ids.filter((id) => statuses[id] === 'done').length;
  const listRef = useRef(null);

  // En torneos anuales la lista es larga: al abrir se deja a la vista la fecha que sigue.
  useEffect(() => {
    const list = listRef.current;
    const upcoming = list?.querySelector('[data-status="next"], [data-status="live"]');
    if (list && upcoming) list.scrollTop = Math.max(0, upcoming.offsetTop - 8);
  }, [tournament.id]);

  const reorder = (next) => actions.reorderRounds(tournament.id, next);
  const move = (index, delta) => {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    reorder(next);
  };

  const controls = (index) => (
    <Stack direction="row" sx={{ alignItems: 'center', pr: 0.5, cursor: 'default' }}>
      <DragIcon fontSize="small" sx={{ color: 'text.disabled', cursor: 'grab' }} />
      <Stack>
        <Tooltip title="Subir fecha">
          <span>
            <IconButton size="small" sx={{ p: 0.25 }} aria-label="Subir fecha" disabled={index === 0} onClick={() => move(index, -1)}><UpIcon fontSize="small" /></IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bajar fecha">
          <span>
            <IconButton size="small" sx={{ p: 0.25 }} aria-label="Bajar fecha" disabled={index === ids.length - 1} onClick={() => move(index, 1)}><DownIcon fontSize="small" /></IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );

  return (
    <PanelCard sx={{ display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.1rem', xl: '2.6rem' } }}>Pistas</Typography>
          <Chip label={`${doneCount}/${ids.length} disputadas`} variant="outlined" />
        </Stack>
        {editMode && <Button variant="outlined" startIcon={<PlaylistAddIcon />} onClick={onAddTrack}>Agregar pista</Button>}
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 1, mb: 1.5, color: 'text.secondary' }}>
        <CheckeredFlag size={16} />
        <Typography variant="caption">
          ya se disputó · la marcada con borde de color es la que sigue{editMode ? ' · arrastrá o usá las flechas para reordenar' : ''}
        </Typography>
      </Stack>

      {/* En pantalla grande la tarjeta toma el alto de la tabla de posiciones y la lista se desplaza adentro. */}
      <Box sx={{ position: 'relative', flex: { md: '1 1 0' }, minHeight: { md: 280 } }}>
      <Box ref={listRef} sx={{ position: { xs: 'relative', md: 'absolute' }, inset: { md: 0 }, overflowY: { md: 'auto' }, pr: { md: 0.5 } }}>
        <SortableList ids={ids} onReorder={reorder} disabled={!editMode}>
          <Stack spacing={1.25}>
            {tournament.rounds.map((round, i) => {
              const card = (dragging) => (
                <TrackCard
                  round={round}
                  index={i}
                  status={statuses[round.id]}
                  onOpen={editMode && !dragging ? () => onOpenResults(round.id) : undefined}
                  controls={editMode ? controls(i) : undefined}
                />
              );
              return (
                <Box key={round.id} data-status={statuses[round.id]}>
                  {editMode ? (
                    <SortableItem id={round.id} sx={{ borderRadius: 2 }}>{({ dragging }) => card(dragging)}</SortableItem>
                  ) : (
                    card(false)
                  )}
                </Box>
              );
            })}
          </Stack>
        </SortableList>
      </Box>
      </Box>
    </PanelCard>
  );
}
