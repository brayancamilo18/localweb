# Sistema visual emails LocalWeb

Tokens compartidos por los 3 templates.

## Color
- Primary: #E55A3C (terracotta · CTAs, links, acentos)
- Primary dark: #C84A2E (hover/visited en clientes que lo soporten)
- Ink: #1A1A1A (titular)
- Ink-2: #4A4A4A (cuerpo)
- Ink-3: #8A8A8A (meta, footer)
- Bg: #FFFFFF (fondo email)
- Bg-2: #F7F1EC (fondo body, soft cream)
- Bg-3: #FFF8F4 (banda hero / info-cards)
- Border: #ECE2D8

## Tipografía
- Stack: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, Helvetica, Arial, sans-serif
- H1: 28px / 1.2 / 600
- Body: 16px / 1.55 / 400
- Small: 13px / 1.5 / 400 (footer, disclaimers)
- Mono fallback: ui-monospace, "SF Mono", Menlo, Consolas, monospace

## Layout
- Wrap: 600px ancho, padding 24px lateral en mobile
- Table-based para Outlook/Gmail
- Estilos inline críticos + <style> en head para clientes que lo soporten
- CTA: button en tabla anidada (bulletproof button) con padding 16px 32px, radius 8px

## Variables de plantilla
Marcadas con `{{variable}}` para que el backend de LocalWeb las inyecte.
