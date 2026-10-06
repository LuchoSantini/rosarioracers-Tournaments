import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import DragIcon from '@mui/icons-material/DragIndicator';
import DownIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import EditIcon from '@mui/icons-material/EditOutlined';
import OpenIcon from '@mui/icons-material/OpenInNewRounded';
import UpIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { DISPLAY_FONT } from '../theme';
import { useCategories, useStore } from '../store/StoreContext';
import AppHeader from '../components/AppHeader';
import CategoryDialog from '../components/CategoryDialog';
import { useConfirm } from '../components/ConfirmProvider';
import ManageTabs from '../components/ManageTabs';
import PageBackground from '../components/PageBackground';
import PanelCard from '../components/PanelCard';
import SortableList, { SortableItem } from '../components/SortableList';

// ABM de categorías: alta, modificación (nombre y color), baja y orden. El orden es el del carrusel de la pantalla
// principal. Al eliminar una categoría se eliminan también sus torneos, y siempre queda al menos una.
export default function CategoriesPage() {
  const { state, actions, editMode, isAdmin } = useStore();
  const { categories } = useCategories();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState(null); // null | 'new' | categoría que se edita

  const stats = useMemo(() => {
    const byCategory = new Map(categories.map((c) => [c.id, { total: 0, active: 0 }]));
    for (const t of state.tournaments) {
      const entry = byCategory.get(t.categoryId);
      if (!entry) continue;
      entry.total += 1;
      if (t.status === 'active') entry.active += 1;
    }
    return byCategory;
  }, [categories, state.tournaments]);

  const ids = categories.map((c) => c.id);
  const move = (index, delta) => {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    actions.reorderCategories(next);
  };

  const remove = async (category) => {
    const { total } = stats.get(category.id);
    const message = total > 0
      ? `Se elimina la categoría "${category.name}" junto con ${total === 1 ? 'su torneo' : `sus ${total} torneos`}, con todos sus participantes y resultados. No se puede deshacer.`
      : `Se elimina la categoría "${category.name}". No se puede deshacer.`;
    if (await confirm({ title: 'Eliminar categoría', message, confirmLabel: total > 0 ? `Eliminar categoría y ${total === 1 ? 'su torneo' : 'sus torneos'}` : 'Eliminar', danger: true })) {
      actions.deleteCategory(category.id);
    }
  };

  const row = (category, i, dragging = false) => {
    const { total, active } = stats.get(category.id);
    return (
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: dragging ? 'background.paper' : 'rgba(255,255,255,0.025)' }}
      >
        {editMode && <DragIcon fontSize="small" sx={{ color: 'text.disabled', cursor: 'grab' }} />}
        <Box sx={{ width: 10, alignSelf: 'stretch', minHeight: 44, borderRadius: 1, bgcolor: category.accent, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" component="h2" noWrap>{category.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            /categoria/{category.slug}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: '1.1rem' }}>
            {total} {total === 1 ? 'torneo' : 'torneos'}
          </Typography>
          <Typography variant="caption" color={active ? 'success.light' : 'text.secondary'}>
            {active ? `${active} en curso` : 'ninguno en curso'}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ alignItems: 'center', flexShrink: 0, cursor: 'default' }}>
          <Tooltip title="Abrir categoría">
            <IconButton size="small" component={RouterLink} to={`/categoria/${category.slug}`} aria-label={`Abrir ${category.name}`}><OpenIcon fontSize="small" /></IconButton>
          </Tooltip>
          {editMode && (
            <>
              <Tooltip title="Subir">
                <span><IconButton size="small" aria-label={`Subir ${category.name}`} disabled={i === 0} onClick={() => move(i, -1)}><UpIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Bajar">
                <span><IconButton size="small" aria-label={`Bajar ${category.name}`} disabled={i === categories.length - 1} onClick={() => move(i, 1)}><DownIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" aria-label={`Editar ${category.name}`} onClick={() => setDialog(category)}><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title={categories.length <= 1 ? 'Tiene que quedar al menos una categoría' : 'Eliminar'}>
                <span>
                  <IconButton size="small" color="error" aria-label={`Eliminar ${category.name}`} disabled={categories.length <= 1} onClick={() => remove(category)}><DeleteIcon fontSize="small" /></IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 0, minHeight: '100vh' }}>
      <PageBackground />
      <AppHeader />

      <Box component="main" sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, maxWidth: 1760, mx: 'auto' }}>
        <Stack direction="row" spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'center', mb: { xs: 2, md: 3 } }}>
          <Tooltip title="Inicio">
            <IconButton component={RouterLink} to="/" aria-label="Volver al inicio" sx={{ border: 1, borderColor: 'divider' }}><ArrowBackIcon /></IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h1" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase', fontSize: 'clamp(2.1rem, 5.2vw, 4.2rem)', lineHeight: 1 }}>
              Gestión de categorías
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
            </Typography>
          </Box>
          {editMode && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('new')}>Nueva categoría</Button>}
        </Stack>

        <ManageTabs />

        {!editMode && (
          <Alert severity="info" sx={{ mb: 2 }}>{isAdmin ? 'Activá el modo edición (arriba a la derecha) para crear, modificar, ordenar o eliminar categorías.' : 'Sólo el administrador puede crear, modificar, ordenar o eliminar categorías.'}</Alert>
        )}

        <PanelCard>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El orden de esta lista es el del carrusel de la pantalla principal{editMode ? ': arrastrá las categorías o usá las flechas para cambiarlo' : ''}.
          </Typography>
          <SortableList ids={ids} onReorder={actions.reorderCategories} disabled={!editMode}>
            <Stack spacing={1.25}>
              {categories.map((category, i) =>
                editMode ? (
                  <SortableItem key={category.id} id={category.id} sx={{ borderRadius: 2 }}>
                    {({ dragging }) => row(category, i, dragging)}
                  </SortableItem>
                ) : (
                  <Box key={category.id}>{row(category, i)}</Box>
                ),
              )}
            </Stack>
          </SortableList>
        </PanelCard>
      </Box>

      <CategoryDialog open={dialog !== null} onClose={() => setDialog(null)} category={dialog === 'new' ? null : dialog} />
    </Box>
  );
}
