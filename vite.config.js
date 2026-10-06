import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build funciona en cualquier subcarpeta o abriendo dist/ desde un hosting estático.
  base: './',
  // host: true escucha en todas las interfaces, así se accede desde otros dispositivos de la red local.
  // usePolling: en Windows el observador de archivos a veces se pierde cambios y sirve módulos viejos.
  server: { host: true, watch: { usePolling: true, interval: 300 } },
  build: {
    // Las banderas son SVG sueltos: evitamos que Vite los incruste como base64 dentro del JS.
    assetsInlineLimit: 0,
  },
});
