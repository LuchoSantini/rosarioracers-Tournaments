import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem,
  Stack, Step, StepLabel, Stepper, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { GAMES } from '../data/games';
import { F1_SCORING, cloneScoring } from '../lib/scoring';
import { TOURNAMENT_TYPES, activeOf, createTournament } from '../lib/tournament';
import { useCategories, useStore } from '../store/StoreContext';
import TrackPicker from './TrackPicker';
import ScoringEditor from './ScoringEditor';

const STEPS = {
  championship: ['Juego', 'Pistas', 'Puntos'],
  hotlap: ['Juego', 'Pista'],
};

const defaultName = (type, category) => `${type === 'hotlap' ? 'Hot Lap' : 'Torneo'} ${category.name} ${new Date().getFullYear()}`;

// Alta de torneo: tipo y juego → pistas (una sola en Hot Lap) → sistema de puntos (sólo campeonatos).
// Si recibe `category` y `lockCategory` la categoría queda fija; si no, se elige en el primer paso.
export default function CreateTournamentDialog({ open, onClose, onCreated, category = null, lockCategory = false, initialType = 'championship' }) {
  const { state, actions } = useStore();
  const { categories, categoryById } = useCategories();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(category?.id ?? categories[0].id);
  const [type, setType] = useState(initialType);
  const [game, setGame] = useState('');
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [scoring, setScoring] = useState(() => cloneScoring(F1_SCORING));
  const [ballast, setBallast] = useState(false);

  const selectedCategory = categoryById(categoryId);
  const steps = STEPS[type];
  const typeLabel = TOURNAMENT_TYPES.find((t) => t.id === type).label;
  const running = activeOf(state.tournaments, categoryId, type); // ya hay uno del mismo tipo en curso

  useEffect(() => {
    if (!open) return;
    const initialCategory = category ?? categories[0];
    setStep(0);
    setCategoryId(initialCategory.id);
    setType(initialType);
    setGame('');
    setName(defaultName(initialType, initialCategory));
    setNameEdited(false);
    setTracks([]);
    setScoring(cloneScoring(F1_SCORING));
    setBallast(false);
  }, [open, category, initialType]);

  // Mientras no se escriba un nombre propio, el sugerido sigue a la categoría y al tipo elegidos.
  const changeCategory = (id) => {
    setCategoryId(id);
    if (!nameEdited) setName(defaultName(type, categoryById(id)));
  };
  const changeType = (next) => {
    if (!next) return;
    setType(next);
    if (next === 'hotlap') setTracks((current) => current.slice(0, 1));
    if (!nameEdited) setName(defaultName(next, selectedCategory));
    setStep(0);
  };

  const canContinue = step === 0 ? game.trim() && name.trim() && !running : step === 1 ? tracks.length > 0 : true;

  const submit = () => {
    const tournament = createTournament({ categoryId, name: name.trim(), game: game.trim(), tracks, scoring, type, ballast });
    actions.createTournament(tournament);
    onCreated?.(tournament);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <span>Nuevo torneo</span>
          <Chip label={selectedCategory.name} sx={{ bgcolor: selectedCategory.accent, color: '#000', fontWeight: 700 }} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ my: 2 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">Tipo de torneo</Typography>
              <ToggleButtonGroup exclusive fullWidth value={type} onChange={(_, next) => changeType(next)} color="primary" sx={{ mt: 0.5 }}>
                {TOURNAMENT_TYPES.map((t) => (
                  <ToggleButton key={t.id} value={t.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', py: 1.25, px: 2, textTransform: 'none' }}>
                    <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.label}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'inherit', opacity: 0.8 }}>{t.description}</Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {!lockCategory && (
              <TextField select label="Categoría" value={categoryId} onChange={(e) => changeCategory(e.target.value)}>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            )}

            {running && (
              <Alert severity="warning">
                Ya hay un {typeLabel} en curso en {selectedCategory.name} ("{running.name}"). Finalizalo o eliminalo para crear otro del mismo tipo.
              </Alert>
            )}

            <Autocomplete
              freeSolo
              options={GAMES}
              inputValue={game}
              onInputChange={(_, text) => setGame(text)}
              renderInput={(params) => <TextField {...params} label="Juego" autoFocus required helperText="Elegí uno de la lista o escribí otro" />}
            />
            <TextField label="Nombre del torneo" value={name} onChange={(e) => { setName(e.target.value); setNameEdited(true); }} required />
            {type === 'championship' && (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, px: 2, py: 0.5 }}>
                <FormControlLabel
                  sx={{ m: 0, width: '100%', alignItems: 'flex-start', py: 0.75 }}
                  control={<Switch checked={ballast} onChange={(e) => setBallast(e.target.checked)} sx={{ mr: 1 }} />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>Se corre con lastre</Typography>
                      <Typography variant="caption" color="text.secondary">
                        El lastre es por fecha: antes de cada carrera se asignan los kilos a quien corresponda, a cualquier participante.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              {type === 'hotlap'
                ? 'Después elegís la pista. Se ordena por la mejor vuelta de cada participante.'
                : 'Después elegís las pistas y el sistema de puntos. Cada pista es una fecha (Clasificación 1, Clasificación 2 A y B, Final A y Final B), así que un torneo anual es simplemente uno con todas las fechas del año; el orden se puede cambiar después.'}
            </Typography>
          </Stack>
        )}

        {step === 1 && <TrackPicker value={tracks} onChange={setTracks} single={type === 'hotlap'} />}

        {step === 2 && (
          <Box>
            <ScoringEditor value={scoring} onChange={setScoring} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button color="inherit" onClick={() => setStep(step - 1)}>Atrás</Button>}
        {step < steps.length - 1 ? (
          <Button variant="contained" disabled={!canContinue} onClick={() => setStep(step + 1)}>Siguiente</Button>
        ) : (
          <Button variant="contained" disabled={!canContinue} onClick={submit}>Crear torneo</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
