<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Email de cuenta cambiado · ONEZ</title>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E8E6E1;">
        <tr>
          <td style="padding:40px 48px 24px;background:#E1F5EE;border-bottom:1px solid #E8E6E1;border-radius:16px 16px 0 0;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#888780;letter-spacing:0.06em;text-transform:uppercase;">ONEZ · Seguridad</p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:600;color:#0B1F1A;">Cambio de email en tu cuenta</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#2C2C2A;">
              Hola <strong style="color:#0B1F1A;">{{ $name }}</strong>, te avisamos porque la dirección de acceso de tu cuenta ONEZ acaba de cambiar.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;border:1px solid #E8E6E1;border-radius:12px;margin:0 0 24px;">
              <tr>
                <td style="padding:18px 22px;font-size:13.5px;line-height:1.55;color:#2C2C2A;">
                  <p style="margin:0 0 8px;"><span style="color:#888780;">Email anterior:</span> <strong style="color:#0B1F1A;">{{ $previousEmail }}</strong></p>
                  <p style="margin:0 0 8px;"><span style="color:#888780;">Nuevo email:</span> <strong style="color:#0B1F1A;">{{ $newEmailMasked }}</strong></p>
                  <p style="margin:0 0 8px;"><span style="color:#888780;">Fecha y hora:</span> <strong style="color:#0B1F1A;">{{ $fecha }} · {{ $hora }}</strong></p>
                  <p style="margin:0;"><span style="color:#888780;">IP:</span> <strong style="color:#0B1F1A;font-family:ui-monospace,monospace;font-size:12.5px;">{{ $requestIp }}</strong></p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#2C2C2A;">
              Si fuiste tú, puedes ignorar este mensaje. Si <strong>no</strong> autorizaste el cambio, recupera el acceso de inmediato y contacta con soporte.
            </p>
            <p style="margin:0 0 24px;">
              <a href="{{ $forgotPasswordUrl }}" style="display:inline-block;padding:14px 28px;background:#0F6E56;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">Recuperar acceso</a>
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;">
              <tr>
                <td style="padding:18px 22px;font-size:13px;line-height:1.55;color:#92400E;">
                  <strong style="color:#78350F;">¿No fuiste tú?</strong> Este aviso se envió a tu email anterior como medida de seguridad. Usa «Olvidé mi contraseña» y escríbenos a <a href="{{ $supportUrl }}" style="color:#0F6E56;">soporte</a>.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
