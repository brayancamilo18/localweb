export const TEMPLATE_THUMB_DOC_W = 1280
export const TEMPLATE_THUMB_DOC_H = 760

export function templateThumbAspectPadding(): string {
  return `${(TEMPLATE_THUMB_DOC_H / TEMPLATE_THUMB_DOC_W) * 100}%`
}
