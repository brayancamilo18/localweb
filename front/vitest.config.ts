import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Evita doble instancia CJS/ESM de react-router con Node 22+ (vitest + react-router-dom).
  resolve: {
    conditions: ['module-sync', 'import', 'browser', 'default'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    pool: 'vmThreads',
    isolate: false,
    fileParallelism: false,
    server: {
      deps: {
        inline: ['react-router', 'react-router-dom'],
      },
    },
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: ['react-router', 'react-router-dom'],
        },
      },
    },
  },
})
