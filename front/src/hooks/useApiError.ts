type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export function useApiError(error: unknown): { fieldErrors: Record<string, string>; generalError: string } {
  if (error == null) {
    return { fieldErrors: {}, generalError: '' }
  }

  // Detecta tanto instancias reales de AxiosError como objetos planos con isAxiosError
  const isAxiosLike = (
    e: unknown,
  ): e is { response?: { status?: number; data?: ApiErrorPayload }; isAxiosError?: boolean } => {
    if (e === null || typeof e !== 'object') return false
    return 'response' in e || ('isAxiosError' in e && (e as { isAxiosError?: unknown }).isAxiosError === true)
  }

  if (isAxiosLike(error) && error.response) {
    const raw = error.response.data as unknown
    if (typeof raw === 'string' && raw.trim()) {
      return { fieldErrors: {}, generalError: raw.trim().slice(0, 400) }
    }
    const payload = (raw ?? {}) as ApiErrorPayload
    const fieldErrors = Object.entries(payload.errors ?? {}).reduce<Record<string, string>>((acc, [key, values]) => {
      acc[key] = Array.isArray(values) ? (values[0] ?? 'Campo inválido') : String(values)
      return acc
    }, {})
    const status = error.response.status
    const msg = payload.message?.trim()
    if (msg) {
      return { fieldErrors, generalError: msg }
    }
    if (status === 403) {
      return { fieldErrors, generalError: 'No tienes permiso para esta acción (403). Revisa tu sesión o tu plan.' }
    }
    if (status === 404) {
      return { fieldErrors, generalError: 'Recurso no encontrado (404).' }
    }
    if (status != null && status >= 500) {
      return { fieldErrors, generalError: `Error del servidor (${status}). Inténtalo de nuevo en unos minutos.` }
    }
    return { fieldErrors, generalError: status ? `Error ${status}` : 'Ha ocurrido un error' }
  }

  const net = error as { code?: string; message?: string }
  if (net && typeof net === 'object' && net.code === 'ERR_NETWORK') {
    return { fieldErrors: {}, generalError: 'Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.' }
  }
  if (error instanceof Error && error.message) {
    return { fieldErrors: {}, generalError: error.message }
  }

  return { fieldErrors: {}, generalError: 'Ha ocurrido un error' }
}
