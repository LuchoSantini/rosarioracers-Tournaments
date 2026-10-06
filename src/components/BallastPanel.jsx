import { useMemo } from 'react';
import { Box, Button, InputAdornment, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AutoFixIcon from '@mui/icons-material/AutoFixHighOutlined';
import { computeStandings } from '../lib/standings';
import { MAX_BALLAST } from '../lib/tournament';
import { DISPLAY_FONT } from '../theme';
import { useStore } from '../store/StoreContext';

// Propuesta habitual: kilos de lastre para los tres primeros de la tabla antes de la fecha.
const PODIUM_BALLAST = [20, 15, 10];

// Carga del lastre de una fecha: kilos por participante (cualquiera puede llevar). Se guarda al instante.
export default function BallastPanel({ tournament, round, roundIndex }) {
  const { actions } = useStore();
  const ballast = round.ballast ?? {};

  // Tabla con las fechas anteriores a esta: de ahí sale el podio para la propuesta.
  const podium = useMemo(() => {
    const before = computeStandings({ ...tournament, rounds: tournament.rounds.slice(0, roundIndex) });
    return before.some((row) => row.total > 0) ? before.slice(0, PODIUM_BALLAST.length) : [];
  }, [tournament, roundIndex]);

  const suggest = () => {
    actions.replaceBallast(tournament.id, round.id, Object.fromEntries(podium.map((row, i) => [row.participant.id, PODIUM_BALLAST[i]])));
  };

  const assigned = Object.keys(ballast).length;
  const total = Object.values(ballast).reduce((sum, kg) => sum + kg, 0);

  const change = (id, text) => {
    const digits = text.replace(/\D/g, '').slice(0, String(MAX_BALLAST).length);
    actions.setBallast(tournament.id, round.id, id, digits === '' ? null : Number(digits));
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
      <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
          Lastre de esta fecha · {assigned === 0 ? 'sin lastre asignado' : `${assigned} con lastre · ${total} kg en total`}
        </Typography>
        <Tooltip title={podium.length === 0 ? 'Disponible cuando hay puntos en las fechas anteriores' : `${podium.map((row, i) => `${row.participant.name} ${PODIUM_BALLAST[i]} kg`).join(' · ')}`}>
          <span>
            <Button size="small" startIcon={<AutoFixIcon />} disabled={podium.length === 0} onClick={suggest}>
              {PODIUM_BALLAST.join(' · ')} kg al podio de la tabla
            </Button>
          </span>
        </Tooltip>
        <Button size="small" color="inherit" disabled={assigned === 0} onClick={() => actions.replaceBallast(tournament.id, round.id, {})}>Vaciar</Button>
      </Stack>

      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {tournament.participants.map((p) => {
          const kg = ballast[p.id];
          return (
            <Stack
              key={p.id}
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', px: 1.5, py: 0.75, borderRadius: 2, border: 1, borderColor: kg ? 'primary.main' : 'divider', bgcolor: 'background.paper' }}
            >
              <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600 }} noWrap>{p.name}</Typography>
              <TextField
                size="small"
                value={kg ?? ''}
                placeholder="0"
                onChange={(e) => change(p.id, e.target.value)}
                onFocus={(e) => e.target.select()}
                slotProps={{
                  htmlInput: { 'aria-label': `Lastre de ${p.name}`, inputMode: 'numeric', style: { textAlign: 'right', fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: '1.1rem' } },
                  input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> },
                }}
                sx={{ width: 118, flexShrink: 0 }}
              />
            </Stack>
          );
        })}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        El lastre es por fecha y se puede asignar a cualquier participante. Dejá el campo vacío para quitarlo.
      </Typography>
    </Box>
  );
}
