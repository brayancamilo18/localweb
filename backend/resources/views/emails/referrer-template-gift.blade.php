<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Referidor con {{ $count }} referidos pagadores · ONEZ</title>
<style>
  body{margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;}
  a{color:#0F6E56;text-decoration:none}
</style>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E8E6E1;">
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#888780;letter-spacing:0.04em;text-transform:uppercase;">Referidos · Admin</p>
            <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;font-weight:600;color:#0B1F1A;">
              {{ $referrerName }} ha llegado a {{ $count }} referidos pagadores
            </h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D4A45;">
              Este referidor ha alcanzado el umbral configurado. Toca asignarle la plantilla exclusiva a mano desde el panel de administración.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#F8F7F4;border:1px solid #E8E6E1;border-radius:12px;">
              <tr>
                <td style="padding:20px 24px;font-size:15px;line-height:1.7;color:#3D4A45;">
                  <strong style="color:#0B1F1A;">Nombre:</strong> {{ $referrerName }}<br/>
                  <strong style="color:#0B1F1A;">Email:</strong> {{ $referrerEmail }}<br/>
                  <strong style="color:#0B1F1A;">Business ID:</strong> {{ $referrerBusinessId ?? '—' }}
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;">
              <a href="{{ $adminBusinessUrl }}" style="display:inline-block;padding:14px 24px;background:#0F6E56;color:#FFFFFF;font-size:15px;font-weight:600;border-radius:10px;">
                Abrir negocio en admin
              </a>
            </p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#888780;">
              Enlace directo: <a href="{{ $adminBusinessUrl }}" style="color:#0F6E56;">{{ $adminBusinessUrl }}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
