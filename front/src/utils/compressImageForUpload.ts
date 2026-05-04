/**
 * Reduce tamaño de imagen antes de subirla (multipart), manteniendo buena calidad para web.
 * Convierte a JPEG cuando aplica para limitar peso.
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxSide?: number; quality?: number; skipBelowBytes?: number },
): Promise<File> {
  const maxSide = options?.maxSide ?? 2200
  const quality = options?.quality ?? 0.86
  const skipBelowBytes = options?.skipBelowBytes ?? 600_000

  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  if (file.size <= skipBelowBytes && file.type !== 'image/png') {
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
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
    if (!blob || blob.size === 0) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
    const out = new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
    return out.size < file.size ? out : file
  } catch {
    return file
  }
}

export async function compressImagesForUpload(files: File[], options?: Parameters<typeof compressImageForUpload>[1]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageForUpload(f, options)))
}
