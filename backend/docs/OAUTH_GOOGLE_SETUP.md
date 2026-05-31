# Configuración OAuth con Google

## En Google Cloud Console

1. Ir a https://console.cloud.google.com/
2. Crear proyecto (o usar existente) **ONEZ**
3. **APIs y servicios → Pantalla de consentimiento OAuth:**
   - Tipo de usuario: **External**
   - Nombre app: **ONEZ**
   - Email de soporte: tu email
   - Dominios autorizados: `onez.es`
   - Email del desarrollador: tu email
4. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0:**
   - Tipo de aplicación: **Aplicación web**
   - Nombre: **ONEZ Backend**
   - **Orígenes JavaScript autorizados:**
     - `http://localhost` (dev con Docker/nginx en puerto 80)
     - `http://localhost:8000` (solo si usas `php artisan serve`)
     - `https://api.onez.es` (prod) — ajustar al dominio real del backend
   - **URIs de redireccionamiento autorizadas:**
     - `http://localhost/api/v1/auth/google/callback` (Docker, puerto 80)
     - `http://localhost:8000/api/v1/auth/google/callback` (solo con `php artisan serve`)
     - `https://api.onez.es/api/v1/auth/google/callback` (prod)
     - Una entrada por cada entorno: des, pre, prod
5. Copiar **Client ID** y **Client Secret**

## En el `.env` del backend (cada entorno)

```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://api.onez.es/api/v1/auth/google/callback
```

En local:

```env
GOOGLE_REDIRECT_URI=http://localhost/api/v1/auth/google/callback
```

También disponibles en `backend/.env.example` como referencia.

## Verificación rápida

```bash
cd backend
php artisan tinker --execute="echo config('services.google.client_id');"
```

Debe devolver el `client_id` configurado (no vacío).

Comprobar que la URI de callback coincide **exactamente** con la registrada en Google Cloud (incluye protocolo, host, puerto y path).

## Desarrollo local (Docker + Vite)

- **Inicio OAuth:** el botón debe ir a `http://localhost/api/v1/auth/google/redirect` (puerto 80), no a `:5173`. El callback de Google también apunta a `http://localhost`.
- **`.env`:** `GOOGLE_REDIRECT_URI=http://localhost/api/v1/auth/google/callback` y la misma URI en Google Cloud.
- Si ves `social_error=oauth_failed` y en logs `Session store not set on request`, reinicia `php`/`nginx` tras actualizar el código (callback con sesión + Socialite `stateless()`).

## Flujo en la aplicación

1. El SPA llama a `GET /api/v1/auth/google/redirect` (navegación completa, no JSON).
2. Laravel redirige a Google.
3. Google devuelve a `GOOGLE_REDIRECT_URI` → `GoogleCallbackController`.
4. Tras login de sesión, el backend redirige al frontend (`FRONTEND_URL`):
   - Usuario nuevo o sin negocio/términos → `/register/social`
   - Onboarding pendiente → `/onboarding`
   - Listo → `/dashboard`
5. Errores OAuth → `/login?social_error=oauth_failed` o `no_email`.

## Frontend

- Botón Google en login/registro: `startGoogleOAuth()` en `front/src/lib/socialAuth.ts`
- Completar registro social: `POST /api/v1/auth/social/complete-registration` desde `/register/social`

## Tests automatizados

```bash
cd backend
php artisan test tests/Feature/Api/SocialAuthTest.php
```
