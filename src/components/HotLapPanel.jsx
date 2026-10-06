import { useState } from 'react';
import {
  Box, Button, Chip, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import MoreIcon from '@mui/icons-material/MoreVert';
import SportsEsportsIcon from '@mui/icons-material/SportsEsportsOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { hotLapStandings } from '../lib/hotlap';
import { formatLapTime } from '../lib/laptime';
import { useStore } from '../store/StoreContext';
import { useConfirm } from './ConfirmProvider';
import EditTournamentDialog from './EditTournamentDialog';
import Flag from './Flag';
import HotLapBoard from './HotLapBoard';
import LiveDot from './LiveDot';
import StandingsImageButton from './StandingsImageButton';
import PanelCard from './PanelCard';

// Vista del Hot Lap en curso de una categoría: la pista y la tabla de mejores vueltas.
export default function HotLapPanel({ tournament }) {
  const { actions, editMode } = useStore();
  const confirm = useConfirm();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editing, setEditing] = useState(false);

  const track = tournament.rounds[0]?.track;
  const { rows, best, timedCount } = hotLapStandings(tournament);

  const finish = async () => {
    setMenuAnchor(null);
    const leader = rows[0];
    if (await confirm({
      title: 'Finalizar Hot Lap',
      message: `"${tournament.name}" pasa al histórico. Ganador: ${leader.participant.name} con ${formatLapTime(leader.time)}.`,
      confirmLabel: 'Finalizar torneo',
    })) actions.finishTournament(tournament.id);
  };

  const remove = async () => {
    setMenuAnchor(null);
    if (await confirm({ title: 'Eliminar torneo', message: `Se elimina "${tournament.name}" con todos sus tiempos. No se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) {
      actions.deleteTournament(tournament.id);
    }
  };

  return (
    <PanelCard component="section" aria-label="Hot Lap en curso">
      <Stack direction="row" spacing={2} useFlexGap sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>{tournament.name}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
            <LiveDot />
            <Typography variant="overline" sx={{ color: 'success.light' }}>Hot Lap en curso</Typography>
          </Stack>
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
            <Chip icon={<TimerIcon />} label="Hot Lap" color="primary" />
            <Chip icon={<SportsEsportsIcon />} label={tournament.game} variant="outlined" />
            {track && (
              <Chip
                variant="outlined"
                icon={<Flag code={track.countryCode} name={track.countryName} height={16} />}
                label={`${track.name} · ${track.countryName}`}
                sx={{ '& .MuiChip-icon': { ml: 1 } }}
              />
            )}
            <Chip label={`${timedCount} con tiempo`} variant="outlined" />
            {best != null && <Chip label={`Mejor: ${formatLapTime(best)}`} variant="outlined" />}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {timedCount > 0 && <StandingsImageButton tournament={tournament} />}
        {editMode && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" startIcon={<FlagIcon />} disabled={timedCount === 0} onClick={finish}>Finalizar</Button>
            <Tooltip title="Más opciones">
              <IconButton aria-label="Más opciones del Hot Lap" onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem onClick={() => { setMenuAnchor(null); setEditing(true); }}>
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Editar nombre y juego</ListItemText>
              </MenuItem>
              <MenuItem onClick={remove} sx={{ color: 'error.light' }}>
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Eliminar torneo</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        )}
        </Stack>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <HotLapBoard tournament={tournament} editable={editMode} />
      </Box>

      <EditTournamentDialog open={editing} onClose={() => setEditing(false)} tournament={tournament} />
    </PanelCard>
  );
}
