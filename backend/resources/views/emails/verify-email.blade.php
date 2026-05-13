<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Confirma tu correo · ONEZ</title>
<style>
  /* Reset clientes */
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  body{margin:0!important;padding:0!important;width:100%!important;background:#F3F2EF}
  a{color:#0F6E56;text-decoration:none}
  /* Mobile */
  @media screen and (max-width:620px){
    .wrap{width:100%!important}
    .px{padding-left:24px!important;padding-right:24px!important}
    .h1{font-size:26px!important;line-height:1.2!important}
    .hero{padding:32px 24px!important}
    .cta a{display:block!important;text-align:center!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F3F2EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;">

<!-- Preheader (oculto, aparece como preview en bandeja) -->
<div style="display:none;font-size:1px;color:#F3F2EF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Confirma tu correo y empieza a montar tu web en menos de 10 minutos.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F2EF;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- ─── Marca top ─── -->
      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td class="px" style="padding:0 8px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#0B1F1A;letter-spacing:-0.01em;">
                  <span style="display:inline-block;width:24px;height:24px;background:#0F6E56;border-radius:6px;vertical-align:-6px;margin-right:8px;"></span>ONEZ
                </td>
                <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#888780;">
                  Verificación de cuenta
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ─── Card principal ─── -->
        <tr>
          <td style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E6E1;overflow:hidden;">

            <!-- Hero strip -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="hero" style="padding:48px 48px 24px;background:#E1F5EE;border-bottom:1px solid #E8E6E1;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom:20px;">
                        <!-- Icon mark -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td width="56" height="56" align="center" valign="middle" style="background:#FFFFFF;border:1px solid #E8E6E1;border-radius:14px;font-family:-apple-system,'Inter',Helvetica,Arial,sans-serif;font-size:28px;line-height:1;">
                              <span style="color:#0F6E56;font-weight:600;">✓</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="h1" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:1.18;font-weight:600;color:#0B1F1A;letter-spacing:-0.02em;padding-bottom:14px;">
                        Confirma tu correo<br/>para empezar
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#2C2C2A;">
                        Hola <strong style="color:#0B1F1A;">{{ $name }}</strong>, gracias por registrarte en ONEZ. Solo nos falta una cosa: verificar que este correo es tuyo.
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

                  <!-- CTA -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="cta">
                    <tr>
                      <td align="center" bgcolor="#0F6E56" style="border-radius:10px;">
                        <a href="{{ $verificationUrl }}" target="_blank" style="display:inline-block;padding:16px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;letter-spacing:-0.005em;">
                          Confirmar mi correo →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:#888780;margin:18px 0 0;">
                    Este enlace caduca en <strong style="color:#2C2C2A;">{{ $expireMinutes }} minutos</strong>. Si no lo usas a tiempo, podrás pedir uno nuevo desde la pantalla de inicio de sesión.
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td class="px" style="padding:24px 48px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="border-top:1px solid #E8E6E1;font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Fallback link -->
              <tr>
                <td class="px" style="padding:24px 48px;">
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:#2C2C2A;margin:0 0 8px;">
                    ¿El botón no funciona? Copia y pega este enlace en tu navegador:
                  </p>
                  <p style="font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:12px;line-height:1.5;color:#0F6E56;margin:0;word-break:break-all;background:#E1F5EE;border:1px solid #E8E6E1;border-radius:8px;padding:12px 14px;">
                    {{ $verificationUrl }}
                  </p>
                </td>
              </tr>

              <!-- Tip box -->
              <tr>
                <td class="px" style="padding:0 48px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E1F5EE;border:1px solid #E8E6E1;border-radius:12px;">
                    <tr>
                      <td style="padding:20px 22px;">
                        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#0B1F1A;margin:0 0 6px;letter-spacing:-0.005em;">
                          Mientras tanto…
                        </p>
                        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#2C2C2A;margin:0;">
                          Una vez confirmes tu correo, podrás montar tu web en menos de <strong style="color:#0B1F1A;">10 minutos</strong> respondiendo 8 preguntas sobre tu negocio. Sin tarjeta, sin sorpresas.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Sign off -->
              <tr>
                <td class="px" style="padding:0 48px 44px;">
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#2C2C2A;margin:0;">
                    ¿No te suena este registro? Puedes ignorar este correo, no se creará ninguna cuenta.
                  </p>
                  <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#0B1F1A;margin:18px 0 0;">
                    Un saludo,<br/>
                    <strong>El equipo de ONEZ</strong>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ─── Footer ─── -->
        <tr>
          <td class="px" style="padding:28px 8px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#888780;">
                  Te enviamos este correo porque alguien usó <strong style="color:#2C2C2A;">{{ $email }}</strong> al registrarse en ONEZ.<br/>
                  <a href="{{ $supportUrl }}" style="color:#888780;text-decoration:underline;">Centro de ayuda</a>
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
