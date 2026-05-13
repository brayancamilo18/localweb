import { apiClient } from './client'
import type { ApiResponse } from '../types/api'

export type BillingStatus = {
  plan: string
  is_pro: boolean
  is_free: boolean
  subscription_status?: string | null
  renewal_date?: number | null
  cancel_at_period_end?: boolean
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const res = await apiClient.get<ApiResponse<BillingStatus>>('/billing/status')
  return res.data.data
}

export async function postCheckout(): Promise<string> {
  const res = await apiClient.post<ApiResponse<{ checkout_url: string }>>('/billing/checkout')
  return res.data.data.checkout_url
}

export async function postPortal(): Promise<string> {
  const res = await apiClient.post<ApiResponse<{ portal_url: string }>>('/billing/portal')
  return res.data.data.portal_url
}

// ─── Endpoints extendidos para «Mi cuenta» ─────────────────────────
// Se añaden aquí (en lugar de un fichero nuevo) para mantener un único
// punto de entrada al API de billing. Los métodos antiguos arriba siguen
// usándose desde Dashboard/Suscripcion sin cambios.

export interface BillingInvoice {
  id: string
  number: string | null
  date: number
  total: number
  currency: string
  status: string
  hosted_invoice_url: string | null
}

export interface BillingPaymentMethod {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
}

export interface BillingUpcoming {
  date: number
  total: number
  currency: string
}

export async function getInvoices(): Promise<BillingInvoice[]> {
  const res = await apiClient.get<ApiResponse<{ invoices: BillingInvoice[] }>>('/billing/invoices')
  return res.data.data.invoices
}

export async function getPaymentMethod(): Promise<BillingPaymentMethod | null> {
  const res = await apiClient.get<ApiResponse<{ payment_method: BillingPaymentMethod | null }>>(
    '/billing/payment-method',
  )
  return res.data.data.payment_method
}

export async function getUpcoming(): Promise<BillingUpcoming | null> {
  const res = await apiClient.get<ApiResponse<{ upcoming: BillingUpcoming | null }>>(
    '/billing/upcoming',
  )
  return res.data.data.upcoming
}

export async function postCancelSubscription(): Promise<{ message: string }> {
  const res = await apiClient.post<ApiResponse<{ message: string }>>('/billing/cancel')
  return res.data.data
}

export async function postResumeSubscription(): Promise<{ message: string }> {
  const res = await apiClient.post<ApiResponse<{ message: string }>>('/billing/resume')
  return res.data.data
}

/**
 * URL absoluta de descarga. Útil cuando se quiere mostrar el enlace o abrirlo
 * en una nueva pestaña; para la descarga del PDF en sí preferimos
 * `downloadInvoiceBlob` porque permite mostrar feedback de progreso.
 */
export function getInvoiceDownloadUrl(invoiceId: string): string {
  const base = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '')
  return `${base}/billing/invoices/${encodeURIComponent(invoiceId)}/download`
}

/**
 * Descarga la factura como Blob a través de `apiClient` (cookies + intercep-
 * tores de auth). La UI usa esto en vez de una `<a download>` directa para
 * poder mostrar un spinner mientras el backend genera el PDF (Cashier+Dompdf
 * tarda ~1-3 s) y para capturar errores 4xx/5xx con un toast en lugar de un
 * "El sitio no estaba disponible" del navegador.
 */
export async function downloadInvoiceBlob(invoiceId: string): Promise<Blob> {
  const res = await apiClient.get<Blob>(
    `/billing/invoices/${encodeURIComponent(invoiceId)}/download`,
    { responseType: 'blob' },
  )
  return res.data
}
