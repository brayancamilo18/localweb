import { useMemo } from 'react'
import { Icon } from '../../../components/primitives/primitives'

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

function MoreHorizontalIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  ariaLabel?: string
}

export default function DisenoPagination({ page, totalPages, onPageChange, ariaLabel = 'Paginación' }: Props) {
  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages])

  if (totalPages <= 1) return null

  const goto = (n: number) => {
    onPageChange(Math.min(totalPages, Math.max(1, n)))
  }

  return (
    <nav className="lw-diseno-pagination" aria-label={ariaLabel}>
      <div className="lw-diseno-pagination__pill">
        <button
          type="button"
          className="lw-diseno-pagination__nav lw-diseno-pagination__nav--prev"
          onClick={() => goto(page - 1)}
          disabled={page === 1}
          aria-label="Página anterior"
        >
          <Icon name="chevronLeft" size={14} />
          <span className="lw-diseno-pagination__nav-label">Anterior</span>
        </button>

        <div className="lw-diseno-pagination__divider" aria-hidden />

        <div className="lw-diseno-pagination__pages">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="lw-diseno-pagination__ellipsis" aria-hidden>
                <MoreHorizontalIcon />
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`lw-diseno-pagination__page${p === page ? ' is-active' : ''}`}
                onClick={() => goto(p)}
                aria-label={`Ir a la página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <div className="lw-diseno-pagination__divider" aria-hidden />

        <button
          type="button"
          className="lw-diseno-pagination__nav lw-diseno-pagination__nav--next"
          onClick={() => goto(page + 1)}
          disabled={page === totalPages}
          aria-label="Página siguiente"
        >
          <span className="lw-diseno-pagination__nav-label">Siguiente</span>
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </nav>
  )
}
