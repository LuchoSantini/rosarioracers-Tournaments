import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack,
  Switch, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { GAMES } from '../data/games';
import { cloneScoring } from '../lib/scoring';
import { activeOf, isHotLap, typeLabel } from '../lib/tournament';
import { useCategories, useStore } from '../store/StoreContext';
import ScoringEditor from './ScoringEditor';

// Modifica nombre, juego y categoría de un torneo; en los campeonatos también el sistema de puntos
// (la tabla se recalcula con el nuevo sistema). El tipo y la pista no se cambian: para eso se crea otro torneo.
export default function EditTournamentDialog({ open, onClose, tournament }) {
  const { state, actions } = useStore();
  const { categories } = useCategories();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [name, setName] = useState('');
  const [game, setGame] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [scoring, setScoring] = useState(null);
  const [ballast, setBallast] = useState(false);

  const hotlap = isHotLap(tournament);

  useEffect(() => {
    if (!open) return;
    setName(tournament.name);
    setGame(tournament.game);
    setCategoryId(tournament.categoryId);
    setScoring(cloneScoring(tournament.scoring));
    setBallast(Boolean(tournament.ballast));
  }, [open, tournament]);

  // Un torneo en curso no puede pasar a una categoría que ya tiene otro en curso del mismo tipo.
  const clash =
    tournament.status === 'active' && categoryId !== tournament.categoryId
      ? activeOf(state.tournaments, categoryId, hotlap ? 'hotlap' : 'championship', tournament.id)
      : null;

  const save = () => {
    const patch = { name: name.trim(), game: game.trim(), categoryId };
    if (!hotlap) {
      patch.scoring = scoring;
      patch.ballast = ballast;
    }
    actions.updateTournament(tournament.id, patch);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <span>Editar torneo</span>
          <Chip size="small" variant="outlined" label={typeLabel(tournament)} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        {scoring && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="Nombre del torneo" value={name} onChange={(e) => setName(e.target.value)} />
            <Autocomplete
              freeSolo
              options={GAMES}
              inputValue={game}
              onInputChange={(_, text) => setGame(text)}
              renderInput={(params) => <TextField {...params} label="Juego" />}
            />
            <TextField select label="Categoría" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            {clash && (
              <Alert severity="warning">
                Esa categoría ya tiene un {typeLabel(tournament)} en curso ("{clash.name}"). Finalizalo antes de mover este torneo.
              </Alert>
            )}
            {!hotlap && (
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Switch checked={ballast} onChange={(e) => setBallast(e.target.checked)} sx={{ mr: 1 }} />}
                label={
                  <>
                    <Typography sx={{ fontWeight: 600 }}>Se corre con lastre</Typography>
                    <Typography variant="caption" color="text.secondary">
                      El lastre es por fecha. Si lo desactivás, el lastre ya cargado se conserva pero deja de mostrarse.
                    </Typography>
                  </>
                }
              />
            )}
            {!hotlap && (
              <>
                <Typography variant="h5" sx={{ pt: 1 }}>Sistema de puntos</Typography>
                <ScoringEditor value={scoring} onChange={setScoring} />
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!name.trim() || !game.trim() || Boolean(clash)} onClick={save}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
