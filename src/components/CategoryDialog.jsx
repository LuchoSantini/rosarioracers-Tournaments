import { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { ACCENT_PALETTE, isHexColor, uniqueSlug } from '../data/categories';
import { uid } from '../lib/tournament';
import { useCategories, useStore } from '../store/StoreContext';

const normalize = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

// Alta (category = null) y modificación de una categoría: nombre y color. El slug (la URL) se genera al crearla
// y no cambia al renombrar, para no romper enlaces.
export default function CategoryDialog({ open, onClose, category = null }) {
  const { actions } = useStore();
  const { categories } = useCategories();
  const [name, setName] = useState('');
  const [accent, setAccent] = useState(ACCENT_PALETTE[0]);
  const [hex, setHex] = useState(ACCENT_PALETTE[0]);

  useEffect(() => {
    if (!open) return;
    const initial = category?.accent ?? ACCENT_PALETTE[categories.length % ACCENT_PALETTE.length];
    setName(category?.name ?? '');
    setAccent(initial);
    setHex(initial);
  }, [open, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmed = name.trim();
  const duplicated = categories.some((c) => c.id !== category?.id && normalize(c.name) === normalize(trimmed));
  const valid = Boolean(trimmed) && !duplicated && isHexColor(accent);

  const pick = (color) => {
    setAccent(color);
    setHex(color);
  };

  const changeHex = (value) => {
    const text = value.startsWith('#') ? value : `#${value}`;
    setHex(text);
    if (isHexColor(text)) setAccent(text.toLowerCase());
  };

  const save = () => {
    if (!valid) return;
    if (category) actions.updateCategory(category.id, { name: trimmed, accent });
    else actions.createCategory({ id: uid(), slug: uniqueSlug(trimmed, categories.map((c) => c.slug)), name: trimmed, accent });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Nombre"
            value={name}
            error={duplicated}
            helperText={duplicated ? 'Ya existe una categoría con ese nombre' : ' '}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />

          <Box>
            <Typography variant="overline" color="text.secondary">Color</Typography>
            <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
              {ACCENT_PALETTE.map((color) => (
                <ButtonBase
                  key={color}
                  aria-label={`Color ${color}`}
                  aria-pressed={accent.toLowerCase() === color}
                  onClick={() => pick(color)}
                  sx={{
                    width: 34, height: 34, borderRadius: '50%', bgcolor: color, color: '#000',
                    outline: accent.toLowerCase() === color ? '2px solid #fff' : '2px solid transparent', outlineOffset: 2,
                  }}
                >
                  {accent.toLowerCase() === color && <CheckIcon fontSize="small" />}
                </ButtonBase>
              ))}
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.5 }}>
              <Box
                component="input"
                type="color"
                aria-label="Elegir otro color"
                value={isHexColor(accent) ? accent : '#ffffff'}
                onChange={(e) => pick(e.target.value)}
                sx={{ width: 44, height: 40, p: 0, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', cursor: 'pointer' }}
              />
              <TextField size="small" label="Código" value={hex} onChange={(e) => changeHex(e.target.value)} error={!isHexColor(hex)} helperText={isHexColor(hex) ? ' ' : 'Formato #RRGGBB'} sx={{ width: 140 }} />
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">Vista previa</Typography>
            <Chip label={trimmed || 'Categoría'} sx={{ bgcolor: isHexColor(accent) ? accent : 'grey.700', color: '#000', fontWeight: 700 }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!valid} onClick={save}>{category ? 'Guardar' : 'Crear categoría'}</Button>
      </DialogActions>
    </Dialog>
  );
}
