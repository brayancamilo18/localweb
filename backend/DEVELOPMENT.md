# Auth: Sanctum SPA mode (cookie + CSRF)

El SPA propio se autentica con **cookies de sesión HttpOnly + CSRF**, no con
bearer tokens. Esto elimina la superficie de XSS contra el token (90 días de
sesión robable desde `localStorage` → 0).

## Cómo funciona el flujo en el navegador

1. El SPA llama `GET /sanctum/csrf-cookie` antes de la primera mutación. La
   respuesta es `204 No Content` con dos cookies: `XSRF-TOKEN` (legible por JS,
   solo para que axios la lea y reenvíe) y `localweb_session` (HttpOnly; nombre
   heredado de `APP_NAME` anterior — ver `config/session.php` antes de renombrar).
2. Cualquier `POST/PUT/PATCH/DELETE` debe llevar el header `X-XSRF-TOKEN` con
   el valor de la cookie `XSRF-TOKEN`. Axios lo hace automáticamente cuando
   `withCredentials: true` y los nombres por defecto coinciden.
3. `EnsureFrontendRequestsAreStateful` (registrado en `bootstrap/app.php` con
   `$middleware->statefulApi()`) detecta que `Origin`/`Referer` está en
   `SANCTUM_STATEFUL_DOMAINS` y, solo entonces, aplica `StartSession +
   ValidateCsrfToken`. Para orígenes externos sigue siendo bearer puro.
4. `auth:sanctum` resuelve el usuario por la cookie de sesión (guard `web`)
   primero; si no, intenta bearer (compat third-party).

## Variables de entorno (revisar antes de desplegar)

| Variable | Dev | Prod |
|---|---|---|
| `APP_URL` | `http://localhost` | `https://api.onez.es` (con HTTPS, dominio, no IP) |
| `SESSION_DRIVER` | `redis` | `redis` |
| `SESSION_DOMAIN` | `localhost` | `.onez.es` (punto inicial: comparte cookie entre `onez.es` y `api.onez.es`) |
| `SESSION_SAME_SITE` | `lax` | `lax` |
| `SESSION_SECURE_COOKIE` | `false` | **`true`** (obligatorio bajo HTTPS) |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:5173,localhost:4173,127.0.0.1:5173,127.0.0.1:4173` | `app.onez.es,onez.es` |
| `CORS_ALLOWED_ORIGINS` | (default) | `https://onez.es,https://app.onez.es` |

Requisito de arquitectura: SPA y API deben compartir eTLD+1. Si despliegas el
SPA en un dominio totalmente distinto (Vercel, etc.), la cookie de sesión no
viajará y debes volver a un esquema con tokens.

## Pruebas

- Feature tests existentes (Pest): autenticación con `actingAs($user)` (web
  guard); el `TestCase` base inyecta `Origin: http://localhost` para que el
  middleware stateful active `StartSession`.
- `tests/Feature/Api/SanctumCookieFlowTest.php`: simula el contrato real
  (`csrf-cookie → login con XSRF-TOKEN → me con cookie → logout invalida`).

## Compatibilidad con tokens

`HasApiTokens` sigue en `User` y `auth:sanctum` resuelve bearer si la cookie
no aplica. Útil si en el futuro se expone una API pública para integraciones
third-party. Para el SPA propio NO se generan ya tokens en login/register.

---

# Desarrollo local con Stripe

## Requisitos
- Stripe CLI instalado: https://stripe.com/docs/stripe-cli
- Cuenta Stripe en modo test

## Pasos para levantar el entorno completo

Terminal 1 — Laravel:
```bash
cd webappdef/backend
php artisan serve
```

Terminal 2 — Queue worker (necesario para procesar webhooks):
```bash
cd webappdef/backend
php artisan queue:work --tries=3
```

Terminal 3 — Stripe webhook forwarding:
```bash
stripe listen --forward-to http://127.0.0.1:8000/stripe/webhook
```

Terminal 4 — Frontend React:
```bash
cd webappdef/front
npm run dev
```

## Variables de entorno necesarias
Las variables `STRIPE_*` ya están configuradas en `.env` para el entorno de test.
El `STRIPE_WEBHOOK_SECRET` debe ser el que genera `stripe listen` (se renueva cada vez que ejecutas `stripe listen` — actualiza `.env` si cambia).

## Tarjetas de prueba Stripe
- Pago exitoso: `4242 4242 4242 4242`
- Pago rechazado: `4000 0000 0000 0002`
- Requiere 3D Secure: `4000 0025 0000 3155`
- Fondos insuficientes: `4000 0000 0000 9995`

Fecha: cualquiera futura | CVC: cualquier 3 dígitos | CP: cualquier 5 dígitos
