import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Btn, Field, Input, Switch } from '../../components/primitives/primitives'
import { getBusiness, updateBusinessIntegrations } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'

function emptyToNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

export type ProIntegrationsFormProps = {
  /** Si false, campos deshabilitados (solo lectura / mensaje en padre). */
  enabled: boolean
  /** Tras guardar con éxito. */
  onSaved?: () => void
  onSaveError?: () => void
  /** Texto del botón guardar. */
  saveLabel?: string
  compact?: boolean
}

export default function ProIntegrationsForm({
  enabled,
  onSaved,
  onSaveError,
  saveLabel = 'Guardar enlaces',
  compact,
}: ProIntegrationsFormProps) {
  const qc = useQueryClient()

  const businessQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const business = businessQuery.data
  const disabled = !enabled || businessQuery.isLoading

  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('')
  const [vcardEnabled, setVcardEnabled] = useState(false)

  useEffect(() => {
    if (!business) return
    setGoogleBusinessUrl(business.google_business_url ?? '')
    setVcardEnabled(Boolean(business.vcard_enabled))
  }, [business])

  const saveMut = useMutation({
    mutationFn: () =>
      updateBusinessIntegrations({
        google_maps_url: null,
        booking_url: null,
        google_business_url: emptyToNull(googleBusinessUrl),
        vcard_enabled: vcardEnabled,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      onSaved?.()
    },
    onError: () => {
      onSaveError?.()
    },
  })

  if (businessQuery.isLoading || !business) {
    return (
      <div style={{ maxWidth: compact ? undefined : 560 }}>
        <div className="lw-shimmer" style={{ height: 28, borderRadius: 8, maxWidth: 260, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 100, borderRadius: 12 }} />
      </div>
    )
  }

  const gap = compact ? 14 : 20

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <p className="lw-small" style={{ margin: 0, fontSize: 13, color: 'var(--lw-text-2)', lineHeight: 1.5 }}>
        El enlace «Cómo llegar» en tu web se genera automáticamente con la dirección y el mapa que ya configuraste.
      </p>

      <Field label="Perfil de Google Business" hint="Tu página de reseñas de Google">
        <Input
          type="url"
          value={googleBusinessUrl}
          onChange={(e) => setGoogleBusinessUrl(e.target.value)}
          placeholder="https://g.page/..."
          disabled={disabled}
        />
      </Field>

      <Field label="Activar descarga de contacto (vCard)" hint="Permite a tus visitantes guardar tu contacto en el móvil">
        <Switch
          checked={vcardEnabled}
          onChange={setVcardEnabled}
          disabled={disabled}
          label={vcardEnabled ? 'Activado' : 'Desactivado'}
        />
      </Field>

      <Btn
        type="button"
        kind="primary"
        loading={saveMut.isPending}
        disabled={disabled || saveMut.isPending}
        onClick={() => saveMut.mutate()}
      >
        {saveLabel}
      </Btn>
    </div>
  )
}
