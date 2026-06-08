{{-- Reglas globales: evitar overflow horizontal y recortar logo en barra en móvil. --}}
<style id="lw-responsive-safety">
  html,
  body {
    overflow-x: clip;
    max-width: 100%;
    /* Móvil: evita el pull-to-refresh nativo (recarga fantasma al hacer
       scroll rápido hacia arriba estando arriba del todo). */
    overscroll-behavior-y: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }

  @media (max-width: 880px) {
    .nav-inner {
      gap: 10px;
      min-width: 0;
      padding-left: max(12px, env(safe-area-inset-left, 0px));
      padding-right: max(12px, env(safe-area-inset-right, 0px));
    }

    .nav .brand,
    nav.top .brand,
    nav.top .logo {
      min-width: 0;
      flex: 1 1 auto;
      max-width: calc(100% - 118px);
    }

    .nav .brand.brand-has-img .nav-brand-img,
    nav.top .brand.brand-has-img .nav-brand-img,
    nav.top .logo.brand-has-img .nav-brand-img,
    .brand.brand-has-img .nav-brand-img,
    .brand.brand-has-img #navBrandLogo,
    .nav .brand.brand-has-img #navBrandLogo {
      width: auto !important;
      height: auto !important;
      max-width: min(140px, 38vw) !important;
      max-height: calc(44px * var(--lw-logo-scale, 1.35)) !important;
      object-fit: contain !important;
    }

    .nav-actions,
    .nav .nav-right,
    nav.top .actions {
      flex-shrink: 0;
      gap: 8px;
    }

    .nav-cta,
    nav.top .nav-cta {
      white-space: nowrap;
      font-size: clamp(9px, 2.8vw, 11px);
      padding: 7px 10px;
    }

    .menu-toggle {
      flex-shrink: 0;
    }
  }

  @media (max-width: 480px) {
    .nav .brand.brand-has-img .nav-brand-img,
    .brand.brand-has-img .nav-brand-img,
    .brand.brand-has-img #navBrandLogo {
      max-width: min(120px, 34vw) !important;
      max-height: calc(38px * var(--lw-logo-scale, 1.35)) !important;
    }
  }
</style>
