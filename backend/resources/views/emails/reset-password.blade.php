<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Recupera tu contraseña · ONEZ</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  body{margin:0!important;padding:0!important;width:100%!important;background:#F3F2EF}
  a{color:#0F6E56;text-decoration:none}
  @media screen and (max-width:620px){
    .wrap{width:100%!important}
    .px{padding-left:24px!important;padding-right:24px!important}
    .h1{font-size:26px!important;line-height:1.2!important}
    .hero{padding:32px 24px!important}
    .cta a{display:block!important;text-align:center!important}
    .meta-row td{display:block!important;width:100%!important;padding:6px 0!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;">

<div style="display:none;font-size:1px;color:#F3F2EF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Crea una nueva contraseña para tu cuenta de ONEZ. El enlace caduca en {{ $expireMinutes }} minutos.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Brand top -->
        <tr>
          <td class="px" style="padding:0 8px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#0B1F1A;letter-spacing:-0.01em;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0F6E56;border-radius:6px;vertical-align:-6px;margin-right:8px;"></span>ONEZ
                </td>
                <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#888780;">
                  Recuperar contraseña
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E6E1;overflow:hidden;">

            <!-- Hero -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="hero" style="padding:48px 48px 24px;background:#E1F5EE;border-bottom:1px solid #E8E6E1;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom:20px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="56" height="56" align="center" valign="middle" style="background:#FFFFFF;border:1px solid #E8E6E1;border-radius:14px;font-family:-apple-system,'Inter',Helvetica,Arial,sans-serif;font-size:24px;line-height:1;color:#0F6E56;font-weight:600;">
                              ⌕
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="h1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:1.18;font-weight:600;color:#0B1F1A;letter-spacing:-0.02em;padding-bottom:14px;">
                        Restablece tu<br/>contraseña
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#2C2C2A;">
                        Hola <strong style="color:#0B1F1A;">{{ $name }}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta. Pulsa el botón y crea una nueva en menos de un minuto.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Body -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="px" style="padding:36px 48px 16px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cta">
                    <tr>
                      <td align="center" bgcolor="#0F6E56" style="border-radius:10px;">
                        <a href="{{ $resetUrl }}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;letter-spacing:-0.005em;">
                          Crear nueva contraseña →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:#888780;margin:18px 0 0;">
                    Por seguridad, este enlace caduca en <strong style="color:#2C2C2A;">{{ $expireMinutes }} minutos</strong> y solo se puede usar una vez.
                  </p>
                </td>
              </tr>

              <!-- Solicitud info -->
              <tr>
                <td class="px" style="padding:8px 48px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAF8;border:1px solid #E8E6E1;border-radius:12px;">
                    <tr>
                      <td style="padding:18px 22px;">
                        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;color:#888780;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 12px;">
                          Detalles de la solicitud
                        </p>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="meta-row" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13.5px;color:#2C2C2A;line-height:1.55;">
                          <tr>
                            <td width="38%" style="padding:5px 12px 5px 0;color:#888780;">Cuenta</td>
                            <td style="padding:5px 0;color:#0B1F1A;font-weight:500;">{{ $email }}</td>
                          </tr>
                          <tr>
                            <td width="38%" style="padding:5px 12px 5px 0;color:#888780;">Solicitado el</td>
                            <td style="padding:5px 0;color:#0B1F1A;">{{ $fecha }} · {{ $hora }}</td>
                          </tr>
                          <tr>
                            <td width="38%" style="padding:5px 12px 5px 0;color:#888780;">Desde</td>
                            <td style="padding:5px 0;color:#0B1F1A;">{{ $navegador }} · {{ $ciudad }}</td>
                          </tr>
                          <tr>
                            <td width="38%" style="padding:5px 12px 5px 0;color:#888780;">IP</td>
                            <td style="padding:5px 0;color:#0B1F1A;font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12.5px;">{{ $requestIp }}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td class="px" style="padding:28px 48px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="border-top:1px solid #E8E6E1;font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Fallback link -->
              <tr>
                <td class="px" style="padding:24px 48px;">
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:#2C2C2A;margin:0 0 8px;">
                    ¿El botón no funciona? Copia este enlace:
                  </p>
                  <p style="font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12px;line-height:1.5;color:#0F6E56;margin:0;word-break:break-all;background:#E1F5EE;border:1px solid #E8E6E1;border-radius:8px;padding:12px 14px;">
                    {{ $resetUrl }}
                  </p>
                </td>
              </tr>

              <!-- Aviso seguridad -->
              <tr>
                <td class="px" style="padding:0 48px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;">
                    <tr>
                      <td width="44" valign="top" style="padding:18px 0 18px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="32" height="32" align="center" valign="middle" style="background:#FFFFFF;border:1px solid #FDE68A;border-radius:50%;font-family:-apple-system,'Inter',Helvetica,Arial,sans-serif;font-size:15px;color:#B45309;font-weight:600;line-height:1;">
                              !
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding:18px 22px 18px 14px;">
                        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#0B1F1A;margin:0 0 6px;">
                          ¿No fuiste tú?
                        </p>
                        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.55;color:#2C2C2A;margin:0;">
                          Ignora este correo y tu contraseña no cambiará. Si crees que alguien intenta acceder a tu cuenta, <a href="{{ $supportUrl }}" style="color:#B45309;text-decoration:underline;">avísanos</a>.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Sign off -->
              <tr>
                <td class="px" style="padding:0 48px 44px;">
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#0B1F1A;margin:0;">
                    Cuidamos tu cuenta,<br/>
                    <strong>El equipo de ONEZ</strong>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="px" style="padding:28px 8px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#888780;">
                  Este correo se envió a <strong style="color:#2C2C2A;">{{ $email }}</strong> porque alguien solicitó restablecer la contraseña.<br/>
                  <a href="{{ $supportUrl }}" style="color:#888780;text-decoration:underline;">Soporte</a>
                  &nbsp;·&nbsp;
                  <a href="{{ $privacyUrl }}" style="color:#888780;text-decoration:underline;">Privacidad</a>
                  &nbsp;·&nbsp;
                  <a href="{{ $termsUrl }}" style="color:#888780;text-decoration:underline;">Términos</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#A8A6A0;">
                  © {{ date('Y') }} ONEZ · Calle Sagasta 18, 28004 Madrid, España
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
