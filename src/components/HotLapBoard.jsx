import { useMemo, useRef, useState } from 'react';
import {
  Autocomplete, Box, Button, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { hotLapStandings } from '../lib/hotlap';
import { formatGap, formatLapTime, parseLapTime } from '../lib/laptime';
import { TIME_HINT, timeHintSx } from '../lib/timeInput';
import { DISPLAY_FONT, MEDALS } from '../theme';
import { useStore } from '../store/StoreContext';
import { useConfirm } from './ConfirmProvider';
import PositionBadge from './PositionBadge';
import TimeField from './TimeField';

// Alta rápida de una vuelta: nombre (de la lista o uno nuevo) + tiempo + Enter. Si el participante ya tenía
// un tiempo, se conserva el mejor.
function LapEntry({ tournament }) {
  const { actions } = useStore();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const nameInput = useRef(null);

  const submit = () => {
    const trimmed = name.trim();
    const ms = parseLapTime(time);
    if (!trimmed) return setError('Escribí el nombre del participante');
    if (ms == null) return setError(`Tiempo inválido. ${TIME_HINT}`);

    const existing = tournament.participants.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    const previous = existing ? tournament.rounds[0]?.laps?.[existing.id] : null;
    actions.recordLap(tournament.id, trimmed, ms);

    if (previous != null && ms >= previous) setNotice(`${existing.name} ya tenía un mejor tiempo (${formatLapTime(previous)}): se conservó.`);
    else if (previous != null) setNotice(`${existing.name} mejoró su tiempo: ${formatLapTime(previous)} → ${formatLapTime(ms)}.`);
    else setNotice('');
    setError('');
    setName('');
    setTime('');
    setTimeout(() => nameInput.current?.focus(), 30);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignItems: { sm: 'flex-start' } }}>
        <Autocomplete
          freeSolo
          size="small"
          options={tournament.participants.map((p) => p.name)}
          inputValue={name}
          onInputChange={(_, text) => { setName(text); setError(''); }}
          sx={{ flex: 1, minWidth: 0 }}
          renderInput={(params) => <TextField {...params} inputRef={nameInput} label="Participante" placeholder="Nombre" />}
        />
        <TextField
          size="small"
          label="Tiempo"
          placeholder="1:23.456"
          value={time}
          error={Boolean(error) && /inválido/.test(error)}
          onChange={(e) => { setTime(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          slotProps={{ htmlInput: { inputMode: 'decimal', style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }, formHelperText: { sx: timeHintSx } }}
          sx={{ width: { xs: '100%', sm: 150 }, position: 'relative' }}
        />
        <Button variant="contained" startIcon={<TimerIcon />} onClick={submit} sx={{ height: 40, flexShrink: 0 }}>Registrar vuelta</Button>
      </Stack>
      <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ display: 'block', mt: 0.75, minHeight: 20 }}>
        {error || notice || 'Si el participante ya tiene un tiempo, se conserva el mejor. Para corregirlo, editá el tiempo en la tabla.'}
      </Typography>
    </Box>
  );
}

// Tabla de mejores vueltas de un Hot Lap. `editable` agrega el alta de vueltas, la edición de tiempos y quitar participantes.
export default function HotLapBoard({ tournament, editable = false }) {
  const { actions } = useStore();
  const confirm = useConfirm();
  const { rows, best } = useMemo(() => hotLapStandings(tournament), [tournament]);

  const remove = async (participant) => {
    if (await confirm({ title: 'Quitar participante', message: `Se quita a ${participant.name} del torneo junto con su tiempo.`, confirmLabel: 'Quitar', danger: true })) {
      actions.removeParticipant(tournament.id, participant.id);
    }
  };

  return (
    <Box>
      {editable && <LapEntry tournament={tournament} />}

      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Todavía no hay vueltas registradas.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small" aria-label="Mejores vueltas">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>Pos</TableCell>
                <TableCell>Participante</TableCell>
                <TableCell align="right">Mejor tiempo</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Dif. líder</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Dif. anterior</TableCell>
                {editable && <TableCell sx={{ width: 48 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const leader = row.position === 1;
                const medal = MEDALS[row.position];
                return (
                  <TableRow
                    key={row.participant.id}
                    sx={(theme) => ({ bgcolor: leader ? alpha(MEDALS[1], 0.07) : undefined, boxShadow: medal ? `inset 3px 0 0 ${medal}` : undefined, '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.04) } })}
                  >
                    <TableCell>{row.position ? <PositionBadge position={row.position} /> : <Typography color="text.disabled" sx={{ pl: 1.25 }}>–</Typography>}</TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600, fontSize: '1.02rem' }}>{row.participant.name}</Typography></TableCell>
                    <TableCell align="right">
                      {editable ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <TimeField key={`${row.participant.id}:${row.time ?? ''}`} value={row.time} label={`Tiempo de ${row.participant.name}`} onCommit={(ms) => actions.setLap(tournament.id, row.participant.id, ms)} />
                        </Box>
                      ) : (
                        <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: '1.4rem', fontVariantNumeric: 'tabular-nums', color: leader ? MEDALS[1] : row.time == null ? 'text.disabled' : 'text.primary' }}>
                          {row.time == null ? '—' : formatLapTime(row.time)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {row.time == null ? '' : leader ? 'Mejor' : formatGap(row.gapToLeader)}
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' }, fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {row.time == null || leader ? '' : formatGap(row.gapToPrevious)}
                    </TableCell>
                    {editable && (
                      <TableCell align="right">
                        <Tooltip title="Quitar del torneo">
                          <IconButton size="small" aria-label={`Quitar a ${row.participant.name}`} onClick={() => remove(row.participant)}><CloseIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {best != null && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Récord del torneo: {formatLapTime(best)} · {rows[0].participant.name}
        </Typography>
      )}
    </Box>
  );
}
