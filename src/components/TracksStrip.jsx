import { useMemo } from 'react';
import { Box } from '@mui/material';
import { roundStatuses } from '../lib/tournament';
import TrackCard from './TrackCard';

// Fechas de un torneo en grilla, sólo lectura (se usa en el detalle del histórico).
export default function TracksStrip({ tournament }) {
  const statuses = useMemo(() => roundStatuses(tournament), [tournament]);

  return (
    <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {tournament.rounds.map((round, i) => (
        <TrackCard key={round.id} round={round} index={i} status={statuses[round.id]} />
      ))}
    </Box>
  );
}
