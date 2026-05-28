import { useEffect, useId, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Icon from '../../components/primitives/Icon'
import { getBusiness, updateBusinessIntegrations } from '../../api/dashboard'
import { keys } from '../../api/queryKeys'
import './enlacesContent.css'

function emptyToNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, '')
}

function withHttps(value: string): string {
  const t = value.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

type SocialKey = 'google' | 'instagram' | 'tiktok' | 'facebook'

const BRAND_LOGO_ICONS = new Set(['instagram', 'tiktok', 'facebook'])

const SOCIAL_META: Record<
  SocialKey,
  { label: string; icon: string; brand: string; placeholder: string; helper: string }
> = {
  google: {
    label: 'Perfil de Google Business',
    icon: 'map',
    brand: '#1A73E8',
    placeholder: 'g.page/tu-negocio',
    helper: 'Tu página de reseñas de Google',
  },
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    brand: '#E1306C',
    placeholder: 'www.instagram.com/...',
    helper: 'Perfil o publicación',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'tiktok',
    brand: '#000000',
    placeholder: 'www.tiktok.com/@...',
    helper: 'Perfil',
  },
  facebook: {
    label: 'Facebook',
    icon: 'facebook',
    brand: '#1877F2',
    placeholder: 'www.facebook.com/...',
    helper: 'Página o perfil',
  },
}

export type ProIntegrationsFormProps = {
  /** Si false, campos deshabilitados (solo lectura / mensaje en padre). */
  enabled: boolean
  /** Tras guardar con éxito. */
  onSaved?: () => void
  onSaveError?: () => void
  /** Texto del botón guardar. */
  saveLabel?: string
  /** Menos espacio; botón guardar inline (onboarding) en lugar de barra sticky. */
  compact?: boolean
}

function SocialField({
  fieldKey,
  value,
  onChange,
  focused,
  onFocus,
  disabled,
  inputId,
}: {
  fieldKey: SocialKey
  value: string
  onChange: (v: string) => void
  focused: boolean
  onFocus: () => void
  disabled: boolean
  inputId: string
}) {
  const meta = SOCIAL_META[fieldKey]
  const filled = value.trim().length > 0
  const canOpen = filled && isValidHttpUrl(value)

  return (
    <div
      className={`lw-enlaces-field${focused ? ' lw-enlaces-field--focused' : ''}${disabled ? ' lw-enlaces-field--disabled' : ''}`}
      onClick={() => {
        if (!disabled) onFocus()
      }}
    >
      <div className="lw-enlaces-field__head">
        <div
          className={`lw-enlaces-field__icon${filled ? ' lw-enlaces-field__icon--filled' : ''}`}
          style={filled ? { background: meta.brand } : undefined}
        >
          <Icon
            name={meta.icon}
            size={BRAND_LOGO_ICONS.has(meta.icon) ? 18 : 17}
            stroke={BRAND_LOGO_ICONS.has(meta.icon) ? 0 : 2.2}
            color={filled ? '#fff' : undefined}
          />
        </div>
        <div className="lw-enlaces-field__titles">
          <div className="lw-enlaces-field__label">{meta.label}</div>
          <div className="lw-enlaces-field__helper">{meta.helper}</div>
        </div>
        {canOpen ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="lw-enlaces-field__open"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="arrowUpRight" size={12} />
            Abrir
          </a>
        ) : null}
      </div>
      <div className="lw-enlaces-url-shell">
        <span className="lw-enlaces-url-prefix">https://</span>
        <input
          id={inputId}
          className="lw-enlaces-url-input"
          value={stripProtocol(value)}
          onChange={(e) => onChange(withHttps(e.target.value))}
          onFocus={onFocus}
          placeholder={meta.placeholder}
          disabled={disabled}
          inputMode="url"
          autoComplete="url"
        />
      </div>
    </div>
  )
}

