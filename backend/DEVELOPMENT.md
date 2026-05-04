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
