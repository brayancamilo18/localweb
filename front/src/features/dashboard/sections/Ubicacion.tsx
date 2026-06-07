import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge, Btn, Input } from '../../../components/primitives'
import Icon from '../../../components/primitives/Icon'
import { LocationPicker } from '../../../components/location/LocationPicker'
import { LocationMap } from '../../../components/location/LocationMap'
import { useToast } from '../../../components/ui/Toast'
import { updateLocation, type GeocodePrecision } from '../../../api/dashboard'
import { keys } from '../../../api/queryKeys'
import { coerceLocation } from '../../../lib/location/coerceLocation'
import type { LocationValue } from '../../../lib/location/locationTypes'
import { useDashboard } from '../context/DashboardContext'
import DashboardSectionHeader from '../components/DashboardSectionHeader'
import '../components/dashboardSectionHeader.css'
import './ubicacion.css'

const PRECISION_LABEL: Record<GeocodePrecision, { tone: 'success' | 'warning'; text: string }> = {
  exact: { tone: 'success', text: 'Ubicación exacta' },
  street: { tone: 'warning', text: 'Aproximada a la calle' },
  area: { tone: 'warning', text: 'Aproximada a la zona' },
}

function extractErrorMessage(error: unknown): string {
  const res = (error as { response?: { data?: { message?: string } } })?.response?.data
  return res?.message ?? 'No se pudo guardar la ubicación. Revisa tu conexión e inténtalo de nuevo.'
}

export default function Ubicacion() {
  const { business, refetch } = useDashboard()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [location, setLocation] = useState<LocationValue>(() =>
    coerceLocation({
      countryCode: business.country_code,
      country: business.country,
      city: business.city,
    }),
  )
  const [address, setAddress] = useState(business.address ?? '')
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: business.lat,
    lng: business.lng,
  })
  const [precision, setPrecision] = useState<GeocodePrecision | null>(null)
  const [errors, setErrors] = useState<{ city?: string; country?: string; address?: string }>({})

  useEffect(() => {
    setLocation(
      coerceLocation({
        countryCode: business.country_code,
        country: business.country,
        city: business.city,
      }),
    )
    setAddress(business.address ?? '')
    setCoords({ lat: business.lat, lng: business.lng })
    setPrecision(null)
    setErrors({})
  }, [business])

  const isDirty = useMemo(() => {
    const norm = (v: string | null | undefined) => (v ?? '').trim()
    return (
      norm(address) !== norm(business.address) ||
      norm(location.city) !== norm(business.city) ||
      norm(location.countryCode).toUpperCase() !== norm(business.country_code).toUpperCase()
    )
  }, [address, location, business])

  const mutation = useMutation({
    mutationFn: () =>
      updateLocation({
        address: address.trim(),
        city: location.city.trim(),
        country: location.country.trim(),
        country_code: location.countryCode.trim().toUpperCase(),
      }),
    onSuccess: async (result) => {
      setCoords({ lat: result.business.lat, lng: result.business.lng })
      setPrecision(result.geocode_precision)
      await qc.invalidateQueries({ queryKey: keys.dashboard.business })
      refetch()
      showToast({
        type: 'success',
        title: 'Ubicación actualizada',
        description: 'El mapa de tu web ya apunta a la nueva dirección.',
      })
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'No se pudo situar la dirección',
        description: extractErrorMessage(error),
      })
    },
  })

  function validate(): boolean {
    const next: typeof errors = {}
    if (!location.countryCode.trim()) next.country = 'Selecciona un país.'
    if (!location.city.trim()) next.city = 'Selecciona una ciudad.'
    if (!address.trim()) next.address = 'Indica la dirección (calle y número).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSave() {
    if (mutation.isPending) return
    if (!validate()) return
    mutation.mutate()
  }

  const precisionBadge = precision ? PRECISION_LABEL[precision] : null

  return (
    <div className="lw-dash-section-page lw-location-page" data-tour="ubicacion-main">
      <DashboardSectionHeader
        badgeIcon="pin"
        badgeLabel="Mapa público"
        title="Ubicación"
        subtitle="Define dónde está tu negocio. El pin del mapa de tu web se sitúa automáticamente en esta dirección. Puedes cambiar de país, ciudad o calle cuando quieras."
      />

      <div className="lw-location-page__grid">
        <div className="lw-location-page__form">
          <LocationPicker
            value={location}
            onChange={(next) => {
              setLocation(next)
              setErrors((e) => ({ ...e, city: undefined, country: undefined }))
            }}
            disabled={mutation.isPending}
            cityError={errors.city}
            countryError={errors.country}
          />

          <div className="lw-location-page__field">
            <Input
              label="Dirección"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setErrors((err) => ({ ...err, address: undefined }))
              }}
              disabled={mutation.isPending}
              error={errors.address}
              prefix={<Icon name="search" size={14} />}
              placeholder="Calle, número, código postal"
            />
            <p className="lw-location-page__hint">
              <Icon name="info" size={13} />
              Incluye el número de portal para que el pin sea exacto.
            </p>
          </div>

          {precisionBadge ? (
            <Badge tone={precisionBadge.tone}>{precisionBadge.text}</Badge>
          ) : null}

          <div className="lw-location-page__actions">
            <Btn
              type="button"
              kind="primary"
              iconRight="pin"
              loading={mutation.isPending}
              disabled={mutation.isPending || !isDirty}
              onClick={handleSave}
            >
              {mutation.isPending ? 'Situando…' : 'Guardar y situar en el mapa'}
            </Btn>
            {!isDirty && !mutation.isPending ? (
              <span className="lw-location-page__saved">
                <Icon name="check" size={15} color="var(--lw-dash-accent)" />
                Ubicación guardada
              </span>
            ) : null}
          </div>
        </div>

        <div className="lw-location-page__map-wrap">
          <LocationMap
            lat={coords.lat}
            lng={coords.lng}
            className="lw-location-page__map"
            height={340}
          />
          {coords.lat === null || coords.lng === null ? (
            <p className="lw-location-page__map-empty">
              <Icon name="pin" size={14} />
              Aún no hay ubicación. Rellena la dirección y pulsa «Guardar».
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
