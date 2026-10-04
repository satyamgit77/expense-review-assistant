import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // /api ki saari requests backend (port 5000) ko jayengi, CORS ka jhanjhat nahi
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});