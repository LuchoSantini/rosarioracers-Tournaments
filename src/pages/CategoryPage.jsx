import { useMemo, useState } from 'react';
import { Link as RouterLink, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, IconButton, Stack, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import PrevIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import NextIcon from '@mui/icons-material/ArrowForwardIosRounded';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import TimerIcon from '@mui/icons-material/TimerOutlined';
import { isHotLap } from '../lib/tournament';
import { DISPLAY_FONT, makeTheme } from '../theme';
import { useCategories, useCategoryTournaments, useStore } from '../store/StoreContext';
import AppHeader from '../components/AppHeader';
import PageBackground from '../components/PageBackground';
import SiteFooter from '../components/SiteFooter';
import ActiveTournamentPanel from '../components/ActiveTournamentPanel';
import CreateTournamentDialog from '../components/CreateTournamentDialog';
import EmptyTournament from '../components/EmptyTournament';
import HistoryPanel from '../components/HistoryPanel';
import HotLapPanel from '../components/HotLapPanel';
import LiveDot from '../components/LiveDot';

function CategoryPageContent({ category }) {
  const { active, activeHotLap, history } = useCategoryTournaments(category.id);
  const { editMode } = useStore();
  const { categories } = useCategories();
  const [params, setParams] = useSearchParams();
  const [createType, setCreateType] = useState(null); // tipo de torneo que se está dando de alta (null = diálogo cerrado)

  // La página muestra un tipo de torneo por vez: campeonatos o Hot Laps (cada uno con su torneo en curso y su histórico).
  // El tipo queda en la URL (?v=hotlap) para poder recargar o compartir la vista.
  const view = params.get('v') === 'hotlap' ? 'hotlap' : 'championship';
  const setView = (next) => setParams(next === 'hotlap' ? { v: 'hotlap' } : {}, { replace: true });
  const viewHistory = useMemo(() => history.filter((t) => isHotLap(t) === (view === 'hotlap')), [history, view]);
  const viewSuffix = view === 'hotlap' ? '?v=hotlap' : '';

  const index = categories.findIndex((c) => c.id === category.id);
  const prev = categories[(index - 1 + categories.length) % categories.length];
  const next = categories[(index + 1) % categories.length];

  const toggleSx = { px: 2, gap: 1, fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' };

  return (
    <Box
      sx={{ position: 'relative', zIndex: 0, minHeight: '100vh' }}
    >
      <PageBackground accent={category.accent} />
      <AppHeader />

      <Box component="main" sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 2 }, maxWidth: 1760, mx: 'auto' }}>
        <Stack direction="row" useFlexGap spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5, mb: { xs: 1.5, md: 2 } }}>
          <Tooltip title="Todas las categorías">
            <IconButton component={RouterLink} to={`/?c=${category.slug}`} aria-label="Volver a las categorías" sx={{ border: 1, borderColor: 'divider' }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: DISPLAY_FONT, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase',
                fontSize: 'clamp(1.8rem, 3.4vw, 2.8rem)', lineHeight: 1,
              }}
            >
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700 }}>Torneo </Box>
              {category.name}
            </Typography>
            <Box sx={{ width: 100, height: 5, mt: 0.75, bgcolor: 'primary.main', transform: 'skewX(-24deg)' }} />
          </Box>
          {editMode && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateType(view)}>Nuevo torneo</Button>}
          <ToggleButtonGroup exclusive size="small" color="primary" value={view} onChange={(_, next) => next && setView(next)} aria-label="Tipo de torneo">
            <ToggleButton value="championship" sx={toggleSx}>
              <FlagIcon fontSize="small" />
              Campeonatos
              {active && <LiveDot size={8} />}
            </ToggleButton>
            <ToggleButton value="hotlap" sx={toggleSx}>
              <TimerIcon fontSize="small" />
              Hot Laps
              {activeHotLap && <LiveDot size={8} />}
            </ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1}>
            <Tooltip title={prev.name}>
              <IconButton component={RouterLink} to={`/categoria/${prev.slug}${viewSuffix}`} aria-label={`Ir a ${prev.name}`} sx={{ border: 1, borderColor: 'divider' }}>
                <PrevIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={next.name}>
              <IconButton component={RouterLink} to={`/categoria/${next.slug}${viewSuffix}`} aria-label={`Ir a ${next.name}`} sx={{ border: 1, borderColor: 'divider' }}>
                <NextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {view === 'championship' ? (
          // Tabla de posiciones (70%) a la izquierda y pistas (30%) a la derecha (se apilan en pantallas chicas).
          <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 3fr)' }, alignItems: 'stretch' }}>
            <ActiveTournamentPanel category={category} tournament={active} onCreate={setCreateType} />
          </Box>
        ) : activeHotLap ? (
          <HotLapPanel tournament={activeHotLap} />
        ) : (
          <Box sx={{ display: 'grid' }}>
            <EmptyTournament kind="hotlap" category={category} onCreate={setCreateType} />
          </Box>
        )}

        {/* Abajo del todo y a lo ancho: el histórico del tipo de torneo que se está viendo. */}
        <Box sx={{ mt: { xs: 2, md: 3 } }}>
          <HistoryPanel history={viewHistory} type={view} />
        </Box>
      </Box>

      <SiteFooter />

      <CreateTournamentDialog
        open={createType !== null}
        onClose={() => setCreateType(null)}
        category={category}
        lockCategory
        initialType={createType ?? view}
        onCreated={(tournament) => setView(isHotLap(tournament) ? 'hotlap' : 'championship')}
      />
    </Box>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { categoryBySlug } = useCategories();
  const category = categoryBySlug(slug);
  const theme = useMemo(() => makeTheme(category?.accent), [category?.accent]);

  if (!category) return <Navigate to="/" replace />;

  return (
    <ThemeProvider theme={theme}>
      <CategoryPageContent key={category.id} category={category} />
    </ThemeProvider>
  );
}
