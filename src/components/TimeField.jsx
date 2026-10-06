import { useState } from 'react';
import { TextField } from '@mui/material';
import { formatLapTime, parseLapTime } from '../lib/laptime';
import { TIME_HINT, keepOutOfDrag, timeHintSx } from '../lib/timeInput';

// Campo de tiempo ("1:23.456"). Se confirma con Enter o al salir del campo; vacío = sin tiempo.
// `value` en ms (o null); `onCommit(ms | null)` se llama sólo cuando el tiempo cambia.
// Si el valor externo cambia, conviene remontarlo con `key` para que muestre el nuevo texto.
export default function TimeField({ value, onCommit, label, width }) {
  const [text, setText] = useState(value != null ? formatLapTime(value) : '');
  const [error, setError] = useState(false);

  const commit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(false);
      if (value != null) onCommit(null);
      return;
    }
    const ms = parseLapTime(trimmed);
    if (ms == null) return setError(true);
    setError(false);
    if (ms !== value) onCommit(ms);
    else setText(formatLapTime(ms));
  };

  return (
    <TextField
      size="small"
      value={text}
      error={error}
      helperText={error ? TIME_HINT : undefined}
      placeholder="1:23.456"
      {...keepOutOfDrag}
      onChange={(e) => { setText(e.target.value); setError(false); }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.querySelector('input')?.blur();
        }
      }}
      slotProps={{
        htmlInput: { 'aria-label': label, inputMode: 'decimal', style: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } },
        formHelperText: { sx: timeHintSx },
      }}
      sx={{ width: width ?? { xs: 100, sm: 118 }, flexShrink: 0, position: 'relative' }}
    />
  );
}
