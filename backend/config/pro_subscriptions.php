<?php

return [
    'audit' => [
        // Email destinatario de la alerta diaria. Vacío = sólo se loguea en Monolog.
        'alert_email' => env('PRO_AUDIT_ALERT_EMAIL'),
        // Días que un plan 'pending' puede estar sin suscripción Stripe antes de
        // considerarse drift (checkout abandonado pero plan colgado).
        'pending_stale_days' => (int) env('PRO_AUDIT_PENDING_STALE_DAYS', 7),
        // Máximo de drifts a renderizar en el email; resto se cuenta como "y N más".
        // Protege contra mailbomb si un cambio rompe webhooks y aparecen miles de drifts.
        'email_max_displayed' => (int) env('PRO_AUDIT_EMAIL_MAX_DISPLAYED', 200),
    ],
];
