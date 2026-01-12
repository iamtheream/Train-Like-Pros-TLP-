import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Updated base to match your GitHub repository name
  base: '/Train-Like-Pros-TLP-/', 
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});