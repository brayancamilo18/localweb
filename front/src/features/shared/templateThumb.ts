import { useSyncExternalStore } from 'react'

export const TEMPLATE_THUMB_DOC_W = 1280
export const TEMPLATE_THUMB_DOC_H = 760

const THUMB_MQ = '(max-width: 780px)'

/** En móvil los iframes de miniatura saturan la memoria de Safari y tumban la pestaña. */
export function usePreferStaticThumb(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(THUMB_MQ)
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(THUMB_MQ).matches,
    () => true,
  )
}

export function templateThumbAspectPadding(): string {
  return `${(TEMPLATE_THUMB_DOC_H / TEMPLATE_THUMB_DOC_W) * 100}%`
}
