import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LegalPageLayout } from '../../components/legal/LegalPageLayout'
import { LegalPlaceholder as Placeholder } from '../../components/legal/LegalEntity'
import { legalContactEmail, legalRoutes } from '../../lib/legal'
const PAGE_TITLE = 'Política de Privacidad · ONEZ'
const PAGE_DESCRIPTION = 'Cómo tratamos tus datos personales en ONEZ: finalidades, bases legales, plazos y derechos.'

const toc = [
  { id: "1-responsable", label: "1. Responsable del tratamiento" },
  { id: "2-datos", label: "2. Datos, finalidades y bases legales" },
  { id: "3-destinatarios", label: "3. Destinatarios y transferencias" },
  { id: "4-plazos", label: "4. Plazos de conservación" },
  { id: "5-derechos", label: "5. Tus derechos" },
  { id: "6-comunicaciones", label: "6. Comunicaciones comerciales" },
  { id: "7-cookies", label: "7. Cookies" },
  { id: "8-seguridad", label: "8. Seguridad" },
  { id: "9-menores", label: "9. Menores" },
  { id: "10-cambios", label: "10. Cambios en esta política" },
];

export default function PrivacidadPage() {
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
      title="Política de Privacidad"
      badge="Tus datos, tu control"
      subtitle="Tratamos tus datos con transparencia. Aquí te explicamos cómo."
      toc={toc}
    >
      <section id="1-responsable" aria-labelledby="h-1">
        <h2 id="h-1">1. Responsable del tratamiento</h2>
        <ul>
          <li><strong>Responsable:</strong> <Placeholder>[NOMBRE_TITULAR]</Placeholder></li>
          <li><strong>NIF/NIE:</strong> <Placeholder>[NIF_TITULAR]</Placeholder></li>
          <li><strong>Domicilio:</strong> <Placeholder>[DIRECCION_TITULAR]</Placeholder></li>
          <li><strong>Email de contacto:</strong> <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a></li>
        </ul>
        <p>
          No hemos designado un Delegado de Protección de Datos al no concurrir los
          supuestos del Art. 37 RGPD. Para cualquier cuestión escríbenos a{" "}
          <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>.
        </p>
      </section>

      <section id="2-datos" aria-labelledby="h-2">
        <h2 id="h-2">2. Datos que tratamos, finalidades y bases legales</h2>
        <p>Tratamos las siguientes categorías de datos:</p>
        <div className="lw-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Datos</th><th>Finalidad</th><th>Base legal (RGPD)</th><th>Plazo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nombre, email, contraseña (hash bcrypt)</td>
                <td>Crear y mantener tu cuenta, autenticación, avisos de servicio</td>
                <td>Ejecución del contrato (Art. 6.1.b)</td>
                <td>Cuenta activa + 6 meses</td>
              </tr>
              <tr>
                <td>Datos del negocio publicado (nombre comercial, dirección, teléfono, email público, fotos, horarios, redes sociales)</td>
                <td>Generar tu página pública en &#123;subdominio&#125;.onez.es</td>
                <td>Ejecución del contrato (Art. 6.1.b)</td>
                <td>Cuenta activa</td>
              </tr>
              <tr>
                <td>Datos de pago (ID Stripe, marca y últimos 4 dígitos de la tarjeta, estado de suscripción)</td>
                <td>Gestionar tu suscripción al plan Pro</td>
                <td>Ejecución del contrato (Art. 6.1.b)</td>
                <td>Suscripción activa. Datos fiscales de facturas: <strong>6 años</strong></td>
              </tr>
              <tr>
                <td>Uso de la plataforma (logs, IP, user-agent, sesión)</td>
                <td>Seguridad y mantenimiento de sesión</td>
                <td>Interés legítimo (Art. 6.1.f) y contrato (Art. 6.1.b)</td>
                <td>12 meses</td>
              </tr>
              <tr>
                <td>Hash HMAC-SHA256 de la IP de visitantes + user-agent + tipo de evento</td>
                <td>Estadísticas agregadas para que veas la actividad de tu página</td>
                <td>Interés legítimo (Art. 6.1.f). No es posible identificar al visitante</td>
                <td>24 meses</td>
              </tr>
              <tr>
                <td>Email para marketing propio</td>
                <td>Avisos de novedades y ofertas de ONEZ</td>
                <td>Consentimiento expreso (Art. 6.1.a) o Art. 21.2 LSSI cuando ya eres cliente</td>
                <td>Hasta que retires el consentimiento</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2.1. Datos del titular de la cuenta</h3>
        <p>
          Al registrarte recogemos tu <strong>nombre</strong> y{" "}
          <strong>correo electrónico</strong>, y generamos un{" "}
          <strong>hash bcrypt</strong> de tu contraseña. Jamás almacenamos la contraseña
          en claro: ni siquiera nosotros podemos consultarla.
        </p>

        <h3>2.2. Datos del negocio</h3>
        <p>
          Para construir tu página pública nos facilitas: nombre comercial, sector,
          descripción, logo, fotografías, dirección postal, teléfono, email público de
          contacto, horarios, servicios y precios, y opcionalmente URLs de Instagram,
          TikTok, Facebook, Google Maps, ficha Google Business y reservas.
        </p>
        <p>
          Calculamos las <strong>coordenadas geográficas</strong> de tu dirección
          consultando <strong>Nominatim de OpenStreetMap</strong> (Reino Unido). En esa
          consulta solo enviamos la dirección, no datos de tus visitantes.
        </p>

        <h3>2.3. Datos de pago</h3>
        <p>
          El pago lo procesa <strong>Stripe Payments Europe, Ltd.</strong> (Irlanda). El
          número completo de tu tarjeta, CVC y dirección de facturación los gestiona
          directamente Stripe. ONEZ solo almacena el identificador de cliente Stripe, la
          marca de la tarjeta y los <strong>últimos 4 dígitos</strong>.
        </p>

        <h3>2.4. Datos de los visitantes de tu página pública</h3>
        <p>
          Cuando alguien entra en &#123;subdominio&#125;.onez.es registramos un{" "}
          <strong>hash irreversible (HMAC-SHA256 con sal secreta) de la IP</strong>, el
          navegador (user-agent) y el tipo de evento (visita, click en WhatsApp, click en
          teléfono). La IP en claro <strong>nunca</strong> se almacena. La base jurídica
          es el interés legítimo del titular de la cuenta en conocer la actividad de su
          propia página.
        </p>
      </section>

      <section id="3-destinatarios" aria-labelledby="h-3">
        <h2 id="h-3">3. Destinatarios y transferencias internacionales</h2>
        <p>
          Compartimos parte de tus datos con los siguientes encargados del tratamiento
          (Art. 28 RGPD):
        </p>
        <div className="lw-table-wrap">
          <table>
            <thead>
              <tr><th>Proveedor</th><th>Función</th><th>País</th></tr>
            </thead>
            <tbody>
              <tr><td>Stripe Payments Europe, Ltd.</td><td>Procesamiento de pagos y suscripciones</td><td>Irlanda (UE), con transferencias a EE.UU. al amparo del Data Privacy Framework</td></tr>
              <tr><td>Cloudflare, Inc. (servicio R2)</td><td>Almacenamiento de imágenes</td><td>UE</td></tr>
              <tr><td>Proveedor de hosting backend</td><td>Base de datos y ejecución del servicio</td><td>UE</td></tr>
              <tr><td>Proveedor de correo transaccional (Hostinger / Mailgun / Postmark / Resend)</td><td>Verificación, recuperación, bienvenida Pro</td><td>UE</td></tr>
              <tr><td>OpenStreetMap Foundation (Nominatim)</td><td>Geocodificación de direcciones</td><td>Reino Unido</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>No vendemos, alquilamos ni cedemos tus datos a terceros con fines comerciales.</strong></p>
        <p>
          Las transferencias internacionales se realizan con garantías: EU-US Data Privacy
          Framework, Cláusulas Contractuales Tipo y cifrado en tránsito y en reposo.
        </p>
      </section>

      <section id="4-plazos" aria-labelledby="h-4">
        <h2 id="h-4">4. Plazos de conservación</h2>
        <p>
          Conservamos cada dato durante el plazo indicado en la tabla del apartado 2.
          Reglas generales:
        </p>
        <ul>
          <li><strong>Cuenta y negocio:</strong> mientras esté activa la cuenta + 6 meses tras la baja (salvo supresión inmediata si la pides).</li>
          <li><strong>Datos de facturas:</strong> <strong>6 años</strong> (obligación legal Art. 30 Código de Comercio y LGT 58/2003).</li>
          <li><strong>Analítica de página (page_visits):</strong> 24 meses, ya pseudonimizados desde el primer momento.</li>
          <li><strong>Logs técnicos con IPs:</strong> 12 meses máximo.</li>
          <li><strong>Correspondencia con soporte o privacidad:</strong> 3 años (prescripción Art. 1964 CC).</li>
        </ul>
      </section>

      <section id="5-derechos" aria-labelledby="h-5">
        <h2 id="h-5">5. Tus derechos</h2>
        <p>Tienes derecho a:</p>
        <ul>
          <li><strong>Acceso</strong> (Art. 15 RGPD)</li>
          <li><strong>Rectificación</strong> (Art. 16 RGPD)</li>
          <li><strong>Supresión</strong> o "derecho al olvido" (Art. 17 RGPD)</li>
          <li><strong>Limitación del tratamiento</strong> (Art. 18 RGPD)</li>
          <li><strong>Portabilidad</strong> (Art. 20 RGPD)</li>
          <li><strong>Oposición</strong> (Art. 21 RGPD), incluida la oposición al marketing en cualquier momento</li>
          <li><strong>No ser objeto de decisiones automatizadas</strong> con efectos significativos (Art. 22 RGPD). ONEZ no toma este tipo de decisiones.</li>
          <li><strong>Retirar el consentimiento</strong> que hayas otorgado.</li>
        </ul>
        <p>
          <strong>Cómo ejercerlos:</strong> envíanos un email a{" "}
          <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a> desde la dirección
          registrada. Te responderemos en el plazo máximo de <strong>un mes</strong>,
          prorrogable a dos si la solicitud es compleja.
        </p>
        <p>
          <strong>Reclamación ante la AEPD:</strong> Si crees que no atendemos bien tu
          solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
          (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>,{" "}
          <a href="https://sedeagpd.gob.es" target="_blank" rel="noopener noreferrer">sedeagpd.gob.es</a>,
          C/ Jorge Juan 6, 28001 Madrid). Te agradeceríamos que nos dieras la oportunidad
          de resolverlo antes.
        </p>
      </section>

      <section id="6-comunicaciones" aria-labelledby="h-6">
        <h2 id="h-6">6. Comunicaciones comerciales</h2>
        <p>
          Si has marcado la casilla correspondiente, podemos usar tu email para enviarte
          novedades, mejoras y ofertas de ONEZ. Cada email comercial incluirá un enlace
          para darte de baja con un solo clic, y también puedes hacerlo escribiendo a{" "}
          <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>.
        </p>
        <p><strong>No cedemos tu email a terceros para que ellos te envíen publicidad.</strong></p>
        <p>
          Los <strong>correos transaccionales</strong> (verificación, recuperación de
          contraseña, recibos del plan Pro) no se pueden desactivar mientras tengas
          cuenta activa, porque son imprescindibles para el servicio.
        </p>
      </section>

      <section id="7-cookies" aria-labelledby="h-7">
        <h2 id="h-7">7. Cookies</h2>
        <p>
          Utilizamos cookies conforme a nuestra{" "}
          <Link to={legalRoutes.cookies}>Política de Cookies</Link>, que forma parte integrante de
          esta política.
        </p>
      </section>

      <section id="8-seguridad" aria-labelledby="h-8">
        <h2 id="h-8">8. Seguridad</h2>
        <p>
          Aplicamos cifrado de contraseñas (bcrypt), HTTPS, cookies HttpOnly, protección
          CSRF, pseudonimización de IPs de visitantes, control de acceso por roles y
          copias de seguridad. Si detectamos una brecha que afecte a tus datos, te lo
          notificaremos conforme al RGPD.
        </p>
      </section>

      <section id="9-menores" aria-labelledby="h-9">
        <h2 id="h-9">9. Menores</h2>
        <p>
          ONEZ está dirigido a mayores de edad que actúan en su actividad profesional. No
          tratamos conscientemente datos de menores. Si tienes constancia de lo contrario,
          escríbenos a <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>.
        </p>
      </section>

      <section id="10-cambios" aria-labelledby="h-10">
        <h2 id="h-10">10. Cambios en esta política</h2>
        <p>
          Publicaremos siempre la versión vigente en esta misma URL indicando la fecha de
          actualización. Si los cambios son sustanciales te avisaremos por email.
        </p>
      </section>
    </LegalPageLayout>
  );
}
