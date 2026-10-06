import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';

const pulse = keyframes`0%, 100% { opacity: 1; } 50% { opacity: 0.35; }`;

export default function LiveDot({ color = 'success.main', size = 10 }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ width: size, height: size, borderRadius: '50%', bgcolor: color, display: 'inline-block', flexShrink: 0, animation: `${pulse} 1.6s ease-in-out infinite` }}
    />
  );
}
