import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Tarjeta translúcida con un poco de desenfoque: deja ver el fondo sin perder legibilidad.
export default function PanelCard({ children, sx, ...rest }) {
  return (
    <Box
      component="section"
      {...rest}
      sx={(theme) => ({
        p: { xs: 2, md: 3 },
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.78),
        backdropFilter: 'blur(10px)',
        minWidth: 0,
        ...sx,
      })}
    >
      {children}
    </Box>
  );
}
