import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT and BASE_PATH are required in Replit dev but optional at build time (Vercel etc.)
const port     = Number(process.env.PORT ?? 3000);
const basePath = process.env.BASE_PATH ?? '/';
const isReplit = !!process.env.REPL_ID;
const isDev    = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Replit-only plugins — skipped in external CI/CD environments
    ...(isReplit && isDev
      ? [
          await import('@replit/vite-plugin-runtime-error-modal').then((m) => m.default()),
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, '..') })
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: false },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
