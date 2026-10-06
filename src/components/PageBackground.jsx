import { Box, GlobalStyles } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BRAND_YELLOW } from '../theme';

const logoUrl = `${import.meta.env.BASE_URL}logo-rrc.png`;
const circuitUrl = `${import.meta.env.BASE_URL}spa-layout-blanco.png`;

// Fondo fijo de toda la app: degradé suave teñido con el color de la categoría, líneas de velocidad,
// el layout de Spa-Francorchamps (public/spa-layout-blanco.png), una cinta de cuadros en la esquina y el logo RRC grande y difuminado.
// Va detrás del contenido (z-index -1): el contenedor que lo usa necesita `position: relative; z-index: 0`.
export default function PageBackground({ accent = BRAND_YELLOW }) {
  return (
    <>
    <GlobalStyles styles={{ ':root': { '--scroll-accent': accent } }} />
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: `
          radial-gradient(1000px 560px at 10% -5%, ${alpha(accent, 0.2)}, transparent 70%),
          radial-gradient(900px 640px at 100% 100%, ${alpha(BRAND_YELLOW, 0.11)}, transparent 70%),
          linear-gradient(160deg, #0c0e13 0%, #07080b 55%, #0d0b05 100%)`,
      }}
    >
      {/* Líneas de velocidad */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 30px)',
          maskImage: 'linear-gradient(to bottom, #000 0%, transparent 90%)',
        }}
      />

      {/* Layout de Spa-Francorchamps (PNG blanco con transparencia), abajo a la izquierda */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: '-18vw', md: '-3vw' },
          bottom: { xs: '4vh', md: '-2vh' },
          width: { xs: '120vw', md: 'min(68vw, 980px)' },
          aspectRatio: '2400 / 1533',
          backgroundImage: `url(${circuitUrl})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12,
          maskImage: 'linear-gradient(to top right, #000 35%, transparent 100%)',
        }}
      />

      {/* Cinta de cuadros que se desvanece desde la esquina inferior izquierda */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 'min(46vw, 460px)',
          aspectRatio: '1',
          opacity: 0.07,
          background: 'repeating-conic-gradient(#fff 0 25%, transparent 0 50%) 0 0 / 40px 40px',
          maskImage: 'radial-gradient(circle at 0% 100%, #000 0%, transparent 70%)',
        }}
      />

      {/* Logo grande, difuminado: "screen" hace desaparecer el negro del PNG y deja sólo el amarillo */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: { xs: '-38vw', md: '-10vw' },
          width: { xs: '130vw', md: 'min(74vw, 1000px)' },
          aspectRatio: '1',
          transform: 'translateY(-50%)',
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: 'cover',
          mixBlendMode: 'screen',
          opacity: 0.15,
          filter: 'blur(5px)',
          maskImage: 'radial-gradient(closest-side, #000 55%, transparent 100%)',
        }}
      />

      {/* Viñeta para que los bordes no distraigan */}
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
    </Box>
    </>
  );
}
