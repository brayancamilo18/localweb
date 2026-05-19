import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LegalPageLayout } from '../../components/legal/LegalPageLayout'
import { legalRoutes } from '../../lib/legal'
const PAGE_TITLE = 'Política de Cookies · ONEZ'
const PAGE_DESCRIPTION = 'Qué cookies usa ONEZ y cómo gestionar tus preferencias.'

const toc = [
  { id: "1-que-son", label: "1. ¿Qué son las cookies?" },
  { id: "2-cookies-onez", label: "2. Cookies y almacenamiento de ONEZ" },
  { id: "3-terceros", label: "3. Cookies de terceros" },
  { id: "4-preferencias", label: "4. Cómo gestionar tus preferencias" },
  { id: "5-cambios", label: "5. Cambios en esta política" },
];

export default function CookiesPage() {
  useEffect(() => {
    document.title = PAGE_TITLE
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', PAGE_DESCRIPTION)
  }, [])

  return (
    <LegalPageLayout
      title="Política de Cookies"
      badge="Transparencia sobre cookies"
      subtitle="Qué cookies usamos, para qué, y cómo cambiar tus preferencias."
      toc={toc}
    >
      <section id="1-que-son" aria-labelledby="h-1">
        <h2 id="h-1">1. ¿Qué son las cookies?</h2>
        <p>
          Una <strong>cookie</strong> es un pequeño archivo de texto que un sitio web
          instala en tu navegador cuando lo visitas, para recordar tus acciones y
          preferencias.
        </p>
        <p>
          En este documento "cookies" incluye también el almacenamiento local
          (localStorage), ya que la AEPD las equipara a efectos de información y
          consentimiento.
        </p>
      </section>

      <section id="2-cookies-onez" aria-labelledby="h-2">
        <h2 id="h-2">2. Cookies y almacenamiento que usa ONEZ</h2>

        <h3>2.1. Estrictamente necesarias (no requieren consentimiento)</h3>
        <div className="lw-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Identificador</th><th>Origen</th><th>Tipo</th><th>Finalidad</th><th>Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cookie de sesión Laravel/Sanctum</td>
                <td>Propia (onez.es)</td>
                <td>HTTP HttpOnly + Secure + SameSite=Lax</td>
                <td>Mantener la sesión iniciada</td>
                <td>Hasta logout o 120 min de inactividad</td>
              </tr>
              <tr>
                <td>XSRF-TOKEN</td>
                <td>Propia</td>
                <td>HTTP</td>
                <td>Protección frente a CSRF</td>
                <td>Sesión</td>
              </tr>
              <tr>
                <td>onez_cookie_consent</td>
                <td>Propia</td>
                <td>localStorage</td>
                <td>Recordar tus preferencias de cookies</td>
                <td>12 meses</td>
              </tr>
              <tr>
                <td>lw.onboarding.wizard.*</td>
                <td>Propia</td>
                <td>localStorage</td>
                <td>Guardar el borrador del onboarding mientras lo completas</td>
                <td>Hasta completar onboarding</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.2. Analíticas (requieren consentimiento)</h3>
        <p>
          Si aceptas la categoría "Analíticas" en el banner, registramos en nuestros
          servidores los clicks que hagas en los botones de contacto (WhatsApp y teléfono)
          de las páginas públicas. Solo almacenamos un{" "}
          <strong>hash irreversible de tu IP</strong> (HMAC-SHA256), tu navegador y el
          tipo de evento. No es posible identificarte personalmente.
        </p>
        <p>
          Actualmente <strong>no usamos Google Analytics, Facebook Pixel, Hotjar, TikTok
          Pixel ni servicios similares</strong>. Si en el futuro los incorporamos, te lo
          pediremos de nuevo.
        </p>

        <h3>2.3. Marketing (requieren consentimiento)</h3>
        <p>
          Actualmente <strong>no instalamos cookies de marketing</strong>. Esta categoría
          está reservada por si en el futuro incorporamos pixels publicitarios.
        </p>

        <h3>2.4. Preferencias (requieren consentimiento)</h3>
        <p>Actualmente no usamos cookies adicionales de esta categoría.</p>
      </section>

      <section id="3-terceros" aria-labelledby="h-3">
        <h2 id="h-3">3. Cookies de terceros con los que interactúa ONEZ</h2>
        <p>
          Cuando contratas el plan Pro eres redirigido a <strong>Stripe</strong>{" "}
          (checkout.stripe.com, billing.stripe.com) para pagar y gestionar tu
          suscripción. Stripe puede instalar sus propias cookies conforme a su política.
          Solo se activan si entras voluntariamente al flujo de pago.
        </p>
        <p>
          Las páginas públicas creadas con ONEZ pueden incluir enlaces a Instagram,
          TikTok, Facebook, WhatsApp, Google Maps o Google Business si el dueño del
          negocio los configura. Al hacer clic vas al sitio del tercero con su propia
          política. <strong>No incrustamos los SDKs ni pixeles de seguimiento de esas
          plataformas dentro de las páginas públicas.</strong>
        </p>
      </section>

      <section id="4-preferencias" aria-labelledby="h-4">
        <h2 id="h-4">4. Cómo gestionar tus preferencias</h2>
        <p>
          La primera vez que visitas ONEZ te mostramos un <strong>banner de cookies</strong>{" "}
          donde puedes:
        </p>
        <ul>
          <li><strong>Aceptar todo</strong></li>
          <li><strong>Rechazar todo</strong></li>
          <li><strong>Personalizar</strong> categoría por categoría</li>
        </ul>
        <p>Puedes modificar o retirar tu consentimiento en cualquier momento:</p>
        <ul>
          <li>Desde tu cuenta: <strong>Mi cuenta → Privacidad → Cambiar preferencias de cookies</strong>.</li>
          <li>Borrando el almacenamiento local del sitio en tu navegador.</li>
        </ul>
        <p>
          Enlaces para gestionar cookies en cada navegador:{" "}
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>,{" "}
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>.
        </p>
        <p>
          Para más detalle sobre cómo tratamos los datos puedes consultar la{" "}
          <Link to={legalRoutes.privacidad}>Política de Privacidad</Link>.
        </p>
      </section>

      <section id="5-cambios" aria-labelledby="h-5">
        <h2 id="h-5">5. Cambios en esta política</h2>
        <p>
          Publicaremos siempre la versión vigente en esta misma URL con la fecha de
          actualización. Si los cambios afectan a categorías sometidas a consentimiento,
          te volveremos a pedir que confirmes tus preferencias.
        </p>
      </section>
    </LegalPageLayout>
  );
}
