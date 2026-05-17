/** URL de miniatura aceptable para <img> (http(s) o ruta relativa al origen). */
export function isValidThumbnailUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim()
  if (!trimmed) return false

  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  )
}
