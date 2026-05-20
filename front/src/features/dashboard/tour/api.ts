import { apiClient } from '../../../api/client'

/**
 * Marca el tour del dashboard como completado en backend.
 *
 * Fire-and-forget: lo llamamos desde TourRunner.onComplete, pero NO
 * bloqueamos la UX si falla — el localStorage ya marcó el tour como
 * completo, así que el usuario no lo verá otra vez en este dispositivo.
 *
 * Backend esperado (ver migración en README):
 *   POST /api/v1/dashboard/tour/complete  →  204 No Content
 *   Setea `businesses.dashboard_tour_completed_at = now()`.
 */
export async function completeDashboardTour(): Promise<void> {
  await apiClient.post('/dashboard/tour/complete')
}

export async function completeDashboardProTour(): Promise<void> {
  await apiClient.post('/dashboard/tour/pro/complete')
}
