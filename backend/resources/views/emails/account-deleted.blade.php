<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cuenta eliminada · ONEZ</title>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E8E6E1;">
        <tr>
          <td style="padding:40px 48px 24px;background:#E1F5EE;border-bottom:1px solid #E8E6E1;border-radius:16px 16px 0 0;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#888780;letter-spacing:0.06em;text-transform:uppercase;">ONEZ · Cuenta</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:600;color:#0B1F1A;">Tu cuenta se ha eliminado</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#2C2C2A;">
              Hola <strong style="color:#0B1F1A;">{{ $name }}</strong>, confirmamos que tu cuenta ONEZ y los datos personales asociados han sido suprimidos según tu solicitud.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;border:1px solid #E8E6E1;border-radius:12px;margin:0 0 24px;">
              <tr>
                <td style="padding:18px 22px;font-size:13.5px;line-height:1.55;color:#2C2C2A;">
                  <p style="margin:0 0 8px;"><span style="color:#888780;">Fecha y hora:</span> <strong style="color:#0B1F1A;">{{ $fecha }} · {{ $hora }}</strong></p>
                  <p style="margin:0;"><span style="color:#888780;">IP:</span> <strong style="color:#0B1F1A;font-family:ui-monospace,monospace;font-size:12.5px;">{{ $requestIp }}</strong></p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#2C2C2A;">
              Tu página pública ya no está visible. Si tenías una suscripción Pro, se ha cancelado y no se realizarán más cargos.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.55;color:#2C2C2A;">
              Conservamos únicamente la información exigida por obligaciones legales y fiscales (p. ej. facturas). Si no fuiste tú quien solicitó esta eliminación, contacta con <a href="{{ $supportUrl }}" style="color:#0F6E56;">soporte</a> de inmediato.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
