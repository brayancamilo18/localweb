import { Badge, Btn, Card } from '../../../../components/primitives/primitives'
import { useToast } from '../../../../components/ui/Toast'
import { useCookieConsent } from '../../../../hooks/useCookieConsent'
import { resetConsent } from '../../../../lib/cookieConsent'

const CATEGORY_LABELS = [
  { key: 'necessary' as const, label: 'Necesarias' },
  { key: 'analytics' as const, label: 'Analíticas' },
  { key: 'marketing' as const, label: 'Marketing' },
  { key: 'preferences' as const, label: 'Preferencias' },
]

export default function AccountTabPrivacidad() {
  const { showToast } = useToast()
  const { consent } = useCookieConsent()

  const handleChangePreferences = () => {
    resetConsent()
  }

  const handleDeleteRequest = () => {
    showToast(
      'Para eliminar tu cuenta y todos tus datos, escríbenos a privacidad@onez.es desde el email de tu cuenta.',
      'info',
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Tus datos
        </h2>
        <p className="lw-small" style={{ margin: 0, lineHeight: 1.6, fontSize: 13 }}>
          Recogemos tu nombre, email y los datos de tu negocio para prestar el servicio ONEZ.
          Registramos analíticas de visitas a tu página pública con direcciones IP anonimizadas
          (hash irreversible). No vendemos tus datos a terceros. Conservamos la información mientras
          mantengas tu cuenta activa y el tiempo necesario para obligaciones legales.
        </p>
        <p className="lw-small" style={{ margin: '12px 0 0', lineHeight: 1.6, fontSize: 13 }}>
          Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, oposición y
          portabilidad contactando con{' '}
          <a href="mailto:privacidad@onez.es" style={{ color: 'var(--lw-accent)' }}>
            privacidad@onez.es
          </a>
          . Responsable del tratamiento: ONEZ (completar CIF y dirección fiscal cuando esté
          disponible).
        </p>
      </Card>

      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Preferencias de cookies
        </h2>
        {!consent ? (
          <p className="lw-small" style={{ margin: 0, fontSize: 13 }}>
            Aún no has guardado preferencias de cookies en este navegador.
          </p>
        ) : (
          <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORY_LABELS.map(({ key, label }) => {
              const active = key === 'necessary' ? true : Boolean(consent[key])
              return (
                <li
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <span>{label}</span>
                  <Badge tone={active ? 'success' : 'default'} size="sm">
                    {active ? 'Activadas' : 'Desactivadas'}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
        <Btn kind="outline" size="md" type="button" onClick={handleChangePreferences}>
          Cambiar preferencias
        </Btn>
      </Card>

      <Card padding={20}>
        <h2 className="lw-h3" style={{ margin: '0 0 12px', fontSize: 16 }}>
          Derecho al olvido
        </h2>
        <p className="lw-small" style={{ margin: '0 0 16px', lineHeight: 1.6, fontSize: 13 }}>
          Puedes solicitar la eliminación permanente de tu cuenta y de todos los datos asociados.
        </p>
        <Btn kind="danger" size="md" type="button" onClick={handleDeleteRequest}>
          Eliminar mi cuenta y datos
        </Btn>
      </Card>
    </div>
  )
}
