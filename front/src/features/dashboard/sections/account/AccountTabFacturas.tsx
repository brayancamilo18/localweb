import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Badge, Btn, Card, Icon } from '../../../../components/primitives/primitives'
import { useToast } from '../../../../components/ui/Toast'
import {
  downloadInvoiceBlob,
  getInvoices,
  type BillingInvoice,
} from '../../../../api/billing'
import { keys } from '../../../../api/queryKeys'

const PAGE_SIZE = 10

function formatInvoiceDate(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
      .format(new Date(unixSeconds * 1000))
      .replace(/\.$/, '')
  } catch {
    return '—'
  }
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function statusLabel(status: string): { tone: 'success' | 'warning' | 'danger'; text: string } {
  switch (status) {
    case 'paid':
      return { tone: 'success', text: 'Pagada' }
    case 'open':
      return { tone: 'warning', text: 'Pendiente' }
    case 'uncollectible':
    case 'void':
      return { tone: 'danger', text: 'Anulada' }
    default:
      return { tone: 'warning', text: status || '—' }
  }
}

export default function AccountTabFacturas() {
  const { showToast } = useToast()
  const [page, setPage] = useState(1)

  const invoicesQ = useQuery({
    queryKey: keys.account.invoices,
    queryFn: getInvoices,
  })

  const invoices = invoicesQ.data ?? []
  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return invoices.slice(start, start + PAGE_SIZE)
  }, [invoices, safePage])

  // Una sola mutación para todas las filas. `mutation.variables?.id` nos dice
  // qué factura se está descargando ahora mismo; eso permite mostrar el
  // spinner SOLO en el botón pulsado (los demás siguen activos).
  const downloadM = useMutation({
    mutationFn: async (inv: BillingInvoice) => {
      const blob = await downloadInvoiceBlob(inv.id)
      return { blob, inv }
    },
    onSuccess: ({ blob, inv }) => {
      // Generamos un object URL local y lo disparamos vía un <a download> para
      // respetar el filename. `revokeObjectURL` libera la memoria en cuanto el
      // navegador termina de "guardar como".
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      a.download = `factura-${inv.number ?? inv.id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'No se pudo descargar la factura',
        description: 'Inténtalo de nuevo en unos segundos.',
      })
    },
  })

  // ─── Loading ────────────────────────────────────────────────────
  if (invoicesQ.isLoading) {
    return (
      <Card padding={20}>
        <p className="lw-small">Cargando facturas…</p>
      </Card>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (invoicesQ.isError) {
    return (
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={16} color="var(--lw-danger)" />
          <p className="lw-small" style={{ color: 'var(--lw-danger)' }}>
            No se pudieron cargar tus facturas.
          </p>
        </div>
        <Btn
          kind="outline"
          size="sm"
          icon="refresh"
          type="button"
          onClick={() => invoicesQ.refetch()}
          style={{ marginTop: 10 }}
        >
          Reintentar
        </Btn>
      </Card>
    )
  }

  // ─── Empty ──────────────────────────────────────────────────────
  if (invoices.length === 0) {
    return (
      <Card padding={20}>
        <div className="lw-account-empty-state">
          <span className="lw-account-empty-state-icon">
            <Icon name="list" size={20} color="var(--lw-text-3)" />
          </span>
          <h3 className="lw-h4">Aún no hay facturas</h3>
          <p className="lw-small" style={{ maxWidth: 380 }}>
            Cuando hagas tu primer pago, tu factura aparecerá aquí lista para descargar.
          </p>
        </div>
      </Card>
    )
  }

  // ─── Listado ────────────────────────────────────────────────────
  return (
    <Card padding={0} className="lw-account-section-card">
      <div className="lw-account-invoices-header">
        <div>
          <h2 className="lw-h3" style={{ marginBottom: 4 }}>
            Historial de facturas
          </h2>
          <p className="lw-small">
            Descarga tus facturas en PDF cuando lo necesites. Conservamos todas tus emisiones.
          </p>
        </div>
        <Badge tone="success" dot>
          {invoices.length}
          {invoices.length === 1 ? ' factura' : ' facturas'}
        </Badge>
      </div>

      <div className="lw-account-invoices-table" role="table" aria-label="Historial de facturas">
        <div className="lw-account-invoices-row lw-account-invoices-row--head" role="row">
          <span role="columnheader">Número</span>
          <span role="columnheader">Fecha</span>
          <span role="columnheader">Importe</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader" />
        </div>

        {visible.map((inv) => {
          const st = statusLabel(inv.status)
          return (
            <div key={inv.id} className="lw-account-invoices-row" role="row">
              <span role="cell" className="lw-mono" data-label="Número">
                {inv.number ?? inv.id}
              </span>
              <span role="cell" className="lw-small" data-label="Fecha">
                {formatInvoiceDate(inv.date)}
              </span>
              <span
                role="cell"
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                }}
                data-label="Importe"
              >
                {formatMoney(inv.total, inv.currency)}
              </span>
              <span role="cell" data-label="Estado">
                <Badge tone={st.tone} dot={st.tone === 'success'}>
                  {st.text}
                </Badge>
              </span>
              <span role="cell" className="lw-account-invoices-actions">
                {inv.hosted_invoice_url ? (
                  <Btn
                    kind="ghost"
                    size="sm"
                    iconRight="arrowUpRight"
                    type="button"
                    onClick={() =>
                      window.open(inv.hosted_invoice_url!, '_blank', 'noopener,noreferrer')
                    }
                  >
                    Ver
                  </Btn>
                ) : null}
                <Btn
                  kind="outline"
                  size="sm"
                  icon="upload"
                  type="button"
                  loading={downloadM.isPending && downloadM.variables?.id === inv.id}
                  disabled={downloadM.isPending && downloadM.variables?.id !== inv.id}
                  onClick={() => downloadM.mutate(inv)}
                  aria-label={`Descargar factura ${inv.number ?? inv.id}`}
                >
                  PDF
                </Btn>
              </span>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="lw-account-invoices-pagination">
          <span className="lw-small">
            Página {safePage} de {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn
              kind="outline"
              size="sm"
              icon="chevronLeft"
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            />
            <Btn
              kind="outline"
              size="sm"
              icon="chevronRight"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            />
          </div>
        </div>
      )}
    </Card>
  )
}
