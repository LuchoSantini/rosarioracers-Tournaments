import { useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, IconButton, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import OpenIcon from '@mui/icons-material/OpenInNewRounded';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import { hotLapStandings, podium } from '../lib/hotlap';
import { activeOf, hasAnyResults, isHotLap, typeLabel } from '../lib/tournament';
import { DISPLAY_FONT } from '../theme';
import { useCategories, useStore } from '../store/StoreContext';
import AppHeader from '../components/AppHeader';
import { useConfirm } from '../components/ConfirmProvider';
import CreateTournamentDialog from '../components/CreateTournamentDialog';
import EditTournamentDialog from '../components/EditTournamentDialog';
import Flag from '../components/Flag';
import LiveDot from '../components/LiveDot';
import ManageTabs from '../components/ManageTabs';
import PageBackground from '../components/PageBackground';
import SiteFooter from '../components/SiteFooter';
import PanelCard from '../components/PanelCard';
import TournamentDetailDialog from '../components/TournamentDetailDialog';

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Todos' },
  { id: 'active', label: 'En curso' },
  { id: 'finished', label: 'Finalizados' },
];
const TYPE_FILTERS = [
  { id: 'ALL', label: 'Todos los tipos' },
  { id: 'championship', label: 'Campeonato' },
  { id: 'hotlap', label: 'Hot Lap' },
];

// Se puede finalizar si ya hay algo que decida un ganador.
const canFinish = (t) =>
  isHotLap(t) ? hotLapStandings(t).timedCount > 0 : t.participants.length > 0 && hasAnyResults(t);

function FilterChips({ options, value, onChange, label }) {
  return (
    <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }} role="group" aria-label={label}>
      {options.map((o) => (
        <Chip
          key={o.id}
          label={o.label}
          onClick={() => onChange(o.id)}
          color={value === o.id ? 'primary' : 'default'}
          variant={value === o.id ? 'filled' : 'outlined'}
        />
      ))}
    </Stack>
  );
}