export default function ProIntegrationsForm({
  enabled,
  onSaved,
  onSaveError,
  saveLabel = 'Guardar enlaces',
  compact = false,
}: ProIntegrationsFormProps) {
  const qc = useQueryClient()
  const formId = useId()

  const businessQuery = useQuery({
    queryKey: keys.dashboard.business,
    queryFn: getBusiness,
  })

  const business = businessQuery.data
  const disabled = !enabled || businessQuery.isLoading

  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [vcardEnabled, setVcardEnabled] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  useEffect(() => {
    if (!business) return
    setGoogleBusinessUrl(business.google_business_url ?? '')
    setInstagramUrl(business.instagram_url ?? '')
    setTiktokUrl(business.tiktok_url ?? '')
    setFacebookUrl(business.facebook_url ?? '')
    setVcardEnabled(Boolean(business.vcard_enabled))
  }, [business])

  const isDirty = useMemo(() => {
    if (!business) return false
    const norm = (v: string) => v.trim()
    return (
      norm(googleBusinessUrl) !== norm(business.google_business_url ?? '') ||
      norm(instagramUrl) !== norm(business.instagram_url ?? '') ||
      norm(tiktokUrl) !== norm(business.tiktok_url ?? '') ||
      norm(facebookUrl) !== norm(business.facebook_url ?? '') ||
      vcardEnabled !== Boolean(business.vcard_enabled)
    )
  }, [business, googleBusinessUrl, instagramUrl, tiktokUrl, facebookUrl, vcardEnabled])

  const filledSocialCount = [instagramUrl, tiktokUrl, facebookUrl].filter((v) => v.trim().length > 0).length

  const saveMut = useMutation({
    mutationFn: () =>
      updateBusinessIntegrations({
        google_maps_url: null,
        booking_url: null,
        google_business_url: emptyToNull(googleBusinessUrl),
        instagram_url: emptyToNull(instagramUrl),
        tiktok_url: emptyToNull(tiktokUrl),
        facebook_url: emptyToNull(facebookUrl),
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
      <div className={compact ? undefined : 'lw-enlaces-page'}>
        <div className="lw-shimmer" style={{ height: 28, borderRadius: 8, maxWidth: 260, marginBottom: 14 }} />
        <div className="lw-shimmer" style={{ height: 100, borderRadius: 12 }} />
      </div>
    )
  }

  const saveButton = (
    <button
      type="button"
      className="lw-enlaces-save-btn"
      disabled={disabled || saveMut.isPending}
      onClick={() => saveMut.mutate()}
    >
      <Icon name="check" size={16} color="#fff" />
      {saveMut.isPending ? 'Guardando…' : saveLabel}
    </button>
  )

  return (
    <div className={`lw-enlaces-form${compact ? ' lw-enlaces-form--compact' : ''}`}>
      <SocialField
        fieldKey="google"
        value={googleBusinessUrl}
        onChange={setGoogleBusinessUrl}
        focused={focused === 'google'}
        onFocus={() => setFocused('google')}
        disabled={disabled}
        inputId={`${formId}-google`}
      />

      <div className="lw-enlaces-social-head">
        <div>
          <h3 className="lw-enlaces-social-head__title">Redes del pie de página</h3>
          <p className="lw-enlaces-social-head__subtitle">
            En el plan gratuito se muestran los enlaces de ONEZ; con Pro pones los tuyos.
          </p>
        </div>
        <span className="lw-enlaces-pill">
          {filledSocialCount} / 3 conectadas
        </span>
      </div>

      <SocialField
        fieldKey="instagram"
        value={instagramUrl}
        onChange={setInstagramUrl}
        focused={focused === 'instagram'}
        onFocus={() => setFocused('instagram')}
        disabled={disabled}
        inputId={`${formId}-instagram`}
      />
      <SocialField
        fieldKey="tiktok"
        value={tiktokUrl}
        onChange={setTiktokUrl}
        focused={focused === 'tiktok'}
        onFocus={() => setFocused('tiktok')}
        disabled={disabled}
        inputId={`${formId}-tiktok`}
      />
      <SocialField
        fieldKey="facebook"
        value={facebookUrl}
        onChange={setFacebookUrl}
        focused={focused === 'facebook'}
        onFocus={() => setFocused('facebook')}
        disabled={disabled}
        inputId={`${formId}-facebook`}
      />

      <div className={`lw-enlaces-vcard${disabled ? ' lw-enlaces-vcard--disabled' : ''}`}>
        <div className={`lw-enlaces-vcard__icon${vcardEnabled ? ' lw-enlaces-vcard__icon--on' : ''}`}>
          <Icon name="contact" size={19} stroke={2.2} />
        </div>
        <div className="lw-enlaces-vcard__text">
          <div className="lw-enlaces-vcard__title">Descarga de contacto (vCard)</div>
          <div className="lw-enlaces-vcard__subtitle">
            Permite a tus visitantes guardar tu contacto en el móvil con un click.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={vcardEnabled}
          className={`lw-enlaces-toggle${vcardEnabled ? ' lw-enlaces-toggle--on' : ''}`}
          disabled={disabled}
          onClick={() => setVcardEnabled((v) => !v)}
        >
          <span className="lw-enlaces-toggle__knob" />
        </button>
      </div>

      <div className="lw-enlaces-note">
        <Icon name="info" size={16} color="var(--lw-enlaces-accent-dark)" style={{ marginTop: 1, flexShrink: 0 }} />
        <span>
          El enlace <strong>«Cómo llegar»</strong> en tu web se genera automáticamente con la dirección y el mapa que ya
          configuraste.
        </span>
      </div>

      {compact ? (
        <div className="lw-enlaces-inline-save">{saveButton}</div>
      ) : (
        <div className="lw-enlaces-save-bar">
          <div className="lw-enlaces-save-status" aria-live="polite">
            {saveMut.isPending ? (
              <span>Guardando cambios…</span>
            ) : isDirty ? (
              <>
                <span className="lw-enlaces-save-dot" aria-hidden />
                <span>Tienes cambios sin guardar</span>
              </>
            ) : (
              <>
                <Icon name="check" size={16} color="var(--lw-enlaces-accent)" />
                <span style={{ color: 'var(--lw-enlaces-accent-dark)', fontWeight: 600 }}>Todo guardado</span>
              </>
            )}
          </div>
          {saveButton}
        </div>
      )}
    </div>
  )
}
