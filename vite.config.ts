import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths required for Capacitor Android (file:// assets)
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
