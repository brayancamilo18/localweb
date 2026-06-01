import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

/** Sirve front/public/landing/index.html en /landing (sin pasar por el SPA React). */
function landingRoutePlugin(): Plugin {
  let root = ''

  function serveLanding(
    req: { url?: string },
    res: { setHeader: (k: string, v: string) => void; statusCode: number; end: (b?: string) => void },
    next: () => void,
  ) {
    const pathOnly = (req.url ?? '').split('?')[0]
    if (pathOnly !== '/landing' && pathOnly !== '/landing/') return next()

    const file = path.join(root, 'public/landing/index.html')
    if (!fs.existsSync(file)) return next()

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(fs.readFileSync(file, 'utf8'))
  }

  return {
    name: 'landing-route',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use(serveLanding)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveLanding)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), landingRoutePlugin()],
  server: {
    proxy: {
      // El dev server corre dentro del contenedor "front": usar DNS del servicio Docker.
      '/api': 'http://nginx',
    },
  },
})
