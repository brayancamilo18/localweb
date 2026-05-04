import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // El dev server corre dentro del contenedor "front": usar DNS del servicio Docker.
      '/api': 'http://nginx',
    },
  },
})
