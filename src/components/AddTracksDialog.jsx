import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useStore } from '../store/StoreContext';
import TrackPicker from './TrackPicker';

// Suma fechas (pistas) a un torneo ya creado.
export default function AddTracksDialog({ open, onClose, tournament }) {
  const { actions } = useStore();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (open) setTracks([]);
  }, [open]);

  const submit = () => {
    actions.addRounds(tournament.id, tracks);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>Agregar pistas</DialogTitle>
      <DialogContent>
        <TrackPicker value={tracks} onChange={setTracks} lockedIds={tournament.rounds.map((r) => r.track.id)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={tracks.length === 0} onClick={submit}>
          Agregar {tracks.length > 0 ? `(${tracks.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
