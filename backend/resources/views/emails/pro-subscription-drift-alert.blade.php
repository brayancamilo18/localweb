<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Auditoría Pro · ONEZ</title>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;color:#0B1F1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #E5E2DC;border-radius:12px;">
      <tr><td style="padding:24px 28px 12px;">
        <div style="font-size:13px;color:#888780;letter-spacing:.04em;text-transform:uppercase;">ONEZ · Auditoría diaria</div>
        <h1 style="margin:8px 0 0;font-size:22px;color:#0B1F1A;">{{ $totalDrifts }} {{ $totalDrifts === 1 ? 'alerta' : 'alertas' }} de drift Pro</h1>
        <div style="margin-top:6px;font-size:13px;color:#5F5C56;">Generado el {{ $generatedAt }} UTC</div>
      </td></tr>

      <tr><td style="padding:16px 28px;border-top:1px solid #EEE9E1;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#0B1F1A;">
          <tr>
            <td style="padding:4px 0;color:#5F5C56;">Auditados Pro/Pending</td>
            <td align="right" style="padding:4px 0;font-variant-numeric:tabular-nums;">{{ number_format($auditedPro, 0, ',', '.') }}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#5F5C56;">Auditados Free con stripe_id</td>
            <td align="right" style="padding:4px 0;font-variant-numeric:tabular-nums;">{{ number_format($auditedFreeWithStripe, 0, ',', '.') }}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#5F5C56;">Cuentas comp (Pro sin Stripe)</td>
            <td align="right" style="padding:4px 0;font-variant-numeric:tabular-nums;">{{ number_format($compAccounts, 0, ',', '.') }}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#5F5C56;">Alertas previas cerradas en esta pasada</td>
            <td align="right" style="padding:4px 0;font-variant-numeric:tabular-nums;">{{ number_format($resolvedNow, 0, ',', '.') }}</td>
          </tr>
        </table>
      </td></tr>

      @if (count($drifts) > 0)
      <tr><td style="padding:16px 28px 8px;border-top:1px solid #EEE9E1;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#0B1F1A;">
          Detalle de drift
          @if ($remainingDrifts > 0)
            <span style="font-size:12px;font-weight:400;color:#5F5C56;">(primeros {{ count($drifts) }} de {{ $totalDrifts }})</span>
          @endif
        </h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;border-collapse:collapse;">
          <thead>
            <tr style="background:#F8F5EF;">
              <th align="left" style="padding:8px 10px;border-bottom:1px solid #EEE9E1;font-weight:600;">Negocio</th>
              <th align="left" style="padding:8px 10px;border-bottom:1px solid #EEE9E1;font-weight:600;">Email</th>
              <th align="left" style="padding:8px 10px;border-bottom:1px solid #EEE9E1;font-weight:600;">Tipo</th>
              <th align="left" style="padding:8px 10px;border-bottom:1px solid #EEE9E1;font-weight:600;">Stripe status</th>
            </tr>
          </thead>
          <tbody>
            @foreach ($drifts as $d)
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid #F4EFE6;vertical-align:top;">
                <div style="font-weight:600;">{{ $d['business_name'] ?? '—' }}</div>
                <div style="font-size:11px;color:#888780;">#{{ $d['business_id'] }} · {{ $d['subdomain'] ?? '—' }}</div>
              </td>
              <td style="padding:8px 10px;border-bottom:1px solid #F4EFE6;vertical-align:top;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;">{{ $d['user_email'] ?? '—' }}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #F4EFE6;vertical-align:top;">
                <code style="background:#FEF2F2;color:#991B1B;padding:2px 6px;border-radius:4px;font-size:11px;">{{ $d['drift_type'] }}</code>
                <div style="font-size:11px;color:#5F5C56;margin-top:4px;">{{ $d['note'] ?? '' }}</div>
              </td>
              <td style="padding:8px 10px;border-bottom:1px solid #F4EFE6;vertical-align:top;font-size:12px;color:#5F5C56;">{{ $d['subscription_status'] ?? '—' }}</td>
            </tr>
            @endforeach
          </tbody>
        </table>

        @if ($remainingDrifts > 0)
        <div style="margin-top:16px;padding:12px 14px;background:#FEF9C3;border:1px solid #FACC15;border-radius:8px;font-size:13px;color:#854D0E;">
          <strong>+ {{ number_format($remainingDrifts, 0, ',', '.') }} alertas más no mostradas.</strong>
          Consulta el listado completo en BD:
          <code style="display:block;margin-top:6px;background:#fff;padding:8px 10px;border-radius:4px;font-size:12px;color:#0B1F1A;">SELECT * FROM pro_drift_alerts WHERE resolved_at IS NULL ORDER BY detected_at DESC;</code>
          Si ves este aviso de forma recurrente, probablemente algo está roto en los webhooks Stripe — revisa el dashboard de Stripe (Developers → Webhooks → delivery success rate).
        </div>
        @endif
      </td></tr>
      @else
      <tr><td style="padding:16px 28px 24px;border-top:1px solid #EEE9E1;color:#0F6E56;font-size:14px;">
        Sin drift detectado. Todos los negocios Pro/Pending tienen suscripción Stripe correspondiente.
      </td></tr>
      @endif

      <tr><td style="padding:16px 28px 24px;border-top:1px solid #EEE9E1;font-size:11px;color:#888780;line-height:1.5;">
        Las alertas se almacenan en `pro_drift_alerts`. Cada drift se mantiene «abierto» (resolved_at NULL) hasta que la siguiente auditoría detecte que la condición ya no se da, momento en que se cierra automáticamente. Pasadas idempotentes: ejecutar el comando dos veces seguidas no duplica filas. Para purgar alertas resueltas antiguas: `php artisan app:audit-pro-subscriptions --prune-resolved-days=180`.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
