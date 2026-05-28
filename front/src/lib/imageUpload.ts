/** Margen bajo el máximo del backend (KB) para evitar rechazos por redondeo. */
export const UPLOAD_MAX_BYTES = {
  gallery: Math.floor(9.5 * 1024 * 1024),
  logo: Math.floor(1.9 * 1024 * 1024),
  favicon: Math.floor(0.95 * 1024 * 1024),
} as const

const HEIC_MIME = new Set(['image/heic', 'image/heif'])
const HEIC_EXT = /\.(heic|heif)$/i

function isHeic(file: File): boolean {
  return HEIC_MIME.has(file.type) || HEIC_EXT.test(file.name)
}

export function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)
}

function oversizeAfterCompressError(sizeBytes: number, maxBytes: number): Error {
  return new Error(
    `La imagen sigue siendo demasiado grande tras comprimir (${formatFileSizeMb(sizeBytes)} MB). Prueba con otra imagen. El máximo es ${formatFileSizeMb(maxBytes)} MB.`,
  )
}

function heicUnsupportedError(): Error {
  return new Error(
    'Formato HEIC no soportado en este navegador. Convierte la foto a JPEG en tu móvil antes de subirla.',
  )
}

function loadBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file)
}

/**
 * Redimensiona y comprime si hace falta; rechaza HEIC no decodificable y archivos
 * que siguen superando maxBytes tras comprimir.
 */
export async function prepareImageForUpload(
  file: File,
  opts: { maxBytes: number; maxDimension?: number; quality?: number },
): Promise<File> {
  const maxBytes = opts.maxBytes
  const maxDimension = opts.maxDimension
  const quality = opts.quality ?? 0.85

  const hardRawMax = Math.max(maxBytes * 4, 15 * 1024 * 1024)
  if (file.size > hardRawMax && (file.type.startsWith('image/') || isHeic(file))) {
    throw new Error(
      `La imagen pesa demasiado (${formatFileSizeMb(file.size)} MB). El máximo es ${formatFileSizeMb(maxBytes)} MB.`,
    )
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/x-icon') {
    if (file.size > maxBytes) {
      throw new Error(
        `La imagen pesa demasiado (${formatFileSizeMb(file.size)} MB). El máximo es ${formatFileSizeMb(maxBytes)} MB.`,
      )
    }
    return file
  }

  if (!file.type.startsWith('image/')) {
    if (file.size > maxBytes) {
      throw new Error(
        `El archivo pesa demasiado (${formatFileSizeMb(file.size)} MB). El máximo es ${formatFileSizeMb(maxBytes)} MB.`,
      )
    }
    return file
  }

  const shouldResize = maxDimension != null && maxDimension > 0
  if (file.size <= maxBytes && !shouldResize) {
    return file
  }

  if (isHeic(file)) {
    try {
      await loadBitmap(file)
    } catch {
      throw heicUnsupportedError()
    }
  }

  try {
    const bitmap = await loadBitmap(file)
    let w = bitmap.width
    let h = bitmap.height

    if (shouldResize && maxDimension) {
      const longest = Math.max(w, h)
      if (longest > maxDimension) {
        const scale = maxDimension / longest
        w = Math.max(1, Math.round(w * scale))
        h = Math.max(1, Math.round(h * scale))
      }
    } else if (file.size <= maxBytes) {
      bitmap.close?.()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      if (file.size <= maxBytes) {
        return file
      }
      throw oversizeAfterCompressError(file.size, maxBytes)
    }

    const isPng = file.type === 'image/png' && !isHeic(file)
    if (!isPng) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }

    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const outputMime = isPng ? 'image/png' : 'image/jpeg'
    const outputExt = isPng ? 'png' : 'jpg'

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), outputMime, isPng ? undefined : quality)
    })

    if (!blob || blob.size === 0) {
      if (file.size <= maxBytes) {
        return file
      }
      throw oversizeAfterCompressError(file.size, maxBytes)
    }

    const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
    const out = new File([blob], `${base}.${outputExt}`, {
      type: outputMime,
      lastModified: Date.now(),
    })

    if (out.size > maxBytes) {
      throw oversizeAfterCompressError(out.size, maxBytes)
    }

    return out.size < file.size || out.size <= maxBytes ? out : file.size <= maxBytes ? file : out
  } catch (err) {
    if (err instanceof Error && err.message.includes('demasiado grande')) {
      throw err
    }
    if (isHeic(file)) {
      throw heicUnsupportedError()
    }
    if (file.size > maxBytes) {
      throw new Error(
        `La imagen pesa demasiado (${formatFileSizeMb(file.size)} MB). El máximo es ${formatFileSizeMb(maxBytes)} MB.`,
      )
    }
    return file
  }
}

export async function prepareImagesForUpload(
  files: File[],
  opts: { maxBytes: number; maxDimension?: number; quality?: number },
): Promise<File[]> {
  return Promise.all(files.map((f) => prepareImageForUpload(f, opts)))
}

/** Primer mensaje de error 422 del backend para el campo file. */
export function readFileUploadApiError(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }
  const payload = data as { message?: string; errors?: Record<string, string[]> }
  const fieldMsg = payload.errors?.file?.[0]
  if (fieldMsg && !fieldMsg.startsWith('validation.')) {
    return fieldMsg
  }
  if (payload.message && !payload.message.startsWith('validation.')) {
    return payload.message
  }
  return null
}
