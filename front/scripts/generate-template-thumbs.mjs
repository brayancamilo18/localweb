/**
 * Genera capturas estáticas (webp) del hero de cada plantilla.
 *
 * Por qué: las miniaturas en vivo (iframe con el HTML completo de cada plantilla)
 * saturan la memoria del navegador móvil y crashean la pestaña. Una imagen estática
 * pesa una fracción y permite mostrar todas las plantillas sin riesgo.
 *
 * Uso:  npm run thumbs
 * Salida: front/public/templates/thumbs/{slug}.webp  (1280x760)
 *
 * Requiere: playwright (chromium) y sharp como devDependencies.
 * Tras editar una plantilla, vuelve a ejecutar este script para regenerar su captura.
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '../public')
const TEMPLATES_DIR = path.join(PUBLIC_DIR, 'templates')
const OUT_DIR = path.join(TEMPLATES_DIR, 'thumbs')

const DOC_W = 1280
const DOC_H = 760
const WEBP_QUALITY = 80

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.vcf': 'text/vcard',
}

/** Servidor estático mínimo rooteado en front/public para que `/templates/...` resuelva. */
function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
        let filePath = path.join(PUBLIC_DIR, urlPath)
        if (!filePath.startsWith(PUBLIC_DIR)) {
          res.statusCode = 403
          return res.end('Forbidden')
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html')
        }
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          return res.end('Not found')
        }
        res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream')
        res.end(fs.readFileSync(filePath))
      } catch (err) {
        res.statusCode = 500
        res.end(String(err))
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, port })
    })
  })
}

function templateSlugs() {
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replace(/\.html$/i, ''))
    .sort()
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const slugs = templateSlugs()
  const { server, port } = await startStaticServer()
  const base = `http://127.0.0.1:${port}`
  console.log(`Servidor estático en ${base} · ${slugs.length} plantillas`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: DOC_W, height: DOC_H },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })

  let ok = 0
  for (const slug of slugs) {
    const page = await context.newPage()
    const url = `${base}/templates/${slug}.html?v=5&embed=1&preview=1&landingDemo=1`
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 })
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await page.evaluate(() => document.fonts?.ready).catch(() => {})
      // Margen para que el hero termine de pintar (imágenes Unsplash / animaciones de entrada).
      await page.waitForTimeout(1800)
      const png = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: DOC_W, height: DOC_H },
      })
      const out = path.join(OUT_DIR, `${slug}.webp`)
      await sharp(png).webp({ quality: WEBP_QUALITY }).toFile(out)
      const kb = (fs.statSync(out).size / 1024).toFixed(0)
      console.log(`  ✓ ${slug}.webp (${kb} KB)`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  server.close()
  console.log(`\nListo: ${ok}/${slugs.length} capturas en ${path.relative(process.cwd(), OUT_DIR)}`)
  if (ok < slugs.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
