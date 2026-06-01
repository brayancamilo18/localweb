# Inventario rebrand LocalWeb → ONEZ

Generado con:

```bash
grep -rn -i "localweb" \
  --include='*.php' --include='*.ts' --include='*.tsx' \
  --include='*.js' --include='*.json' --include='*.md' \
  --include='*.yml' --include='*.yaml' --include='*.env*' --include='*.conf*' \
  backend/ front/src/ scripts/ docker/ *.md
```

Listado crudo completo (171 líneas, pre-cambios): `rebrand-inventory-raw.txt`.

## Leyenda

| Cat. | Significado |
|------|-------------|
| **(a)** | Marca visible al usuario → cambiado a ONEZ / onez.es |
| **(b)** | Config técnica → **no tocar** (rompe prod o sesiones) |
| **(c)** | Documentación / comentarios → actualizado |
| **(d)** | Ignorar (tests internos, boilerplate, artefactos compilados) |

## Resumen por categoría

### (b) No tocar — motivo

| Ubicación | Motivo |
|-----------|--------|
| `config/localweb.php` (nombre archivo y clave `config('localweb.*')`) | Namespace de config usado en decenas de archivos; renombrar rompe bootstrap sin migración coordinada. |
| `LOCALWEB_*` variables de entorno | Nombres de env en despliegues existentes; solo se actualizaron **valores por defecto** de URLs sociales. |
| `localweb_session` (vía `APP_NAME` slug + `config/session.php`) | Renombrar invalida todas las sesiones activas. **TODO** añadido en `session.php`. |
| `AWS_BUCKET=localweb`, `AWS_*`, MinIO en `docker-compose.yml` | Bucket/credenciales dev; renombrar en prod rompe objetos R2/S3 existentes. |
| `DB_DATABASE=localweb`, `MYSQL_*` en compose | Solo dev Docker. |
| `config/subdomains.php` → reservado `'localweb'` | Slug de subdominio bloqueado (infra), no marca UI. |
| `PublicPage.tsx`, `SubdomainSetupModal.tsx` → `'localweb'` en lista reservada | Igual: subdominio prohibido. |
| `backend/.env` (local del desarrollador) | Fuera de git; no modificado. |
| `backend/storage/framework/views/*.php` | Vistas compiladas; se regeneran con `view:clear`. |
| Emails `*@localweb.com` en tests Pest | Dominio ficticio de test; no expuesto a usuarios. |
| Contenedores `webappdef-*` en compose | Solo dev; explícitamente excluidos. |
| Ruta VPS `/var/www/onez/` | Ya correcta; sin cambios. |

### (a) Marca — aplicado

| Ubicación | Cambio |
|-----------|--------|
| Plantillas `resources/views/public/templates/*.blade.php` | `LocalWeb` → `ONEZ`, `localweb.es` → `onez.es`, redes por defecto → onez |
| `GeocodingService` User-Agent | `ONEZ/1.0 (app@onez.es)` |
| `BillingController` producto Stripe | `ONEZ Pro` |
| `BusinessService::generateSubdomainSuggestion` fallback | `onez` |
| `DevelopmentSeeder` nombre demo | `ONEZ Demo` |
| `config/localweb.php` defaults sociales | URLs onez.es / @onez |
| `config/public_page.php` mapa dominios | `app.onez.es`, `onez.es` |
| `front/.../publicTemplatePayload.ts` | Fallbacks sociales ONEZ |
| `front/.../AdminLayout.tsx` | `ONEZ` |
| `front/.../wizard.tsx`, tests toast/QR | Previews `*.app.onez.es` |
| `front/src/lib/tenant.ts` | Dominio público `app.onez.es` / `localhost` (sin localweb.es) |
| `.env.example` | `APP_NAME=ONEZ`, `MAIL_FROM_NAME="ONEZ"` |

### (c) Documentación — aplicado

| Ubicación | Cambio |
|-----------|--------|
| `backend/DEVELOPMENT.md` | Tabla env: `onez.es`, nota cookie `localweb_session` |
| `backend/.env.example` | Comentarios prod, APP_NAME, MAIL_FROM_NAME, nota bucket MinIO |
| `_styles.md` | ONEZ |
| `front/src/api/client.ts` | Comentario Sanctum / dominios |

### (d) Sin cambio

| Ubicación | Motivo |
|-----------|--------|
| Referencias `config('localweb.domains.*')` en PHP/tests | Clave de config (b), no string de marca |
| `.lw-src/localweb-app/` (si existe en repo) | Demo legacy fuera del alcance del producto |

## Verificación post-cambio

```bash
# No debe quedar marca en Log::info ni copy de plantillas (config keys OK):
grep -rn "LocalWeb" backend/app backend/resources/views --include='*.php'
grep -rn "localweb\.es" backend/resources/views front/src --include='*.php' --include='*.ts' --include='*.tsx'
```

## Coordinación pendiente (fuera de este PR)

1. **Cookie de sesión**: `localweb_session` → `onez_session` en ventana de mantenimiento (`SESSION_COOKIE` o `APP_NAME` ya en ONEZ solo afecta installs nuevas; prod con APP_NAME antiguo sigue igual).
2. **Bucket R2 `localweb`**: mantener nombre; documentado en `.env.example`.
3. **Renombrar `config/localweb.php` → `config/onez.php`**: refactor grande; opcional a largo plazo.
