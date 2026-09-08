import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    strictPort: true,
    host: true,
  },
  base: './',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-state': ['zustand', 'clsx', 'tailwind-merge'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage'],
          'vendor-media': ['canvas-confetti', 'lucide-react'],
        },
      },
    },
  },
});
