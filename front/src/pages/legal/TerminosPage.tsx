import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LegalPageLayout } from '../../components/legal/LegalPageLayout'
import { LegalPlaceholder as Placeholder } from '../../components/legal/LegalEntity'
import { legalContactEmail, legalRoutes } from '../../lib/legal'
const PAGE_TITLE = 'Términos y Condiciones · ONEZ'
const PAGE_DESCRIPTION = 'Condiciones de uso y contratación del servicio ONEZ, incluyendo plan Free y plan Pro (8,99 €/mes).'

const toc = [
  { id: "1-titularidad", label: "1. Titularidad e identificación" },
  { id: "2-objeto", label: "2. Objeto del servicio" },
  { id: "3-requisitos", label: "3. Requisitos para contratar" },
  { id: "4-cuenta", label: "4. Cuenta de Usuario" },
  { id: "5-planes", label: "5. Planes y precios" },
  { id: "6-desistimiento", label: "6. Derecho de desistimiento" },
  { id: "7-obligaciones", label: "7. Obligaciones del Usuario" },
  { id: "8-suspension", label: "8. Suspensión y cancelación" },
  { id: "9-propiedad", label: "9. Propiedad intelectual" },
  { id: "10-disponibilidad", label: "10. Disponibilidad y garantías" },
  { id: "11-datos", label: "11. Protección de datos" },
  { id: "12-cesion", label: "12. Cesión" },
  { id: "13-modificaciones", label: "13. Modificaciones" },
  { id: "14-nulidad", label: "14. Nulidad parcial" },
  { id: "15-comunicaciones", label: "15. Comunicaciones" },
  { id: "16-ley", label: "16. Ley aplicable y jurisdicción" },
];

