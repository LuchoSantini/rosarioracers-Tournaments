import { useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, ListItemText, Menu,
  MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import MoreIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SportsEsportsIcon from '@mui/icons-material/SportsEsportsOutlined';
import ScoreboardIcon from '@mui/icons-material/ScoreboardOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutlined';
import { computeStandings } from '../lib/standings';
import { hasAnyResults, roundProgress } from '../lib/tournament';
import { useStore } from '../store/StoreContext';
import { useConfirm } from './ConfirmProvider';
import EmptyTournament from './EmptyTournament';
import StandingsImageButton from './StandingsImageButton';
import PanelCard from './PanelCard';
import LiveDot from './LiveDot';
import StandingsTable from './StandingsTable';
import TracksPanel from './TracksPanel';
import ParticipantAdder from './ParticipantAdder';
import ResultsDialog from './ResultsDialog';
import AddTracksDialog from './AddTracksDialog';
import EditTournamentDialog from './EditTournamentDialog';

function RenameDialog({ participant, tournament, onClose }) {
  const { actions } = useStore();
  const [name, setName] = useState(participant?.name ?? '');
  const trimmed = name.trim();
  const clash = tournament.participants.some((p) => p.id !== participant?.id && p.name.toLowerCase() === trimmed.toLowerCase());

  const save = () => {
    if (!trimmed || clash) return;
    actions.renameParticipant(tournament.id, participant.id, trimmed);
    onClose();
  };

  return (
    <Dialog open={Boolean(participant)} onClose={onClose} maxWidth="xs">
      <DialogTitle>Cambiar nombre</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus fullWidth margin="dense" label="Nombre" value={name}
          error={clash} helperText={clash ? 'Ya hay alguien con ese nombre' : ' '}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!trimmed || clash} onClick={save}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Campeonato en curso de la categoría: tabla de posiciones a la izquierda y pistas a la derecha.
// Sin campeonato muestra un aviso con las opciones para crear uno (`onCreate(tipo)` abre el alta de torneos).
export default function ActiveTournamentPanel({ category, tournament, onCreate }) {
  const { actions, editMode } = useStore();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState(null); // 'results' | 'tracks' | 'edit'
  const [focusRound, setFocusRound] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [renaming, setRenaming] = useState(null);

  const closeDialog = () => setDialog(null);
  const openResults = (roundId = null) => { setFocusRound(roundId); setDialog('results'); };

  if (!tournament) return <EmptyTournament kind="championship" category={category} onCreate={onCreate} />;

  const completedRounds = tournament.rounds.filter((r) => {
    const p = roundProgress(tournament, r);
    return p.done === p.total;
  }).length;

  const finish = async () => {
    setMenuAnchor(null);
    const leader = computeStandings(tournament)[0];
    const confirmed = await confirm({
      title: 'Finalizar torneo',
      message: `"${tournament.name}" pasa al histórico. Campeón: ${leader.participant.name} con ${leader.total} puntos.${completedRounds < tournament.rounds.length ? ` Todavía hay ${tournament.rounds.length - completedRounds} fecha(s) sin completar.` : ''}`,
      confirmLabel: 'Finalizar torneo',
    });
    if (confirmed) actions.finishTournament(tournament.id);
  };

  const remove = async () => {
    setMenuAnchor(null);
    if (await confirm({ title: 'Eliminar torneo', message: `Se elimina "${tournament.name}" con todos sus participantes y resultados. No se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) {
      actions.deleteTournament(tournament.id);
    }
  };

  const removeParticipant = async (participant) => {
    const hasResults = tournament.rounds.some((r) => Object.values(r.results).some((order) => order.includes(participant.id)));
    if (!hasResults || (await confirm({ title: 'Quitar participante', message: `${participant.name} ya tiene resultados cargados; al quitarlo se pierden sus puntos.`, confirmLabel: 'Quitar', danger: true }))) {
      actions.removeParticipant(tournament.id, participant.id);
    }
  };

  const canFinish = tournament.participants.length > 0 && hasAnyResults(tournament);

  return (
    <>
    <PanelCard>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }} useFlexGap>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>{tournament.name}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
            <LiveDot />
            <Typography variant="overline" sx={{ color: 'success.light' }}>Torneo en curso</Typography>
          </Stack>
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
            <Chip icon={<SportsEsportsIcon />} label={tournament.game} variant="outlined" />
            <Chip label={`${tournament.participants.length} participantes`} variant="outlined" />
            <Chip
              icon={completedRounds === tournament.rounds.length ? <CheckIcon /> : undefined}
              label={`${completedRounds}/${tournament.rounds.length} fechas completas`}
              variant="outlined"
            />
          </Stack>
        </Box>

        {editMode && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<ScoreboardIcon />} onClick={() => openResults()}>Cargar resultados</Button>
            <Tooltip title="Más opciones">
              <IconButton aria-label="Más opciones del torneo" onClick={(e) => setMenuAnchor(e.currentTarget)}><MoreIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem onClick={() => { setMenuAnchor(null); setDialog('edit'); }}>
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Editar nombre, juego y puntos</ListItemText>
              </MenuItem>
              <MenuItem onClick={finish} disabled={!canFinish}>
                <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Finalizar torneo</ListItemText>
              </MenuItem>
              <MenuItem onClick={remove} sx={{ color: 'error.light' }}>
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Eliminar torneo</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" sx={{ mt: 3.5, mb: 1.25, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography variant="h5" component="h3">Tabla de posiciones</Typography>
          {tournament.participants.length > 0 && <StandingsImageButton tournament={tournament} size="small" />}
        </Stack>
        {tournament.participants.length > 0 && (
          <Typography variant="caption" color="text.secondary">Tocá un participante para ver sus puntos por fecha</Typography>
        )}
      </Stack>
      {editMode && <Box sx={{ mb: 1 }}><ParticipantAdder tournament={tournament} /></Box>}
      <StandingsTable
        tournament={tournament}
        onRename={editMode ? setRenaming : undefined}
        onRemove={editMode ? removeParticipant : undefined}
      />

    </PanelCard>

    <TracksPanel tournament={tournament} onOpenResults={openResults} onAddTrack={() => setDialog('tracks')} />

    <ResultsDialog open={dialog === 'results'} onClose={closeDialog} tournament={tournament} initialRoundId={focusRound} />
    <AddTracksDialog open={dialog === 'tracks'} onClose={closeDialog} tournament={tournament} />
    <EditTournamentDialog open={dialog === 'edit'} onClose={closeDialog} tournament={tournament} />
    <RenameDialog key={renaming?.id ?? 'none'} participant={renaming} tournament={tournament} onClose={() => setRenaming(null)} />
    </>
  );
}
