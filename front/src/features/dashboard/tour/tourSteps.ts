import type { TourStep } from './types'

/**
 * Contenido final del tour: 10 secciones del dashboard.
 *
 * Rutas: coinciden con las definidas en `src/App.tsx`
 *   /dashboard, /dashboard/editor, /dashboard/location, /dashboard/diseno,
 *   /dashboard/brand-color, /dashboard/images, /dashboard/schedule,
 *   /dashboard/services, /dashboard/enlaces, /dashboard/stats, /dashboard/account
 *
 * Anclas desktop: `data-tour="<id>"` se añade a los NavLink del sidebar
 *   en `features/dashboard/dashboard.tsx`.
 * Anclas móvil:  `data-tour="<id>-main"` se añade a una card visible del
 *   contenido principal de cada sección. El TourRunner las usa como
 *   fallback porque en móvil el sidebar está oculto.
 *
 * El paso 0 móvil ("Toca aquí para ver el menú") se maneja dentro de
 * TourRunner y NO está en este array para que los índices coincidan 1:1
 * con los items del sidebar.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'mi-pagina',
    route: '/dashboard',
    anchorSelector: '[data-tour="mi-pagina"]',
    anchorSelectorMobile: '[data-tour="mi-pagina-main"]',
    icon: 'home',
    title: 'Mi página',
    description: 'Aquí ves cómo va tu web y compartes el enlace o el QR al instante.',
    microcopy: 'Pega el QR en el escaparate o en el mostrador del local.',
    side: 'right',
  },
  {
    id: 'editor',
    route: '/dashboard/editor',
    anchorSelector: '[data-tour="editor"]',
    anchorSelectorMobile: '[data-tour="editor-main"]',
    icon: 'edit',
    title: 'Editar',
    description: 'Cambia el nombre, la descripción, el teléfono y la plantilla visual de tu página.',
    side: 'right',
  },
  {
    id: 'ubicacion',
    route: '/dashboard/location',
    anchorSelector: '[data-tour="ubicacion"]',
    anchorSelectorMobile: '[data-tour="ubicacion-main"]',
    icon: 'pin',
    title: 'Ubicación',
    description:
      'Indica país, ciudad y dirección. El mapa de tu web se actualiza con el pin en el sitio exacto.',
    microcopy: 'Incluye el número de portal para que el marcador caiga donde toca.',
    side: 'right',
  },
  {
    id: 'diseno',
    route: '/dashboard/diseno',
    anchorSelector: '[data-tour="diseno"]',
    anchorSelectorMobile: '[data-tour="diseno-main"]',
    icon: 'layout',
    title: 'Diseño',
    description: 'Elige entre más de 10 plantillas y previsualiza tu web con tus propios datos antes de aplicar.',
    descriptionFree: 'Con Pro puedes cambiar el diseño de tu web cuando quieras.',
    side: 'right',
    proOnly: true,
  },
  {
    id: 'brand-color',
    route: '/dashboard/brand-color',
    anchorSelector: '[data-tour="brand-color"]',
    anchorSelectorMobile: '[data-tour="brand-color-main"]',
    icon: 'palette',
    title: 'Color de marca',
    description:
      'Cambia el color principal de tu web. Los colores dependen de la plantilla activa; si cambias de diseño, la paleta cambia.',
    descriptionFree: 'Con Pro puedes personalizar el color principal de tu web.',
    side: 'right',
    proOnly: true,
  },
  {
    id: 'imagenes',
    route: '/dashboard/images',
    anchorSelector: '[data-tour="imagenes"]',
    anchorSelectorMobile: '[data-tour="imagenes-main"]',
    icon: 'image',
    title: 'Imágenes',
    description: 'Sube tu logo, una portada y la galería. Aparecen en tu web en segundos.',
    descriptionPro: 'Como Pro puedes subir hasta 20 fotos en galería.',
    microcopy: 'Cuanto mejores las fotos, más clientes se animan a entrar.',
    proUpgrade: true,
    side: 'right',
  },
  {
    id: 'horarios',
    route: '/dashboard/schedule',
    anchorSelector: '[data-tour="horarios"]',
    anchorSelectorMobile: '[data-tour="horarios-main"]',
    icon: 'clock',
    title: 'Horarios',
    description: 'Marca cuándo abres. Tus clientes lo ven al instante en la web.',
    microcopy: 'Usa las plantillas: Lun – Vie, Lun – Sáb o Todos los días.',
    side: 'right',
  },
  {
    id: 'servicios',
    route: '/dashboard/services',
    anchorSelector: '[data-tour="servicios"]',
    anchorSelectorMobile: '[data-tour="servicios-main"]',
    icon: 'list',
    title: 'Servicios',
    description: 'Añade los servicios que ofreces. Edítalos cuando cambien.',
    microcopy: 'Con Pro: hasta 15 servicios.',
    descriptionFree: 'Añade los servicios que ofreces. Edítalos cuando cambien.',
    microcopyFree: 'Plan gratuito: hasta 3 servicios.',
    proUpgrade: true,
    side: 'right',
  },
  {
    id: 'enlaces-pro',
    route: '/dashboard/enlaces',
    anchorSelector: '[data-tour="enlaces-pro"]',
    anchorSelectorMobile: '[data-tour="enlaces-pro-main"]',
    icon: 'arrowUpRight',
    title: 'Enlaces Pro',
    description:
      'Conecta Google, Instagram, TikTok y Facebook a tu página. Tus visitas pueden guardar tu contacto en un clic.',
    descriptionFree: 'Conecta Google, Instagram y más a tu página cuando pases al plan Pro.',
    side: 'right',
    proOnly: true,
  },
  {
    id: 'estadisticas',
    route: '/dashboard/stats',
    anchorSelector: '[data-tour="estadisticas"]',
    anchorSelectorMobile: '[data-tour="estadisticas-main"]',
    icon: 'barChart',
    title: 'Estadísticas',
    description: 'Mira tus visitas y los clics a tu WhatsApp y teléfono. Hasta 90 días de historial.',
    descriptionFree: 'Verás visitas y clics detallados al pasar al plan Pro.',
    side: 'right',
    proOnly: true,
  },
  {
    id: 'cuenta',
    route: '/dashboard/account',
    anchorSelector: '[data-tour="cuenta"]',
    anchorSelectorMobile: '[data-tour="cuenta-main"]',
    icon: 'user',
    title: 'Cuenta',
    description:
      'Tus datos, suscripción, facturas, referidos y seguridad (contraseña y sesiones). No necesitas tocarlo a diario.',
    side: 'right',
  },
]

export const TOUR_STEP_COUNT = TOUR_STEPS.length
