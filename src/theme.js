import { createTheme } from '@mui/material/styles';

export const BRAND_YELLOW = '#ffcc01';
// Colores de oro, plata y bronce para el podio.
export const MEDALS = { 1: '#ffd24a', 2: '#c9cfd8', 3: '#d98e5b' };
// Violeta de la fecha perfecta: primero en la Clasificación 1, en la Clasificación 2 y en la Final A.
export const PERFECT_COLOR = '#a855f7';
export const DISPLAY_FONT = '"Barlow Condensed", "Arial Narrow", sans-serif';
const BODY_FONT = '"Barlow", system-ui, -apple-system, "Segoe UI", sans-serif';

// Barras de scroll de toda la app: finas, oscuras y con el color de acento de la categoría
// (PageBackground define --scroll-accent; sin él se usa el amarillo RRC).
const THUMB = 'color-mix(in srgb, var(--scroll-accent, #ffcc01) 38%, transparent)';
const THUMB_HOVER = 'color-mix(in srgb, var(--scroll-accent, #ffcc01) 75%, transparent)';
const scrollbars = {
  '*::-webkit-scrollbar': { width: 10, height: 10 },
  '*::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.035)', borderRadius: 8 },
  '*::-webkit-scrollbar-thumb': { background: THUMB, borderRadius: 8, border: '2px solid transparent', backgroundClip: 'content-box' },
  '*::-webkit-scrollbar-thumb:hover': { background: THUMB_HOVER, backgroundClip: 'content-box' },
  '*::-webkit-scrollbar-corner': { background: 'transparent' },
  // Firefox no soporta ::-webkit-scrollbar; en Chrome las propiedades estándar anularían lo de arriba, por eso van aparte.
  '@supports (-moz-appearance: none)': {
    '*': { scrollbarWidth: 'thin', scrollbarColor: `${THUMB} transparent` },
  },
};

const display = { fontFamily: DISPLAY_FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' };

// `accent` es el color de la categoría; sin parámetro se usa el amarillo del logo.
export function makeTheme(accent = BRAND_YELLOW) {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: { main: accent },
      background: { default: '#07080b', paper: '#101217' },
      text: { primary: '#f4f5f7', secondary: '#9ba1ad' },
      divider: 'rgba(255,255,255,0.1)',
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: BODY_FONT,
      h1: { ...display, lineHeight: 1 },
      h2: { ...display, lineHeight: 1 },
      h3: { ...display, lineHeight: 1.05 },
      h4: { ...display, lineHeight: 1.1 },
      h5: { ...display, lineHeight: 1.1 },
      h6: { ...display, lineHeight: 1.15 },
      overline: { fontFamily: DISPLAY_FONT, fontWeight: 600, letterSpacing: '0.18em', lineHeight: 1.4 },
      button: { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.08em', fontSize: '1rem' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ...scrollbars,
          body: { minHeight: '100vh', overflowX: 'hidden' },
          '@media (prefers-reduced-motion: reduce)': { '*': { animationDuration: '0.01ms !important' } },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiDialog: { defaultProps: { fullWidth: true } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: 'rgba(255,255,255,0.07)' },
          head: { fontFamily: DISPLAY_FONT, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ba1ad' },
        },
      },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  });
}
