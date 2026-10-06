import { useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Checkbox, Chip, Collapse, InputAdornment, List, ListItemButton, ListItemText,
  Stack, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { TRACK_CATALOG, TRACK_FILTERS } from '../data/tracks';
import { COUNTRIES } from '../data/countries';
import { uid } from '../lib/tournament';
import Flag from './Flag';

const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const toTrack = ({ id, name, location, countryCode, countryName }) => ({ id, name, location, countryCode, countryName });

// Elegir pistas del catálogo (Argentina / EEUU / F1 / resto del mundo) o crear una propia.
// `value` son las pistas elegidas (en orden de fecha); `lockedIds` son pistas que el torneo ya tiene.
// Con `single` (Hot Lap) se elige una sola pista: elegir otra reemplaza a la anterior.
export default function TrackPicker({ value, onChange, lockedIds = [], single = false }) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCountry, setCustomCountry] = useState('');

  const selectedIds = useMemo(() => new Set(value.map((t) => t.id)), [value]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return TRACK_CATALOG.filter(
      (t) =>
        (filter === 'ALL' || t.groups.includes(filter)) &&
        (!q || normalize(`${t.name} ${t.location} ${t.countryName}`).includes(q)),
    );
  }, [filter, query]);

  const toggle = (track) => {
    if (selectedIds.has(track.id)) onChange(value.filter((t) => t.id !== track.id));
    else onChange(single ? [toTrack(track)] : [...value, toTrack(track)]);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const typed = customCountry.trim();
    const country = COUNTRIES.find((c) => normalize(c.name) === normalize(typed));
    const custom = {
      id: `custom-${uid()}`,
      name,
      location: '',
      countryCode: country?.code ?? null,
      countryName: country?.name ?? (typed || 'Sin país'),
    };
    onChange(single ? [custom] : [...value, custom]);
    setCustomName('');
    setCustomCountry('');
    setCustomOpen(false);
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          {single ? 'Pista elegida' : `Pistas elegidas (${value.length}) — cada una es una fecha del torneo, en este orden`}
        </Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 0.5, minHeight: 36 }}>
          {value.length === 0 && <Typography color="text.secondary" variant="body2">Todavía no elegiste ninguna.</Typography>}
          {value.map((track, i) => (
            <Chip
              key={track.id}
              onDelete={() => onChange(value.filter((t) => t.id !== track.id))}
              icon={<Flag code={track.countryCode} name={track.countryName} height={16} />}
              label={single ? track.name : `${i + 1}. ${track.name}`}
              sx={{ '& .MuiChip-icon': { ml: 1 } }}
            />
          ))}
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
        <TextField
          size="small"
          placeholder="Buscar pista, ciudad o país"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }}>
          {TRACK_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              onClick={() => setFilter(f.id)}
              color={filter === f.id ? 'primary' : 'default'}
              variant={filter === f.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Stack>

      <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
        {visible.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2 }}>No hay pistas que coincidan. Podés agregar una propia abajo.</Typography>
        )}
        {visible.map((track) => {
          const locked = lockedIds.includes(track.id);
          const checked = locked || selectedIds.has(track.id);
          return (
            <ListItemButton key={track.id} disabled={locked} onClick={() => toggle(track)} sx={{ gap: 1.25 }}>
              <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple size="small" />
              <Flag code={track.countryCode} name={track.countryName} height={20} />
              <ListItemText
                primary={track.name}
                secondary={`${track.location} · ${track.countryName}${locked ? ' · ya está en el torneo' : ''}`}
                slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setCustomOpen((o) => !o)}>
          Agregar una pista que no está en la lista
        </Button>
        <Collapse in={customOpen}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField size="small" label="Nombre de la pista" value={customName} onChange={(e) => setCustomName(e.target.value)} sx={{ flex: 1 }} />
            <Autocomplete
              freeSolo
              size="small"
              options={COUNTRIES.map((c) => c.name)}
              inputValue={customCountry}
              onInputChange={(_, text) => setCustomCountry(text)}
              sx={{ flex: 1 }}
              renderInput={(params) => <TextField {...params} label="País" helperText="Sin bandera se muestran las 3 primeras letras" />}
            />
            <Box>
              <Button variant="outlined" onClick={addCustom} disabled={!customName.trim()}>Agregar</Button>
            </Box>
          </Stack>
        </Collapse>
      </Box>
    </Stack>
  );
}
