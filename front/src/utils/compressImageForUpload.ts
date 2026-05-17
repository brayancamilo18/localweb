/**
 * Reduce tamaño de imagen antes de subirla (multipart), manteniendo buena calidad para web.
 * PNG conserva transparencia; el resto se convierte a JPEG para limitar peso.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxSide?: number; quality?: number; skipBelowBytes?: number },
): Promise<File> {
  const maxSide = options?.maxSide ?? 2200
  const quality = options?.quality ?? 0.86
  const isPng = file.type === 'image/png'

  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  // Logos y PNG pequeños: sin recompresión para no perder alpha ni calidad
  if (isPng && file.size < 500_000) {
    return file
  }

  const skipBelowBytes = options?.skipBelowBytes ?? (isPng ? 1_000_000 : 600_000)
  if (file.size <= skipBelowBytes) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    let w = bitmap.width
    let h = bitmap.height
    const longest = Math.max(w, h)
    const scale = longest > maxSide ? maxSide / longest : 1
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    // PNG: no rellenar fondo; el canvas queda transparente por defecto
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const outputMime = isPng ? 'image/png' : 'image/jpeg'
    const outputExt = isPng ? 'png' : 'jpg'
    const outputQuality = isPng ? undefined : quality

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), outputMime, outputQuality)
    })
    if (!blob || blob.size === 0) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
    const out = new File([blob], `${base}.${outputExt}`, {
      type: outputMime,
      lastModified: Date.now(),
    })
    return out.size < file.size ? out : file
  } catch {
    return file
  }
}

export async function compressImagesForUpload(files: File[], options?: Parameters<typeof compressImageForUpload>[1]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageForUpload(f, options)))
}
