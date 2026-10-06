import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { DISPLAY_FONT } from '../theme';

const LINKEDIN_URL = 'https://www.linkedin.com/in/luciano-santini-1242702a3/';

// Pie de página con el crédito del desarrollador y el enlace a su perfil de LinkedIn.
export default function SiteFooter({ compact = false }) {
  return (
    <Box component="footer" sx={{ position: 'relative', px: 2, pt: compact ? 0.25 : 3, pb: compact ? 0.5 : 3 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontFamily: DISPLAY_FONT, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.85rem' }}
        >
          Developed by <Box component="span" sx={{ color: 'text.primary' }}>Luciano Santini</Box>
        </Typography>
        <Tooltip title="LinkedIn de Luciano Santini">
          <IconButton
            component="a"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            aria-label="LinkedIn de Luciano Santini"
            sx={{ color: 'text.secondary', p: compact ? 0.25 : undefined, '&:hover': { color: '#4a9fe0' } }}
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
