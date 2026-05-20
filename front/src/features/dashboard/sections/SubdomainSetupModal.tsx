import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { apiClient } from '../../../api/client'
import { setBusinessSubdomain } from '../../../api/dashboard'
import { Btn, Field, Icon, Input } from '../../../components/primitives/primitives'
import { buildPublicBusinessUrl, getPublicPageHost } from '../../../lib/tenant'
import type { Business } from '../../../types/api'
import '../tour/tour.css'

const RESERVED_SUBDOMAINS = new Set([
  'admin', 'api', 'www', 'mail', 'cdn', 'support', 'help',
  'blog', 'login', 'register', 'dashboard', 'onboarding',
  'app', 'static', 'assets', 'media', 'images', 'img',
  'docs', 'status', 'billing', 'stripe', 'webhook',
  'webhooks', 'auth', 'oauth', 'localweb', 'tenant',
  'tenants', 'public', 'private', 'test', 'staging',
  'dev', 'demo',
])

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const REJECTION_LABELS: Record<string, string> = {
  too_short: 'Mínimo 3 caracteres',
  too_long: 'Máximo 63 caracteres',
  invalid_format: 'Solo letras minúsculas, números y guiones (sin empezar ni terminar en guión)',
  reserved: 'Este nombre está reservado',
  taken: 'Ya está en uso',
}

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'error'

function getLocalRejection(subdomain: string): string | null {
  if (subdomain.length === 0) return null
  if (subdomain.length < 3) return 'too_short'
  if (subdomain.length > 63) return 'too_long'
  if (!SUBDOMAIN_PATTERN.test(subdomain)) return 'invalid_format'
  if (RESERVED_SUBDOMAINS.has(subdomain)) return 'reserved'
  return null
}

interface SubdomainSetupModalProps {
  business: Business
  onDone: () => void
  onLater: () => void
}

export function SubdomainSetupModal({ business, onDone, onLater }: SubdomainSetupModalProps) {
  const titleId = useId()
  const [subdomain, setSubdomain] = useState('')
  const [availability, setAvailability] = useState<Availability>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const localRejection = getLocalRejection(subdomain)

  useEffect(() => {
    if (!subdomain || localRejection) {
      setAvailability('idle')
      return
    }

    let cancelled = false
    setAvailability('checking')

    const timer = window.setTimeout(() => {
      apiClient
        .get<{ exists: boolean }>(`/public/tenants/${encodeURIComponent(subdomain)}/exists`)
        .then(() => {
          if (!cancelled) setAvailability('taken')
        })
        .catch((err: { response?: { status?: number } }) => {
          if (cancelled) return
          const status = err?.response?.status
          if (status === 404) {
            setAvailability('available')
          } else {
            setAvailability('error')
          }
        })
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [subdomain, localRejection])

  const mutation = useMutation({
    mutationFn: () => setBusinessSubdomain(subdomain),
    onSuccess: () => {
      onDone()
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string; errors?: { subdomain?: string } } } })
        ?.response?.data
      const reason = data?.errors?.subdomain
      setSubmitError(
        reason ? (REJECTION_LABELS[reason] ?? data?.message ?? 'No se pudo guardar el subdominio') : (data?.message ?? 'No se pudo guardar el subdominio'),
      )
    },
  })

  const canConfirm =
    subdomain.length > 0 &&
    localRejection === null &&
    availability === 'available' &&
    !mutation.isPending

  const previewUrl = subdomain ? buildPublicBusinessUrl(subdomain) : ''
  const hostSuffix = getPublicPageHost()

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    setSubmitError(null)
    mutation.mutate()
  }, [canConfirm, mutation])

  useEffect(() => {
    const t = window.setTimeout(() => {
      rootRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    }, 50)
    return () => window.clearTimeout(t)
  }, [])

  let availabilityHint: string | null = null
  let availabilityColor = 'var(--lw-text-3)'
  if (subdomain && !localRejection) {
    if (availability === 'checking') {
      availabilityHint = 'Comprobando disponibilidad…'
    } else if (availability === 'available') {
      availabilityHint = 'Disponible'
      availabilityColor = 'var(--lw-success, #0f6e56)'
    } else if (availability === 'taken') {
      availabilityHint = 'No disponible'
      availabilityColor = 'var(--lw-danger)'
    } else if (availability === 'error') {
      availabilityHint = 'No se pudo comprobar; inténtalo de nuevo'
      availabilityColor = 'var(--lw-danger)'
    }
  }

  return (
    <div
      className="lw-tour-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ zIndex: 10050 }}
    >
      <div
        ref={rootRef}
        className="lw-tour-welcome lw-tour-welcome--desktop"
        style={{ maxWidth: 480, width: 'min(480px, calc(100vw - 32px))' }}
      >
        <span className="lw-tour-welcome__icon">
          <Icon name="arrowUpRight" size={22} color="var(--lw-accent)" />
        </span>

        <h2 id={titleId} className="lw-tour-welcome__title">
          Elige el nombre de tu página
        </h2>
        <p className="lw-tour-welcome__desc">
          Esta dirección será pública y permanente. Solo el equipo de ONEZ puede cambiarla más adelante.
        </p>

        <Field
          label="Tu dirección web"
          hint={`Será: tu-nombre.${hostSuffix}`}
          error={
            localRejection
              ? REJECTION_LABELS[localRejection]
              : submitError ?? undefined
          }
        >
          <Input
            value={subdomain}
            disabled={mutation.isPending}
            onChange={(e) => {
              setSubdomain(e.target.value.replace(/\s+/g, '').toLowerCase())
              setSubmitError(null)
            }}
            placeholder="mi-negocio"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        {availabilityHint ? (
          <p className="lw-small" style={{ margin: '4px 0 0', color: availabilityColor }}>
            {availabilityHint}
            {previewUrl && availability === 'available' ? (
              <span style={{ display: 'block', marginTop: 4, color: 'var(--lw-text-3)' }}>
                {previewUrl}
              </span>
            ) : null}
          </p>
        ) : null}

        <p
          className="lw-small"
          style={{
            margin: '16px 0 0',
            color: 'var(--lw-danger)',
            lineHeight: 1.45,
          }}
        >
          ⚠️ Una vez confirmado, no podrás cambiarlo tú mismo. Contacta con{' '}
          <a href="mailto:soporte@onez.es" style={{ color: 'inherit' }}>
            soporte@onez.es
          </a>{' '}
          si necesitas modificarlo en el futuro.
        </p>

        <div className="lw-tour-welcome__actions" style={{ marginTop: 20 }}>
          <Btn
            kind="primary"
            size="md"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {mutation.isPending ? 'Guardando…' : 'Confirmar'}
          </Btn>
          <button
            type="button"
            className="lw-tour-confirm-skip__no"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--lw-text-3)',
              textDecoration: 'underline',
              padding: '8px 0',
            }}
            onClick={onLater}
          >
            Hacerlo más tarde
          </button>
        </div>

        <p className="lw-small" style={{ margin: '12px 0 0', color: 'var(--lw-text-3)', textAlign: 'center' }}>
          URL actual (temporal): {buildPublicBusinessUrl(business.subdomain)}
        </p>
      </div>
    </div>
  )
}
