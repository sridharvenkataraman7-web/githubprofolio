// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for a React + Three.js project
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // opens browser automatically
  },
  build: {
    outDir: 'dist',
  },
})