export default function TerminosPage() {
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
      title="Términos y Condiciones"
      badge="Reglas del servicio"
      subtitle="Las reglas que rigen el uso del servicio ONEZ."
      toc={toc}
    >
      <section id="1-titularidad" aria-labelledby="h-1">
        <h2 id="h-1">1. Titularidad e identificación</h2>
        <ul>
          <li><strong>Titular:</strong> <Placeholder>[NOMBRE_TITULAR]</Placeholder></li>
          <li><strong>NIF/NIE:</strong> <Placeholder>[NIF_TITULAR]</Placeholder></li>
          <li><strong>Domicilio:</strong> <Placeholder>[DIRECCION_TITULAR]</Placeholder></li>
          <li><strong>Email de contacto:</strong> <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a></li>
        </ul>
        <p>
          El resto de información requerida por la LSSI está en el{" "}
          <Link to={legalRoutes.avisoLegal}>Aviso Legal</Link>.
        </p>
      </section>

      <section id="2-objeto" aria-labelledby="h-2">
        <h2 id="h-2">2. Objeto del servicio</h2>
        <p>ONEZ ofrece:</p>
        <ul>
          <li>a) <strong>Plataforma de creación de páginas web</strong> mediante un asistente guiado (onboarding) que combina la información del negocio con una plantilla visual.</li>
          <li>b) <strong>Alojamiento y publicación</strong> de la página en &#123;nombre&#125;.onez.es o, en el plan Pro, en un dominio propio.</li>
          <li>c) <strong>Panel de control</strong> para editar contenidos, ver estadísticas y gestionar la suscripción.</li>
          <li>d) <strong>Servicios complementarios</strong> como código QR, vCard descargable (plan Pro) y programa de invitación con incentivos.</li>
        </ul>
      </section>

      <section id="3-requisitos" aria-labelledby="h-3">
        <h2 id="h-3">3. Requisitos para contratar</h2>
        <p>
          El Usuario debe ser <strong>mayor de edad</strong> y tener capacidad legal para
          contratar, actuar en su propio nombre o con poder bastante si lo hace por una
          persona jurídica, facilitar <strong>información veraz</strong> y custodiar sus
          credenciales notificando cualquier acceso no autorizado a{" "}
          <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>.
        </p>
      </section>

      <section id="4-cuenta" aria-labelledby="h-4">
        <h2 id="h-4">4. Cuenta de Usuario</h2>
        <p>
          El alta es gratuita. El acceso al servicio requiere que verifiques tu correo
          electrónico haciendo clic en el enlace que te enviamos (válido 60 minutos). Si
          caduca, puedes pedir uno nuevo desde la pantalla de verificación.
        </p>
        <p>
          El Usuario es responsable de la confidencialidad de su contraseña y de toda la
          actividad realizada desde su cuenta.
        </p>
      </section>

      <section id="5-planes" aria-labelledby="h-5">
        <h2 id="h-5">5. Planes y precios</h2>

        <h3>5.1. Plan Free</h3>
        <p>
          Gratuito. Incluye página publicada en &#123;subdominio-aleatorio&#125;.onez.es,
          hasta 3 fotografías, edición básica, sin analítica de visitas y con marca
          "Hecho con ONEZ" visible.
        </p>

        <h3>5.2. Plan Pro</h3>
        <p>
          Suscripción mensual de pago recurrente a <strong>8,99 €/mes</strong> (IVA
          incluido si aplicable). Incluye subdominio personalizado o{" "}
          <strong>dominio propio</strong>, hasta 20 fotos, analítica de visitas (90
          días), vCard descargable, sin marca y soporte prioritario.
        </p>
        <p>
          ONEZ podrá modificar el precio notificándolo por email con{" "}
          <strong>30 días de antelación</strong>, durante los cuales podrás cancelar sin
          penalización.
        </p>

        <h3>5.3. Pago</h3>
        <p>
          El pago se procesa íntegramente con{" "}
          <strong>Stripe Payments Europe, Ltd.</strong> ONEZ no almacena el número
          completo de la tarjeta, CVC ni dirección de facturación.
        </p>
        <p>
          El cobro es automático cada mes. Si falla, Stripe reintenta. Tras varios
          intentos fallidos podemos suspender las funcionalidades Pro y dar de baja la
          suscripción.
        </p>

        <h3>5.4. Cancelación</h3>
        <p>
          Puedes cancelar el plan Pro en cualquier momento desde el Portal de Cliente de
          Stripe (Mi cuenta → Facturación). La cancelación surte efecto al{" "}
          <strong>final del periodo en curso</strong>.
        </p>
        <p>
          <strong>No se realizan reembolsos</strong> de cuotas ya cobradas
          correspondientes a periodos en curso, salvo obligación legal, error material o
          decisión discrecional.
        </p>

        <h3>5.5. Promociones y referidos</h3>
        <p>
          Podemos ofrecer cupones o promociones (por ejemplo, mes gratis para invitados,
          recompensas para invitadores). Las condiciones se comunicarán al aplicarlas.
          Los cupones son{" "}
          <strong>personales, intransferibles y no canjeables por dinero</strong>.
        </p>
      </section>

      <section id="6-desistimiento" aria-labelledby="h-6">
        <h2 id="h-6">6. Derecho de desistimiento (consumidores)</h2>
        <p>
          Si tienes la condición de <strong>consumidor</strong> (contratas fuera del
          ámbito de una actividad profesional), tienes derecho a desistir en{" "}
          <strong>14 días naturales</strong> desde la contratación, sin justificación.
        </p>
        <p>
          Conforme al <strong>Art. 103.m TRLGDCU</strong>, este derecho{" "}
          <strong>no es aplicable</strong> cuando se trata de contenido digital ya
          ejecutado con tu consentimiento expreso previo y renuncia consciente al
          desistimiento. Al contratar el plan Pro <strong>solicitas expresamente</strong>{" "}
          que el servicio comience de inmediato y <strong>renuncias</strong> al
          desistimiento una vez ejecutado el periodo.
        </p>
        <p>
          Si actúas como <strong>autónomo o empresa</strong> en el ámbito de tu
          actividad, no eres consumidor y este artículo no aplica.
        </p>
      </section>

      <section id="7-obligaciones" aria-labelledby="h-7">
        <h2 id="h-7">7. Obligaciones del Usuario</h2>
        <p>El Usuario <strong>no podrá</strong>:</p>
        <ul>
          <li>a) Publicar contenidos ilícitos, falsos, engañosos, calumniosos, difamatorios, obscenos, racistas, xenófobos o que inciten al odio.</li>
          <li>b) Infringir derechos de propiedad intelectual o industrial de terceros.</li>
          <li>c) Vulnerar el derecho al honor, intimidad o propia imagen de terceros, ni publicar datos personales de terceros sin consentimiento.</li>
          <li>d) Realizar prácticas comerciales desleales, fraudes, esquemas piramidales o actividades sin licencia.</li>
          <li>e) Suplantar la identidad de terceros.</li>
          <li>f) Realizar scraping, ingeniería inversa, intentos de acceso no autorizado, DDoS o inyección de malware.</li>
          <li>g) Enviar spam desde los datos de contacto de su página.</li>
          <li>h) Revender o ceder el servicio sin autorización previa por escrito.</li>
        </ul>
        <p>
          El Usuario es el <strong>único responsable</strong> de los contenidos que
          publica. ONEZ actúa como prestador de servicios de alojamiento (Art. 16 LSSI).
        </p>
      </section>

      <section id="8-suspension" aria-labelledby="h-8">
        <h2 id="h-8">8. Suspensión y cancelación</h2>
        <p>
          ONEZ podrá suspender o cancelar la cuenta, retirar contenidos o despublicar la
          página por: incumplimiento de los Términos, comunicación fundada de un tercero
          o autoridad sobre ilicitud, impago reiterado, o detección de fraude.
        </p>
        <p>
          Cuando sea posible avisaremos al Usuario con un plazo razonable para subsanar.
          En cancelaciones por incumplimiento <strong>no procede devolución</strong> de
          cantidades ya abonadas.
        </p>
      </section>

      <section id="9-propiedad" aria-labelledby="h-9">
        <h2 id="h-9">9. Propiedad intelectual</h2>
        <h3>9.1. Sobre la plataforma</h3>
        <p>
          Todo el software, código, diseño, plantillas, textos, gráficos, logos e iconos
          del servicio son <strong>propiedad del titular</strong> o de los terceros que
          han autorizado su uso. La cuenta te concede únicamente una{" "}
          <strong>licencia personal, no exclusiva, no transferible y revocable</strong>{" "}
          para usar la plataforma.
        </p>
        <h3>9.2. Sobre los contenidos del Usuario</h3>
        <p>
          El Usuario <strong>conserva la titularidad</strong> de sus contenidos. Al
          subirlos garantiza que tiene derechos suficientes. Concede a ONEZ una{" "}
          <strong>licencia gratuita, no exclusiva, mundial y revocable</strong> limitada
          a alojarlos, mostrarlos públicamente en su página, generar versiones técnicas,
          hacer copias de seguridad y prestar el servicio.
        </p>
      </section>

      <section id="10-disponibilidad" aria-labelledby="h-10">
        <h2 id="h-10">10. Disponibilidad y garantías</h2>
        <p>
          ONEZ pone los medios razonables para garantizar la continuidad, pero{" "}
          <strong>no garantiza</strong> funcionamiento ininterrumpido ni ausencia de
          errores. El servicio puede verse afectado por mantenimientos, incidencias de
          proveedores tecnológicos (Stripe, Cloudflare, email, hosting) o fuerza mayor.
        </p>
        <p>
          ONEZ <strong>no será responsable</strong> de daños indirectos, pérdida de
          beneficios, oportunidades comerciales, datos del Usuario o reclamaciones de
          terceros, salvo dolo o culpa grave.
        </p>
        <p>
          La responsabilidad económica máxima queda limitada a{" "}
          <strong>las cantidades abonadas durante los 6 meses anteriores</strong> al
          hecho que origine la reclamación.
        </p>
        <p>
          Lo anterior no afecta a derechos irrenunciables que la normativa de consumo
          reconozca al consumidor.
        </p>
      </section>

      <section id="11-datos" aria-labelledby="h-11">
        <h2 id="h-11">11. Protección de datos</h2>
        <p>
          El tratamiento se rige por la{" "}
          <Link to={legalRoutes.privacidad}>Política de Privacidad</Link>, que el Usuario acepta al
          registrarse.
        </p>
      </section>

      <section id="12-cesion" aria-labelledby="h-12">
        <h2 id="h-12">12. Cesión</h2>
        <p>
          El Usuario <strong>no puede ceder</strong> su cuenta sin autorización previa
          por escrito.
        </p>
        <p>
          ONEZ podrá ceder los derechos y obligaciones (por ejemplo, al constituir una
          sociedad o vender el negocio) notificándolo con antelación razonable. El
          Usuario podrá cancelar sin penalización antes de la cesión si no está de
          acuerdo.
        </p>
      </section>

      <section id="13-modificaciones" aria-labelledby="h-13">
        <h2 id="h-13">13. Modificaciones</h2>
        <p>
          ONEZ podrá modificar estos Términos. Las modificaciones se publicarán en esta
          página. Los cambios <strong>sustanciales</strong> (precios, alcance del
          servicio, obligaciones esenciales) se notificarán por email con{" "}
          <strong>30 días de antelación</strong> durante los cuales podrás cancelar sin
          penalización.
        </p>
      </section>

      <section id="14-nulidad" aria-labelledby="h-14">
        <h2 id="h-14">14. Nulidad parcial</h2>
        <p>
          Si alguna disposición fuera declarada nula, las demás seguirán siendo válidas
          salvo que su mantenimiento desvirtuara el equilibrio contractual.
        </p>
      </section>

      <section id="15-comunicaciones" aria-labelledby="h-15">
        <h2 id="h-15">15. Comunicaciones</h2>
        <p>
          Las comunicaciones de ONEZ se enviarán al email registrado por el Usuario. Las
          del Usuario se dirigirán a{" "}
          <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>.
        </p>
      </section>

      <section id="16-ley" aria-labelledby="h-16">
        <h2 id="h-16">16. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por la <strong>legislación española</strong>. Las
          partes se someten a los Juzgados y Tribunales del domicilio del Usuario
          consumidor, o del titular cuando el Usuario actúe como profesional.
        </p>
        <p>
          Plataforma ODR de la UE:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
