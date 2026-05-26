/**
 * Tipos del tour guiado del dashboard.
 *
 * Notas de proyecto:
 * - Compilamos con `verbatimModuleSyntax: true`, así que todo lo que sea
 *   sólo-tipo va con `import type` / `export type`.
 * - Los `TourIconName` están restringidos a los iconos que YA existen en
 *   nuestro `Icon` (src/components/primitives/Icon.tsx). Si añadimos un
 *   icono nuevo allí, hay que añadirlo aquí también.
 */

export type TourStepId =
  | 'mi-pagina'
  | 'editor'
  | 'diseno'
  | 'imagenes'
  | 'horarios'
  | 'servicios'
  | 'enlaces-pro'
  | 'estadisticas'
  | 'cuenta'
  | 'seguridad'

export type TourSide = 'right' | 'left' | 'top' | 'bottom' | 'center'

/** Nombres de iconos válidos en nuestro Icon real. */
export type TourIconName =
  | 'home'
  | 'edit'
  | 'layout'
  | 'image'
  | 'clock'
  | 'list'
  | 'arrowUpRight'
  | 'barChart'
  | 'user'
  | 'shield'
  | 'sparkle'
  | 'x'
  | 'arrowRight'
  | 'chevronLeft'
  | 'chevronRight'
  | 'lock'
  | 'check'
  | 'menu'
  | 'bell'

export interface TourStep {
  id: TourStepId
  /** Ruta a la que el router debe navegar al activarse este paso. */
  route: string
  /** Selector del elemento al que ancla el tooltip en desktop. */
  anchorSelector: string
  /** Selector de fallback usado en móvil/tablet (card del main). */
  anchorSelectorMobile?: string
  /** Nombre de icono (debe coincidir con el del sidebar). */
  icon: TourIconName
  /** Titular de 1-2 palabras (mismo que el label del sidebar). */
  title: string
  /** Cuerpo de 1-2 líneas (máx 140 caracteres). */
  description: string
  /** Descripción en mini-tour Pro (upgrade Free → Pro). */
  descriptionPro?: string
  /** Tip opcional debajo de la descripción (usuarios Pro o paso no dividido por plan). */
  microcopy?: string
  /** Tip alternativo para usuarios Free cuando el paso varía por plan sin ser proOnly. */
  microcopyFree?: string
  /** Lado preferido en desktop. */
  side: TourSide
  /** Si true y el usuario es Free, se renderiza la variante "bloqueada". */
  proOnly?: boolean
  /** Incluido en mini-tour Pro (upgrade); visible también para Free en tour normal. */
  proUpgrade?: boolean
  /** Descripción alternativa para usuarios Free en pasos Pro. */
  descriptionFree?: string
}

export interface TourState {
  /**
   * `false` en reposo, `true` cuando se está mostrando el tour
   * (welcome / pasos / finish).
   */
  isOpen: boolean
  /**
   * Índice dentro de TOUR_STEPS. `-1` cuando se está mostrando welcome
   * (antes del primer paso) o finish (después del último).
   */
  currentStepIndex: number
  isFinished: boolean
  /** True cuando el usuario cerró el FinishModal (CTA primario/secundario). */
  isDismissed: boolean
  /** True hasta que el usuario haya descartado/completado el welcome. */
  showWelcome: boolean
}

export interface TourStorageKeys {
  completed: string
  proCompleted: string
  progress: string
}

export interface TourContextValue {
  state: TourState
  storageKeys: TourStorageKeys
  /** Mini-tour de 2 pasos Pro tras upgrade (main tour ya completado en BD). */
  proOnlyMode: boolean
  start: () => void
  stop: () => void
  next: () => void
  prev: () => void
  goToStep: (index: number) => void
  finish: () => void
  dismissFinish: () => void
}

export type TourOverlayVariant = 'spotlight' | 'soft-veil' | 'attenuate'
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

export interface AnchorRect {
  top: number
  left: number
  width: number
  height: number
}
export interface UseTourAnchorResult {
  rect: AnchorRect | null
  ready: boolean
}

/**
 * Extensión local del tipo `Business` para incluir el campo backend
 * `dashboard_tour_completed_at`. Lo declaramos aquí en vez de tocar
 * `types/api.ts` directamente porque el backend lo añade en una migración
 * separada y queremos que la rama del tour sea autocontenida.
 */
export interface BusinessTourFields {
  dashboard_tour_completed_at?: string | null
  dashboard_pro_tour_completed_at?: string | null
}