// ABM de torneos: lista de todos los torneos (de cualquier categoría y tipo) con alta, modificación, baja,
// finalizar/reabrir y acceso al detalle. Sin modo edición sólo se puede consultar.
export default function TournamentsPage() {
  const [params, setParams] = useSearchParams();
  const { state, actions, editMode, isAdmin } = useStore();
  const { categories, categoryById, categoryBySlug } = useCategories();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const categoryFilter = categoryBySlug(params.get('c'))?.id ?? 'ALL';
  const setCategoryFilter = (id) => setParams(id === 'ALL' ? {} : { c: categoryById(id).slug }, { replace: true });

  const tournaments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.tournaments
      .filter(
        (t) =>
          (categoryFilter === 'ALL' || t.categoryId === categoryFilter) &&
          (typeFilter === 'ALL' || (isHotLap(t) ? 'hotlap' : 'championship') === typeFilter) &&
          (statusFilter === 'ALL' || t.status === statusFilter) &&
          (!q || `${t.name} ${t.game}`.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) ||
          (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt),
      );
  }, [state.tournaments, categoryFilter, typeFilter, statusFilter, query]);

  const editing = state.tournaments.find((t) => t.id === editingId) ?? null;
  const viewing = state.tournaments.find((t) => t.id === viewingId) ?? null;
  const activeCount = state.tournaments.filter((t) => t.status === 'active').length;

  const finish = async (t) => {
    const winner = podium(t)[0];
    if (await confirm({
      title: 'Finalizar torneo',
      message: `"${t.name}" pasa al histórico.${winner ? ` Ganador: ${winner.name} (${winner.label}).` : ''}`,
      confirmLabel: 'Finalizar torneo',
    })) actions.finishTournament(t.id);
  };

  const remove = async (t) => {
    if (await confirm({ title: 'Eliminar torneo', message: `Se elimina "${t.name}" con todos sus participantes y resultados. No se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) {
      actions.deleteTournament(t.id);
    }
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
              Gestión de torneos
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {state.tournaments.length} {state.tournaments.length === 1 ? 'torneo' : 'torneos'} · {activeCount} en curso
            </Typography>
          </Box>
          {editMode && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Nuevo torneo</Button>
          )}
        </Stack>

        <ManageTabs />

        {!editMode && (
          <Alert severity="info" sx={{ mb: 2 }}>{isAdmin ? 'Activá el modo edición (arriba a la derecha) para crear, modificar o eliminar torneos.' : 'Sólo el administrador puede crear, modificar o eliminar torneos.'}</Alert>
        )}

        <PanelCard>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre o juego"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ maxWidth: 420 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
            <FilterChips
              label="Categoría"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[{ id: 'ALL', label: 'Todas las categorías' }, ...categories.map((c) => ({ id: c.id, label: c.name }))]}
            />
            <Stack direction="row" useFlexGap spacing={3} sx={{ flexWrap: 'wrap' }}>
              <FilterChips label="Tipo" value={typeFilter} onChange={setTypeFilter} options={TYPE_FILTERS} />
              <FilterChips label="Estado" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
            </Stack>
          </Stack>

          {tournaments.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
              {state.tournaments.length === 0 ? 'Todavía no hay torneos.' : 'Ningún torneo coincide con los filtros.'}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small" aria-label="Torneos">
                <TableHead>
                  <TableRow>
                    <TableCell>Torneo</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Juego</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Particip.</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Pista / fechas</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Fecha</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tournaments.map((t) => {
                    const category = categoryById(t.categoryId) ?? { name: 'Sin categoría', slug: null, accent: '#6b7280' }; // dato huérfano de un respaldo viejo
                    const hotlap = isHotLap(t);
                    const track = t.rounds[0]?.track;
                    const running = activeOf(state.tournaments, t.categoryId, hotlap ? 'hotlap' : 'championship', t.id);
                    const active = t.status === 'active';
                    return (
                      <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: (theme) => alpha(theme.palette.common.white, 0.04) } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
                          <Chip
                            size="small"
                            color={hotlap ? 'primary' : 'default'}
                            variant={hotlap ? 'filled' : 'outlined'}
                            icon={hotlap ? <TimerIcon /> : undefined}
                            label={typeLabel(t)}
                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: 14 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <Box component="span" sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: category.accent, flexShrink: 0 }} />
                            <span>{category.name}</span>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t.game}</TableCell>
                        <TableCell>
                          {active ? (
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'success.light' }}>
                              <LiveDot size={8} /><span>En curso</span>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Finalizado</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t.participants.length}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {hotlap && track ? (
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Flag code={track.countryCode} name={track.countryName} height={16} />
                              <span>{track.name}</span>
                            </Stack>
                          ) : (
                            `${t.rounds.length} ${t.rounds.length === 1 ? 'fecha' : 'fechas'}`
                          )}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>
                          {active ? `Desde ${formatDate(t.createdAt)}` : formatDate(t.finishedAt)}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" aria-label={`Ver ${t.name}`} onClick={() => setViewingId(t.id)}><VisibilityIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          {category.slug && (
                            <Tooltip title="Abrir en la categoría">
                              <IconButton size="small" component={RouterLink} to={`/categoria/${category.slug}${hotlap ? '?v=hotlap' : ''}`} aria-label={`Abrir ${category.name}`}><OpenIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {editMode && (
                            <>
                              <Tooltip title="Editar">
                                <IconButton size="small" aria-label={`Editar ${t.name}`} onClick={() => setEditingId(t.id)}><EditIcon fontSize="small" /></IconButton>
                              </Tooltip>
                              {active ? (
                                <Tooltip title={canFinish(t) ? 'Finalizar' : 'Todavía no hay resultados para finalizarlo'}>
                                  <span>
                                    <IconButton size="small" aria-label={`Finalizar ${t.name}`} disabled={!canFinish(t)} onClick={() => finish(t)}><FlagIcon fontSize="small" /></IconButton>
                                  </span>
                                </Tooltip>
                              ) : (
                                <Tooltip title={running ? `Ya hay un ${typeLabel(t)} en curso en ${category.name}` : 'Reabrir'}>
                                  <span>
                                    <IconButton size="small" aria-label={`Reabrir ${t.name}`} disabled={Boolean(running)} onClick={() => actions.reopenTournament(t.id)}><ReplayIcon fontSize="small" /></IconButton>
                                  </span>
                                </Tooltip>
                              )}
                              <Tooltip title="Eliminar">
                                <IconButton size="small" color="error" aria-label={`Eliminar ${t.name}`} onClick={() => remove(t)}><DeleteIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PanelCard>
      </Box>

      <SiteFooter />

      <CreateTournamentDialog open={createOpen} onClose={() => setCreateOpen(false)} category={categoryFilter === 'ALL' ? null : categoryById(categoryFilter)} />
      {editing && <EditTournamentDialog open onClose={() => setEditingId(null)} tournament={editing} />}
      <TournamentDetailDialog tournament={viewing} onClose={() => setViewingId(null)} />
    </Box>
  );
}
