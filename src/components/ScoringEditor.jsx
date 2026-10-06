import { useState } from 'react';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/RestartAltRounded';
import { F1_SCORING, cloneScoring, parsePoints, pointsForPosition } from '../lib/scoring';
import { DISPLAY_FONT } from '../theme';

const PREVIEW_POSITIONS = 14;

function RuleRow({ label, rule, onChange }) {
  const [pointsText, setPointsText] = useState(rule.points.join(', '));
  const [stepText, setStepText] = useState(String(rule.step));

  const emit = (nextPoints, nextStep) =>
    onChange({ points: parsePoints(nextPoints), step: Math.max(0, Number(nextStep) || 0) });

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>{label}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label="Puntos de las primeras posiciones"
          value={pointsText}
          onChange={(e) => { setPointsText(e.target.value); emit(e.target.value, stepText); }}
          helperText="Separados por coma: P1, P2, P3…"
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          type="number"
          label="Resta por posición"
          value={stepText}
          onChange={(e) => { setStepText(e.target.value); emit(pointsText, e.target.value); }}
          helperText="Después de la lista"
          slotProps={{ htmlInput: { min: 0 } }}
          sx={{ width: { sm: 170 } }}
        />
      </Stack>
      <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
        {Array.from({ length: PREVIEW_POSITIONS }, (_, i) => (
          <Chip
            key={i}
            size="small"
            variant="outlined"
            label={<><span style={{ opacity: 0.6 }}>P{i + 1}</span>&nbsp;<b style={{ fontFamily: DISPLAY_FONT, fontSize: '1.05em' }}>{pointsForPosition(rule, i + 1)}</b></>}
          />
        ))}
      </Stack>
    </Box>
  );
}

// Editor del sistema de puntos de un torneo (cada torneo puede tener el suyo).
export default function ScoringEditor({ value, onChange }) {
  const [resetKey, setResetKey] = useState(0);

  const setRule = (key, rule) => onChange({ ...value, [key]: rule });

  const restore = () => {
    onChange(cloneScoring(F1_SCORING));
    setResetKey((k) => k + 1);
  };

  return (
    <Stack spacing={2} key={resetKey}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 560 }}>
          Los puntos de cada fecha se suman: Clasificación 1 + Clasificación 2 (A o B) + Final (A o B). La tabla general es la suma de todas las fechas.
        </Typography>
        <Button size="small" startIcon={<RestoreIcon />} onClick={restore}>Restablecer a F1</Button>
      </Stack>
      <RuleRow label="Clasificación 1" rule={value.q1} onChange={(r) => setRule('q1', r)} />
      <RuleRow label="Clasificación 2 A y Clasificación 2 B" rule={value.q2} onChange={(r) => setRule('q2', r)} />
      <RuleRow label="Final A y Final B" rule={value.finalA} onChange={(r) => setRule('finalA', r)} />
      <Typography color="text.secondary" variant="body2">
        La Clasificación 2 B da los mismos puntos que la A (el P1 de la B suma lo mismo que el P1 de la A). En la Final B los puestos se cuentan P1, P2, P3…, pero suman los puntos que siguen al último de la Final A: si en la A corren 7, el P1 de la B suma los puntos del 8º, el P2 los del 9º, y así.
      </Typography>
    </Stack>
  );
}
