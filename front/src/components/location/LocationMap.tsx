import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  lat: number | null
  lng: number | null
  /** Zoom inicial al situar el pin */
  zoom?: number
  className?: string
  /** Altura del contenedor del mapa */
  height?: number | string
}

const FALLBACK_CENTER: [number, number] = [40.4168, -3.7038]

/** Pin SVG propio: evita el problema de las imágenes por defecto de Leaflet con bundlers. */
function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'lw-location-pin',
    html: `
      <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17 0C7.6 0 0 7.5 0 16.7 0 29.2 17 44 17 44s17-14.8 17-27.3C34 7.5 26.4 0 17 0z" fill="#E55A3C"/>
        <circle cx="17" cy="16.7" r="6.2" fill="#fff"/>
      </svg>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
  })
}

/**
 * Mapa de solo lectura con el marcador del negocio. Usa los mismos tiles de OSM
 * que las plantillas públicas para que el pin coincida visualmente con la web.
 */
export function LocationMap({ lat, lng, zoom = 16, className, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
    if (!hasCoords) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    const position: [number, number] = [lat as number, lng as number]

    if (markerRef.current) {
      markerRef.current.setLatLng(position)
    } else {
      markerRef.current = L.marker(position, { icon: pinIcon() }).addTo(map)
    }

    map.setView(position, zoom)
    // El contenedor puede haberse renderizado oculto/sin tamaño; recalculamos.
    setTimeout(() => map.invalidateSize(), 0)
  }, [lat, lng, zoom])

  return <div ref={containerRef} className={className} style={{ height, width: '100%' }} />
}
