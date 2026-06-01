import { useEffect } from 'react'
import { LegalPageLayout } from '../../components/legal/LegalPageLayout'
import { LegalPlaceholder as Placeholder } from '../../components/legal/LegalEntity'
import { legalContactEmail } from '../../lib/legal'

const PAGE_TITLE = 'Aviso Legal · ONEZ'
const PAGE_DESCRIPTION = 'Información legal del titular de ONEZ, la plataforma para crear tu web de negocio en menos de 10 minutos.'

const toc = [
  { id: "1-datos-del-titular", label: "1. Datos del titular" },
  { id: "2-objeto", label: "2. Objeto" },
  { id: "3-condiciones-de-acceso-y-uso", label: "3. Condiciones de acceso y uso" },
  { id: "4-propiedad-intelectual", label: "4. Propiedad intelectual e industrial" },
  { id: "5-enlaces-a-terceros", label: "5. Enlaces a terceros" },
  { id: "6-exclusion-de-garantias", label: "6. Exclusión de garantías y responsabilidad" },
  { id: "7-modificaciones", label: "7. Modificaciones" },
  { id: "8-legislacion-aplicable", label: "8. Legislación aplicable y jurisdicción" },
];

export default function AvisoLegalPage() {
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
      title="Aviso Legal"
      badge="Información legal del titular"
      subtitle="Datos identificativos del prestador del servicio ONEZ."
      toc={toc}
    >
      <section id="1-datos-del-titular" aria-labelledby="h-1">
        <h2 id="h-1">1. Datos del titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios
          de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa
          al usuario de los datos identificativos del titular del sitio web onez.es y de
          los servicios accesibles desde el mismo:
        </p>
        <ul>
          <li><strong>Titular:</strong> <Placeholder>[NOMBRE_TITULAR]</Placeholder></li>
          <li><strong>NIF/NIE:</strong> <Placeholder>[NIF_TITULAR]</Placeholder></li>
          <li><strong>Domicilio a efectos de notificaciones:</strong> <Placeholder>[DIRECCION_TITULAR]</Placeholder></li>
          <li><strong>Correo electrónico de contacto:</strong> <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a></li>
          <li><strong>Actividad económica:</strong> Servicios de creación, alojamiento y mantenimiento de páginas web profesionales para pequeños negocios mediante suscripción (plataforma ONEZ).</li>
        </ul>
      </section>

      <section id="2-objeto" aria-labelledby="h-2">
        <h2 id="h-2">2. Objeto</h2>
        <p>
          El presente Aviso Legal regula el acceso y uso del sitio web onez.es y de sus
          subdominios técnicos (app.onez.es, api.onez.es) así como de los subdominios
          públicos generados por los usuarios para sus negocios (&#123;subdominio&#125;.onez.es).
        </p>
        <p>
          El acceso al sitio web atribuye la condición de Usuario e implica la aceptación
          plena y sin reservas de las condiciones recogidas en este Aviso Legal, en la
          Política de Privacidad, en la Política de Cookies y en los Términos y
          Condiciones de uso.
        </p>
      </section>

      <section id="3-condiciones-de-acceso-y-uso" aria-labelledby="h-3">
        <h2 id="h-3">3. Condiciones de acceso y uso</h2>
        <p>
          El acceso al sitio web es gratuito, sin perjuicio del coste de conexión a
          internet del Usuario y de los servicios de pago que pueda contratar (plan Pro).
          El registro de una cuenta es necesario para utilizar el servicio ONEZ y está
          sujeto a los Términos y Condiciones de uso.
        </p>
        <p>
          El Usuario se compromete a hacer un uso adecuado y lícito del sitio web y de
          sus contenidos, y especialmente a no emplearlo para:
        </p>
        <ul>
          <li>a) Llevar a cabo actividades ilícitas, ilegales o contrarias a la buena fe y al orden público.</li>
          <li>b) Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico, ilegal o que atente contra los derechos humanos.</li>
          <li>c) Provocar daños en los sistemas físicos y lógicos del titular, de sus proveedores o de terceros, introducir o difundir virus informáticos.</li>
          <li>d) Intentar acceder a las cuentas de otros usuarios y modificar o manipular sus datos.</li>
          <li>e) Utilizar la plataforma para publicar páginas web cuyo contenido viole derechos de terceros, en particular derechos de propiedad intelectual o industrial, derecho al honor, a la intimidad o a la propia imagen.</li>
        </ul>
      </section>

      <section id="4-propiedad-intelectual" aria-labelledby="h-4">
        <h2 id="h-4">4. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos del sitio web (incluyendo textos, fotografías, gráficos,
          imágenes, iconos, software, código fuente, nombres comerciales, marcas o signos
          distintivos) son propiedad del titular o de los terceros que han autorizado su
          uso, y están protegidos por la legislación nacional e internacional sobre
          propiedad intelectual e industrial.
        </p>
        <p>
          Queda prohibida la reproducción, distribución, comunicación pública o
          transformación de dichos contenidos sin autorización previa, expresa y por
          escrito del titular, salvo los actos necesarios para acceder y utilizar el
          servicio dentro de los Términos y Condiciones aplicables.
        </p>
        <h3>Contenidos aportados por el Usuario</h3>
        <p>
          El Usuario conserva la titularidad de los contenidos (textos, fotos, logos,
          etc.) que sube a la plataforma. Al utilizar ONEZ otorga al titular una licencia
          gratuita, no exclusiva, mundial y revocable, limitada exclusivamente a
          alojarlos, mostrarlos públicamente en el subdominio del negocio, generar
          miniaturas y copias técnicas, y prestar el servicio en sí mismo, durante el
          tiempo que la cuenta del Usuario permanezca activa.
        </p>
      </section>

      <section id="5-enlaces-a-terceros" aria-labelledby="h-5">
        <h2 id="h-5">5. Enlaces a terceros</h2>
        <p>
          El sitio web puede contener enlaces a páginas y servicios de terceros (entre
          otros: Stripe para pagos, Google Maps para localización, Instagram, TikTok,
          Facebook, WhatsApp para botones de contacto del negocio del Usuario). El
          titular no controla dichos sitios ni asume responsabilidad alguna por sus
          contenidos.
        </p>
        <p>
          La inclusión de estos enlaces no implica ningún tipo de asociación o
          vinculación con las entidades a las que pertenecen, salvo la indicada
          expresamente en cada caso.
        </p>
      </section>

      <section id="6-exclusion-de-garantias" aria-labelledby="h-6">
        <h2 id="h-6">6. Exclusión de garantías y responsabilidad</h2>
        <p>
          El titular se compromete a poner los medios razonables para garantizar la
          continuidad y disponibilidad del servicio. No obstante, no garantiza la
          disponibilidad ininterrumpida ni la inexistencia de fallos, errores o
          interrupciones derivadas de caídas de los proveedores tecnológicos,
          mantenimientos programados, ataques externos o causas de fuerza mayor.
        </p>
        <p>El titular no será responsable de:</p>
        <ul>
          <li>a) Las pérdidas o daños derivados del uso indebido de la plataforma por parte del Usuario.</li>
          <li>b) Los contenidos publicados por el Usuario en su página pública.</li>
          <li>c) Los daños derivados de la imposibilidad de acceso temporal al servicio por causas ajenas al titular.</li>
          <li>d) El uso fraudulento de las credenciales del Usuario cuando no se haya notificado al titular el extravío o sustracción de las mismas.</li>
        </ul>
      </section>

      <section id="7-modificaciones" aria-labelledby="h-7">
        <h2 id="h-7">7. Modificaciones</h2>
        <p>
          El titular se reserva el derecho a modificar en cualquier momento los términos
          de este Aviso Legal. Las modificaciones se publicarán en esta misma página con
          indicación de la fecha de última actualización. Cuando los cambios sean
          sustanciales, se comunicará al Usuario por correo electrónico con un preaviso
          razonable.
        </p>
      </section>

      <section id="8-legislacion-aplicable" aria-labelledby="h-8">
        <h2 id="h-8">8. Legislación aplicable y jurisdicción</h2>
        <p>
          Las presentes condiciones se rigen por la legislación española. Para la
          resolución de cualquier controversia derivada del acceso o uso del sitio web,
          las partes se someten a los Juzgados y Tribunales del domicilio del Usuario
          consumidor o del domicilio del titular cuando el Usuario actúe como profesional.
        </p>
        <p>
          Los Usuarios consumidores residentes en la Unión Europea tienen a su
          disposición la plataforma de Resolución de Litigios en línea:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
