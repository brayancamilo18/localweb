import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = join(root, 'public/templates/graphite-soft.html')
const contactJs = readFileSync(join(root, 'public/templates/lw-contact-links.js'), 'utf8')
const html = readFileSync(htmlPath, 'utf8')

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = req.url || '/'
      if (url.includes('lw-contact-links.js')) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' })
        res.end(contactJs)
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const EMPTY = {
  services: [],
  galeria: [],
  google_business_url: '',
  map_lat: null,
  map_lon: null,
  is_pro: false,
}

const FULL = {
  nombre: 'Boutique Test',
  tagline: 'Tagline editorial',
  descripcion: 'Descripción about',
  ciudad: 'Madrid',
  telefono: '+34900111222',
  correo: 'hola@test.com',
  whatsapp: '34900111222',
  direccion: 'Calle Test 1',
  portada: 'https://example.com/p1.jpg',
  portada_2: 'https://example.com/p2.jpg',
  portada_3: 'https://example.com/p3.jpg',
  foto_equipo: 'https://example.com/team.jpg',
  services: [
    { name: 'Servicio A', price: 25, description: 'Desc A' },
    { name: 'Servicio B', price: null, description: '' },
    { name: 'Servicio C', price: 40, description: 'Desc C' },
    { name: 'Servicio D', price: 15, description: 'Desc D' },
  ],
  galeria: Array.from({ length: 6 }, (_, i) => `https://example.com/g${i + 1}.jpg`),
  google_business_url: 'https://g.page/test',
  map_lat: 40.42,
  map_lon: -3.7,
  vcard_enabled: true,
  vcard_download_url: 'https://example.com/card.vcf',
  is_pro: false,
  horario: {
    mon: { open: '10:00', close: '20:00', closed: false },
    tue: { open: '10:00', close: '20:00', closed: false },
    wed: { open: '10:00', close: '20:00', closed: false },
    thu: { open: '10:00', close: '20:00', closed: false },
    fri: { open: '10:00', close: '21:00', closed: false },
    sat: { open: '11:00', close: '21:00', closed: false },
    sun: { closed: true },
  },
}

async function evalInPage(page, payload) {
  return page.evaluate((data) => {
    applyLivePreviewData(data, {})
    const vis = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return false
      return !el.classList.contains('is-hidden') && el.style.display !== 'none'
    }
    const navVis = (id) => {
      const el = document.getElementById(id)
      if (!el) return false
      return el.style.display !== 'none'
    }
    return {
      skipLeaflet: window.__LW_SKIP_LEAFLET === true,
      hasLeafletMap: typeof window.L !== 'undefined' && Boolean(document.querySelector('.leaflet-container')),
      servicios: vis('#servicios'),
      galeria: vis('#galeria'),
      opiniones: vis('#opiniones'),
      mapa: vis('#mapaSection'),
      navServicios: navVis('tplNavServicios'),
      navGaleria: navVis('tplNavGaleria'),
      navOpiniones: navVis('tplNavOpiniones'),
      branding: (() => {
        const b = document.getElementById('tpl-platform-branding')
        return b ? b.style.display !== 'none' : false
      })(),
      galleryOverflowX: getComputedStyle(document.getElementById('galleryTrack')).overflowX,
      galleryScrollSnap: getComputedStyle(document.getElementById('galleryTrack')).scrollSnapType,
      heroSlots: ['hp1', 'hp2', 'hp3'].filter((id) => !document.getElementById(id).classList.contains('is-hidden')).length,
      svcCount: document.querySelectorAll('#tplServicesList .svc-row').length,
      galCount: document.querySelectorAll('#galleryTrack .gi').length,
      vcard: !document.getElementById('tplVcardWrap').classList.contains('is-hidden'),
      tagline: document.getElementById('heroTagline').textContent,
    }
  }, payload)
}

const server = await startServer()
const port = server.address().port
const origin = `http://127.0.0.1:${port}`
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage()

  await page.goto(`${origin}/?thumb=1&parentOrigin=${encodeURIComponent(origin)}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const thumb = await page.evaluate(() => ({
    skip: window.__LW_SKIP_LEAFLET === true,
    hasMap: Boolean(document.querySelector('.leaflet-container')),
  }))
  assert(thumb.skip, 'thumb=1 debe setear __LW_SKIP_LEAFLET')
  assert(!thumb.hasMap, 'thumb=1 no debe inicializar Leaflet')

  await page.goto(`${origin}/?parentOrigin=${encodeURIComponent(origin)}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(200)
  const empty = await evalInPage(page, EMPTY)
  assert(!empty.servicios, 'servicios oculto con payload vacío')
  assert(!empty.galeria, 'galería oculta con payload vacío')
  assert(!empty.opiniones, 'opiniones ocultas sin google_business_url')
  assert(!empty.mapa, 'mapa oculto sin coords')
  assert(!empty.navServicios, 'nav servicios oculto')
  assert(!empty.navGaleria, 'nav galería oculto')
  assert(!empty.navOpiniones, 'nav opiniones oculto')

  const full = await evalInPage(page, FULL)
  assert(full.servicios && full.svcCount === 4, '4 servicios renderizados')
  assert(full.galeria && full.galCount === 6, '6 fotos galería')
  assert(full.opiniones, 'opiniones visibles con google url')
  assert(full.heroSlots === 3, '3 portadas visibles')
  assert(full.vcard, 'vcard visible')
  assert(full.branding, 'branding ONEZ visible con is_pro=false')
  assert(full.tagline === 'Tagline editorial', 'tagline aplicado')
  assert(full.galleryOverflowX === 'auto', 'galería overflow-x auto')
  assert(full.galleryScrollSnap.includes('mandatory'), 'galería scroll-snap mandatory')

  const pro = await evalInPage(page, { ...FULL, is_pro: true })
  assert(!pro.branding, 'branding oculto con is_pro=true')

  console.log('VERIFY OK: thumb, empty payload, full payload, pro branding, gallery native scroll')
} finally {
  await browser.close()
  server.close()
}
