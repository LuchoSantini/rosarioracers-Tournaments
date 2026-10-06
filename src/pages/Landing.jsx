import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import { Box, ButtonBase, IconButton, Stack, ThemeProvider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardIosRounded';
import EastIcon from '@mui/icons-material/EastRounded';
import TrophyIcon from '@mui/icons-material/EmojiEventsOutlined';
import { DISPLAY_FONT, makeTheme } from '../theme';
import { useCategories, useCategoryTournaments, useStore } from '../store/StoreContext';
import { podium } from '../lib/hotlap';
import { roundProgress } from '../lib/tournament';
import AppHeader from '../components/AppHeader';
import LiveDot from '../components/LiveDot';
import PageBackground from '../components/PageBackground';
import SiteFooter from '../components/SiteFooter';

const fromRight = keyframes`from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: none; }`;
const fromLeft = keyframes`from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: none; }`;

function CategoryTeaser({ category }) {
  const { active, activeHotLap, history } = useCategoryTournaments(category.id);
  const lastChampion = history[0] ? podium(history[0])[0]?.name : null;

  let progress = null;
  if (active) {
    const done = active.rounds.filter((r) => {
      const p = roundProgress(active, r);
      return p.done === p.total;
    }).length;
    progress = `${done}/${active.rounds.length} fechas`;
  }

  return (
    <Stack spacing={1} sx={{ alignItems: 'center', mt: { xs: 2, md: 3 }, minHeight: 56 }}>
      {active ? (
        <Stack direction="row" spacing={1.25} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <LiveDot />
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.14em', fontSize: '1.05rem', color: 'success.light' }}>EN CURSO</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1rem' }}>
            {active.game} · {active.participants.length} participantes · {progress}
          </Typography>
        </Stack>
      ) : (
        !activeHotLap && <Typography color="text.secondary">Sin torneo en curso</Typography>
      )}
      {activeHotLap && (
        <Stack direction="row" spacing={1.25} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <LiveDot />
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.14em', fontSize: '1.05rem', color: 'success.light' }}>HOT LAP</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1rem' }}>
            {activeHotLap.rounds[0]?.track.name ?? activeHotLap.name} · {activeHotLap.participants.length} participantes
          </Typography>
        </Stack>
      )}
      {lastChampion && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'primary.main' }}>
          <TrophyIcon sx={{ fontSize: 20 }} />
          <Typography sx={{ fontWeight: 600 }}>Último campeón: {lastChampion}</Typography>
        </Stack>
      )}
    </Stack>
  );
}

function ArrowButton({ direction, onClick }) {
  const Icon = direction === 'prev' ? ArrowBackIcon : ArrowForwardIcon;
  return (
    <IconButton
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Categoría anterior' : 'Categoría siguiente'}
      sx={{
        width: { xs: 44, md: 68 },
        height: { xs: 44, md: 68 },
        border: 2,
        borderColor: 'rgba(255,255,255,0.35)',
        color: 'text.primary',
        '&:hover': { bgcolor: 'primary.main', borderColor: 'primary.main', color: 'primary.contrastText' },
      }}
    >
      <Icon sx={{ fontSize: { xs: 20, md: 30 } }} />
    </IconButton>
  );
}

export default function Landing() {
  const [params, setParams] = useSearchParams();
  const { state } = useStore();
  const { categories } = useCategories();
  const [direction, setDirection] = useState(1);
  const touchStart = useRef(null);

  const index = Math.max(0, categories.findIndex((c) => c.slug === params.get('c')));
  const category = categories[index];
  const theme = useMemo(() => makeTheme(category.accent), [category.accent]);

  const goTo = useCallback(
    (next, dir) => {
      setDirection(dir);
      setParams({ c: categories[(next + categories.length) % categories.length].slug }, { replace: true });
    },
    [setParams, categories],
  );
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [role="dialog"]')) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
  };

  const accent = category.accent;

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{ position: 'relative', zIndex: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <PageBackground accent={accent} />
        <AppHeader variant="hero" />

        <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 1.5, md: 4 }, pb: { xs: 3, md: 2 } }}>
          <Box
            role="group"
            aria-roledescription="carrusel"
            aria-label="Categorías de torneos"
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={onTouchEnd}
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 1480,
              mx: 'auto',
              minHeight: { xs: 360, md: 'clamp(240px, calc(100vh - 540px), 600px)' },
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: { xs: 0.5, md: 2 },
              px: { xs: 1, md: 3 },
              border: 2,
              borderColor: alpha(accent, 0.55),
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'border-color 0.4s',
              background: `
                linear-gradient(115deg, ${alpha(accent, 0.2)} 0%, transparent 42%),
                rgba(11, 13, 18, 0.93)`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowButton direction="prev" onClick={prev} />

            <ButtonBase
              component={RouterLink}
              to={`/categoria/${category.slug}`}
              aria-label={`Entrar a ${category.name}`}
              sx={{ width: '100%', height: '100%', py: { xs: 3, md: 3 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
            >
              <Box key={category.id} sx={{ width: '100%', animation: `${direction > 0 ? fromRight : fromLeft} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)` }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Categoría {index + 1} de {categories.length}
                </Typography>
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 800,
                    fontStyle: 'italic',
                    textTransform: 'uppercase',
                    lineHeight: 0.92,
                    letterSpacing: '0.01em',
                    fontSize: 'clamp(2.9rem, 10vw, 8.5rem)',
                    textWrap: 'balance',
                    px: { xs: 0.5, md: 2 },
                  }}
                >
                  {category.name}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    mt: { xs: 2.5, md: 3 },
                    display: 'inline-flex', alignItems: 'center', gap: 1,
                    px: 3.5, py: 1.1, borderRadius: 1,
                    bgcolor: 'primary.main', color: 'primary.contrastText',
                    fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '1.15rem',
                  }}
                >
                  Entrar <EastIcon fontSize="small" />
                </Box>
              </Box>
            </ButtonBase>

            <ArrowButton direction="next" onClick={next} />
          </Box>

          <CategoryTeaser key={category.id} category={category} />

          <Stack direction="row" useFlexGap spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: { xs: 2, md: 3 } }} role="tablist" aria-label="Elegir categoría">
            {categories.map((c, i) => {
              const selected = i === index;
              const live = state.tournaments.some((t) => t.categoryId === c.id && t.status === 'active');
              return (
                <ButtonBase
                  key={c.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  sx={{
                    px: 1.75, py: 0.75, borderRadius: 99, gap: 0.75,
                    border: 1.5, borderColor: selected ? c.accent : 'divider',
                    bgcolor: selected ? alpha(c.accent, 0.16) : 'transparent',
                    color: selected ? 'text.primary' : 'text.secondary',
                    fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: c.accent, color: 'text.primary' },
                  }}
                >
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.accent }} />
                  {c.name}
                  {live && <Box component="span" aria-label="con torneo en curso" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />}
                </ButtonBase>
              );
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1.5, display: { xs: 'none', md: 'block' } }}>
            Usá las flechas ← → del teclado para cambiar de categoría
          </Typography>
        </Box>
        <SiteFooter />
      </Box>
    </ThemeProvider>
  );
}
