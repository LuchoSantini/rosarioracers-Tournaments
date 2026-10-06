import { useEffect, useState } from 'react';

// ¿El navegador está en pantalla completa (F11 o API de fullscreen)? `display-mode: fullscreen` lo cubre en los navegadores
// que lo soportan; de respaldo se compara la ventana con la pantalla.
const detect = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: fullscreen)').matches || document.fullscreenElement) return true;
  return window.innerWidth >= window.screen.width - 2 && window.innerHeight >= window.screen.height - 2;
};

export default function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(detect);

  useEffect(() => {
    const update = () => setFullscreen(detect());
    const media = window.matchMedia?.('(display-mode: fullscreen)');
    window.addEventListener('resize', update);
    document.addEventListener('fullscreenchange', update);
    media?.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('fullscreenchange', update);
      media?.removeEventListener?.('change', update);
    };
  }, []);

  return fullscreen;
}
