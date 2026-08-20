import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward every backend path so the browser sees same-origin requests.
      // Without this, the httpOnly JWT cookie is blocked by SameSite=Lax on
      // cross-site POSTs (localhost:5173 → localhost:8000 is cross-origin).
      '/auth':          { target: 'http://localhost:8000', changeOrigin: true },
      '/products':      { target: 'http://localhost:8000', changeOrigin: true },
      '/categories':    { target: 'http://localhost:8000', changeOrigin: true },
      '/orders':        { target: 'http://localhost:8000', changeOrigin: true },
      '/payments':      { target: 'http://localhost:8000', changeOrigin: true },
      '/cart':          { target: 'http://localhost:8000', changeOrigin: true },
      '/smart-search':  { target: 'http://localhost:8000', changeOrigin: true },
      '/api':           { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});