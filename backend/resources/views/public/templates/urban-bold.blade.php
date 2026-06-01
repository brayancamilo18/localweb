@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script>
(function () {
  var p = new URLSearchParams(location.search);
  if (p.get('thumb') === '1') return;
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  l.crossOrigin = '';
  document.head.appendChild(l);
})();
</script>
@verbatim
<style>
  :root{
    --ink:#0A0A0A;
    --paper:#F4F1EA;
    --concrete:#1C1C1C;
    --lime:#D4FF3A;          /* fluorescent accent — override vía brand-override */
    --lime-hover:color-mix(in srgb, var(--lime) 72%, var(--ink));
    --steel:#2A2A2A;
    --line:#000;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:var(--paper);color:var(--ink);font-family:"Space Grotesk",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  html{scroll-behavior:smooth}
  section[id], a[id]{scroll-margin-top:88px}
  ::selection{background:var(--lime);color:var(--lime-on,var(--ink))}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;cursor:pointer;border:none;background:none}
  img{display:block;max-width:100%}
  .display{font-family:"Archivo Black","Space Grotesk",sans-serif;letter-spacing:-0.04em;line-height:.85;text-transform:uppercase}
  .mono{font-family:"JetBrains Mono",ui-monospace,monospace;letter-spacing:.02em}

  /* ─── NAV ─── */
  .nav{position:sticky;top:0;z-index:9000;background:var(--ink);color:#fff;border-bottom:3px solid var(--ink)}
  .nav-inner{max-width:100%;padding:18px 46px;display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:10px;font-family:"Archivo Black";font-size:22px;letter-spacing:-.03em;text-transform:uppercase}
  .brand-mark{width:46px;height:46px;background:var(--lime);color:var(--lime-on,var(--ink));display:grid;place-items:center;font-size:18px;transform:rotate(-3deg)}
  .nav ul{list-style:none;display:flex;gap:50px;font-weight:500;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
  .nav ul a{position:relative;padding:6px 0;transition:color .18s}
  .nav ul a::after{
    content:"";
    position:absolute;
    left:0; right:0; bottom:-2px;
    height:2px;
    background:var(--lime);
    transform:scaleX(0);
    transform-origin:left center;
    transition:transform .28s cubic-bezier(.6,.05,.2,1);
  }
  .nav ul a:hover{color:var(--lime-hover,var(--lime))}
  .nav ul a:hover::after{transform:scaleX(1);background:var(--lime-hover,var(--lime))}
  .nav ul a.is-active{color:var(--lime)}
  .nav ul a.is-active::after{transform:scaleX(1)}
  @media (prefers-reduced-motion:reduce){
    .nav ul a::after{transition:none}
  }
  .nav-cta{background:var(--lime);color:var(--lime-on,var(--ink));padding:10px 18px;font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:.04em;transition:transform .1s,box-shadow .1s,background .15s,color .15s}
  .nav-cta:hover{transform:translate(-2px,-2px);background:var(--lime-hover,var(--lime));color:var(--lime-on,var(--ink));box-shadow:4px 4px 0 color-mix(in srgb, var(--lime-hover,var(--lime)) 55%, var(--ink))}
  .nav{ --lw-logo-scale:1; }
  .nav .brand.brand-has-img .nav-brand-img{
    display:block;
    height:calc(50px * var(--lw-logo-scale, 1));
    width:auto;
    max-width:calc(260px * var(--lw-logo-scale, 1));
    object-fit:contain;
    image-rendering:auto;
  }
  .nav .brand.brand-has-img .brand-mark{ display:none !important; }
  .nav .brand.brand-has-img #navBrandName{ display:none !important; }
  .nav-actions{display:flex;align-items:center;gap:14px}
  .menu-toggle{
    display:none;
    width:54px;height:54px;
    align-items:center;justify-content:center;
    flex-direction:column;gap:5px;
    background:transparent;border:2px solid var(--lime);
    cursor:pointer;padding:0;
  }
  .menu-toggle span{
    display:block;width:18px;height:2px;background:var(--lime);
    transition:transform .2s ease, opacity .2s ease;
  }
  .nav.is-open .menu-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}
  .nav.is-open .menu-toggle span:nth-child(2){opacity:0}
  .nav.is-open .menu-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

  /* ─── HERO ─── */
  .hero{background:var(--ink);color:#fff;padding:64px 46px 0;border-bottom:3px solid var(--ink);overflow:hidden;position:relative}
  .hero-grid{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:end;min-height:78vh}
  .hero-meta{display:flex;justify-content:space-between;align-items:center;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9A9A9A;padding-bottom:24px;border-bottom:1px solid #2A2A2A;margin-bottom:50px}
  .hero-meta .live{display:inline-flex;align-items:center;gap:8px;color:var(--lime)}
  .hero-meta .live .dot{width:8px;height:8px;background:var(--lime);border-radius:50%;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .hero h1{font-size:clamp(54px,5.6vw,96px);line-height:.92;margin-bottom:24px;word-break:normal;overflow-wrap:break-word;hyphens:none}
  .hero h1 .accent{color:var(--lime)}
  .hero h1 .underline{display:inline-block;border-bottom:8px solid var(--lime);padding-bottom:0}
  .hero-tag{font-size:18px;line-height:1.5;color:#C9C9C9;max-width:520px;margin-bottom:50px;font-weight:400}
  .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:54px}
  .btn{display:inline-flex;align-items:center;gap:10px;padding:18px 28px;font-weight:700;font-size:14px;letter-spacing:.05em;text-transform:uppercase;border:2px solid var(--lime);transition:transform .12s,box-shadow .12s}
  .btn-primary{background:var(--lime);color:var(--lime-on,var(--ink));transition:transform .12s,box-shadow .12s,background .15s,color .15s,border-color .15s}
  .btn-primary:hover{background:var(--lime-hover,var(--lime));color:var(--lime-on,var(--ink));transform:translate(-3px,-3px);box-shadow:6px 6px 0 #fff}
  .btn-ghost{background:transparent;color:#fff;border-color:#fff;transition:transform .12s,box-shadow .12s,background .15s,color .15s,border-color .15s}
  .btn-ghost:hover{transform:translate(-3px,-3px);box-shadow:6px 6px 0 var(--lime-hover,var(--lime));background:var(--lime-hover,var(--lime));color:var(--lime-on,var(--ink));border-color:var(--lime-hover,var(--lime))}
  .arrow{transition:transform .15s}
  .btn:hover .arrow{transform:translateX(4px)}

  .hero-photo{position:relative;align-self:stretch;border:3px solid var(--lime);overflow:hidden;background:#222;min-height:520px}
  .hero-photo img{width:100%;height:100%;object-fit:cover;filter:contrast(1.1) saturate(.85)}
  .hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 60%,color-mix(in srgb, var(--lime) 15%, transparent));pointer-events:none}
  .hero-tag-corner{position:absolute;top:0;right:0;background:var(--lime);color:var(--lime-on,var(--ink));padding:14px 20px;font-family:"Archivo Black";font-size:46px;line-height:.9;text-transform:uppercase;border-left:3px solid var(--ink);border-bottom:3px solid var(--ink)}
  .hero-tag-corner small{display:block;font-family:"JetBrains Mono";font-size:10px;font-weight:400;margin-top:2px;letter-spacing:.1em}

  /* ticker */
  .ticker{background:var(--lime);color:var(--lime-on,var(--ink));border-top:3px solid var(--ink);overflow:hidden;padding:14px 0;font-family:"Archivo Black";font-size:22px;text-transform:uppercase;letter-spacing:-.01em}
  .ticker-track{display:inline-flex;gap:60px;white-space:nowrap;animation:scroll 30s linear infinite}
  .ticker-track span{display:inline-flex;align-items:center;gap:60px}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .ticker .star{font-size:18px;color:var(--ink)}

  /* ─── SERVICES ─── */
  section{padding:120px 46px;border-bottom:3px solid var(--ink)}
  .section-head{max-width:1480px;margin:0 auto 80px;display:flex;justify-content:space-between;align-items:flex-end;gap:46px;flex-wrap:wrap}
  .section-num{font-family:"JetBrains Mono";font-size:13px;color:var(--ink);background:var(--lime);padding:6px 12px;display:inline-block;margin-bottom:16px;font-weight:700}
  .section-title{font-size:clamp(48px,8vw,96px)}
  .section-sub{font-size:16px;color:#666;max-width:380px;line-height:1.5}

  /* Grid simétrico: el `gap` + `background:var(--ink)` del wrapper genera las
   * líneas internas con el mismo grosor que el `border` exterior, sin importar
   * cuántas celdas haya por fila (resuelve la doble línea que aparecía cuando
   * mezclábamos `border-right` por celda con el border del contenedor). */
  .services{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:3px;border:3px solid var(--ink);background:var(--ink)}
  .service{padding:54px 46px;background:var(--paper);position:relative;transition:background .15s,color .15s}
  /* Hover de servicios: fondo neutro (ink), acento en texto — nunca relleno con --lime */
  .service:hover{background:var(--ink);color:var(--lime)}
  .service:hover .service-num,
  .service:hover p,
  .service:hover .service-price small{color:color-mix(in srgb,var(--lime) 78%,transparent)}
  .service:hover h3,
  .service:hover .service-price{color:var(--lime)}
  .service-num{font-family:"JetBrains Mono";font-size:13px;font-weight:700;color:#666;margin-bottom:46px}
  .service h3{font-family:"Archivo Black";font-size:50px;line-height:.95;text-transform:uppercase;letter-spacing:-.02em;margin-bottom:16px}
  .service p{font-size:14px;line-height:1.55;color:#444;margin-bottom:24px;min-height:56px}
  .service-price{font-family:"Archivo Black";font-size:48px;line-height:1}
  .service-price small{font-family:"Space Grotesk";font-size:14px;font-weight:500;color:#666;display:block;margin-top:4px;letter-spacing:0;text-transform:none}

  /* ─── ABOUT ─── */
  .about{background:var(--ink);color:#fff;border-bottom:3px solid var(--ink)}
  .about-grid{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .about-img{aspect-ratio:4/5;background:#1f1f1f;border:3px solid var(--lime);overflow:hidden;position:relative}
  .about-img img{width:100%;height:100%;object-fit:cover}
  .about h2{font-size:clamp(48px,7vw,84px);margin-bottom:46px}
  .about h2 .accent{color:var(--lime)}
  .about p{font-size:18px;line-height:1.7;color:#C9C9C9;margin-bottom:20px;max-width:520px}

  /* ─── GALLERY ─── */
  .gallery{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:254px;gap:14px}
  .gallery-item{background:#222;overflow:hidden;border:2px solid var(--ink);position:relative;cursor:pointer;transition:transform .15s}
  .gallery-item:hover{transform:translate(-3px,-3px);box-shadow:6px 6px 0 var(--lime-hover,var(--lime))}
  .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
  .gallery-item:hover img{transform:scale(1.05)}
  .gallery-item.tall{grid-row:span 2}
  .gallery-item.wide{grid-column:span 2}

  /* ─── HOURS / CONTACT ─── */
  .info-grid{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:0;border:3px solid var(--ink)}
  .info-block{padding:48px 54px}
  .info-block:first-child{border-right:3px solid var(--ink);background:var(--paper)}
  .info-block:last-child{background:var(--lime)}
  .info-block h3{font-family:"Archivo Black";font-size:48px;line-height:.95;text-transform:uppercase;letter-spacing:-.02em;margin-bottom:46px}
  .schedule{display:flex;flex-direction:column;gap:0}
  .schedule-row{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:2px solid var(--ink);font-family:"JetBrains Mono";font-size:15px;font-weight:500}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row.today{background:var(--ink);color:var(--lime);margin:0 -54px;padding:18px 54px}
  .schedule-row .day{font-weight:700;text-transform:uppercase}
  .schedule-row .closed{color:#999;font-style:italic}
  .schedule-status{display:inline-flex;align-items:center;gap:10px;padding:6px 14px;background:var(--ink);color:var(--lime);font-family:"JetBrains Mono";font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:24px}
  .schedule-status .dot{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 0 0 currentColor}
  .schedule-status.open .dot{animation:statusPulse 2.4s infinite}
  .schedule-status.closed{background:#555;color:#fff}
  .schedule-status.closed .dot{background:#fff;animation:none}
  @keyframes statusPulse{
    0%{ box-shadow:0 0 0 0 color-mix(in srgb, var(--lime) 60%, transparent); }
    70%{ box-shadow:0 0 0 9px color-mix(in srgb, var(--lime) 0%, transparent); }
    100%{ box-shadow:0 0 0 0 color-mix(in srgb, var(--lime) 0%, transparent); }
  }
  .contact-list{display:flex;flex-direction:column;gap:24px;font-size:18px;font-weight:500}
  .contact-list a{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:2px solid var(--ink);transition:padding .15s}
  .contact-list a:hover{padding-left:8px}
  .contact-list .icon{width:46px;height:46px;background:var(--ink);color:var(--lime);display:grid;place-items:center;font-size:14px;flex-shrink:0}

  /* ─── MAP (Leaflet) ─── */
  .map-section{max-width:1480px;margin:0 auto;padding:0;border:3px solid var(--ink);border-top:none}
  .map-section.bold-map-empty{ display:none; }
  .map-shell{position:relative;background:var(--ink)}
  .map-leaflet{height:min(360px,52vh);min-height:254px;width:100%;background:var(--ink)}
  .map-shell .leaflet-container{font-family:"Space Grotesk";background:var(--ink)}
  .map-shell .leaflet-control-zoom a{
    display:flex;
    align-items:center;
    justify-content:center;
    width:50px;
    height:50px;
    padding:0;
    line-height:1;
    font-size:22px;
    text-align:center;
    text-decoration:none;
    background:var(--ink);
    color:var(--lime);
    border:2px solid var(--lime);
    border-radius:0 !important;
    font-weight:700;
  }
  .map-shell .leaflet-control-zoom a:hover{
    background:var(--lime-hover,var(--lime));
    color:var(--lime-on,var(--ink));
    border-color:var(--lime-hover,var(--lime));
  }
  .map-shell .leaflet-bar{ border:none; box-shadow:none; }
  .map-shell .leaflet-control-attribution{
    background:var(--ink) !important;
    color:#999 !important;
    font-size:10px !important;
    font-family:"JetBrains Mono";
  }
  .map-shell .leaflet-control-attribution a{ color:var(--lime) !important; }
  .bold-leaflet-divicon{background:transparent !important;border:none !important;}
  .bold-map-pin-wrap{position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;pointer-events:none;}
  .bold-map-core{
    width:14px;height:14px;
    background:var(--lime);
    border:3px solid var(--ink);
    box-shadow:0 0 0 1px var(--lime), 0 4px 16px rgba(0,0,0,.55);
    position:relative;z-index:2;
  }
  .bold-map-radar-ring{
    position:absolute;
    left:50%;top:50%;
    width:46px;height:46px;margin:-23px 0 0 -23px;
    border:2px solid var(--lime);
    box-shadow:0 0 14px color-mix(in srgb, var(--lime) 25%, transparent);
    animation:boldMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;
    pointer-events:none;
  }
  .bold-map-radar-ring.d2{animation-delay:1.25s;}
  @keyframes boldMapRadar{
    0%{ transform:scale(0.4); opacity:.95; }
    65%{ opacity:.2; }
    100%{ transform:scale(2.15); opacity:0; }
  }
  .map-directions-row{
    display:none;
    justify-content:flex-start;
    align-items:center;
    padding:24px 54px;
    border-top:3px solid var(--ink);
    background:var(--paper);
  }
  .map-directions-row.is-visible{ display:flex; }

  /* ─── REVIEWS CTA (Google Business URL) ─── */
  .reviews-cta-section{
    max-width:1480px;margin:0 auto;
    background:var(--paper);
    border:3px solid var(--ink);
    border-top:none;
    padding:48px 54px;
    display:none;
    flex-direction:column;
    gap:18px;
    align-items:flex-start;
  }
  .reviews-cta-section.is-visible{display:flex;}
  .reviews-cta-section h3{font-family:"Archivo Black";font-size:50px;line-height:.95;text-transform:uppercase;letter-spacing:-.02em;}
  .reviews-cta-section p{font-size:15px;line-height:1.6;color:#444;max-width:560px;}

  /* ─── VCARD STRIP ─── */
  .vcard-strip{
    max-width:1480px;margin:0 auto;
    background:var(--ink);color:var(--lime);
    border:3px solid var(--ink);border-top:none;
    padding:46px 54px;
    display:none;
    align-items:center;
    justify-content:space-between;
    gap:24px;
    flex-wrap:wrap;
  }
  .vcard-strip.is-visible{display:flex;}
  .vcard-strip strong{font-family:"Archivo Black";font-size:24px;text-transform:uppercase;letter-spacing:-.02em;}
  .vcard-strip small{font-family:"JetBrains Mono";font-size:11px;color:#999;display:block;margin-top:4px;letter-spacing:.04em;}

  /* ─── CTA ─── */
  .cta{background:var(--lime);text-align:center;padding:154px 46px}
  .cta h2{font-size:clamp(64px,12vw,230px);margin-bottom:54px}
  .cta .arrow-big{display:inline-block;font-size:120px;line-height:1;color:var(--ink);transform:rotate(-15deg)}
  .cta-btn{background:var(--ink);color:var(--lime);padding:24px 54px;font-family:"Archivo Black";font-size:24px;text-transform:uppercase;letter-spacing:-.01em;display:inline-flex;align-items:center;gap:14px;transition:transform .15s,box-shadow .15s,color .15s}
  .cta-btn:hover{transform:translate(-4px,-4px);box-shadow:8px 8px 0 var(--ink);color:var(--lime-hover,var(--lime))}

  /* ─── FOOTER ─── */
  footer{background:var(--ink);color:#fff;padding:80px 46px 46px}
  .foot{max-width:1480px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:48px;margin-bottom:64px}
  .foot-brand{font-family:"Archivo Black";font-size:48px;line-height:.85;text-transform:uppercase;letter-spacing:-.03em}
  .foot-brand .accent{color:var(--lime)}
  .foot p{color:#999;margin-top:16px;line-height:1.6;max-width:280px}
  .foot h4{font-family:"JetBrains Mono";font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--lime);margin-bottom:18px}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:10px}
  .foot ul a{color:#C9C9C9;font-size:14px;transition:color .12s}
  .foot ul a:hover{color:var(--lime-hover,var(--lime))}
  .foot-bottom{max-width:1480px;margin:0 auto;border-top:1px solid #2A2A2A;padding-top:24px;display:flex;justify-content:space-between;align-items:center;font-family:"JetBrains Mono";font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.06em}
  .foot-bottom a{color:#999}
  #tpl-platform-branding a{color:var(--lime)}

  /* ─── EMBED PREVIEW ─── */
  html.embed-preview-root{ scroll-behavior:auto !important; }
  body.embed-preview .info-grid{ scroll-margin-top:88px; }
  body.embed-preview{ --lime-hover:var(--lime); }
  body.embed-preview .hero-cta .btn-primary,
  body.embed-preview .hero-cta .btn-primary:hover,
  body.embed-preview .nav-cta,
  body.embed-preview .nav-cta:hover{
    background:var(--lime);
    color:var(--lime-on,var(--ink));
    border-color:var(--lime);
  }
  body.embed-preview .hero-cta .btn-ghost:hover{
    background:var(--lime);
    color:var(--lime-on,var(--ink));
    border-color:var(--lime);
    box-shadow:6px 6px 0 var(--lime);
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width:880px){
    .nav{position:sticky}
    .nav-inner{padding:12px 16px;gap:10px;align-items:center;min-width:0}
    .brand{min-width:0;flex:1 1 auto;max-width:calc(100% - 118px);font-size:clamp(14px,3.8vw,20px)}
    .nav .brand.brand-has-img .nav-brand-img{
      height:auto;
      max-height:calc(44px * var(--lw-logo-scale, 1));
      max-width:min(140px,38vw);
    }
    .nav-actions{flex-shrink:0;gap:8px}
    .menu-toggle{display:inline-flex;width:38px;height:38px;flex-shrink:0}
    .nav ul{
      display:flex;
      position:absolute;
      top:100%;left:0;right:0;
      flex-direction:column;
      gap:0;
      background:var(--ink);
      border-top:3px solid rgba(255,255,255,.08);
      padding:8px 20px 16px;
      opacity:0;
      visibility:hidden;
      transform:translateY(-10px);
      transition:opacity .26s ease, transform .28s cubic-bezier(.2,.7,.2,1), visibility 0s linear .28s;
      pointer-events:none;
      box-shadow:0 14px 24px rgba(0,0,0,.35);
    }
    .nav.is-open ul{
      opacity:1;
      visibility:visible;
      transform:translateY(0);
      pointer-events:auto;
      transition:opacity .22s ease, transform .28s cubic-bezier(.2,.7,.2,1), visibility 0s linear 0s;
    }
    .nav ul li{
      border-bottom:1px solid rgba(255,255,255,.06);
      opacity:0;
      transform:translateY(-6px);
      transition:opacity .22s ease, transform .28s cubic-bezier(.2,.7,.2,1);
    }
    .nav.is-open ul li{opacity:1;transform:translateY(0)}
    .nav.is-open ul li:nth-child(1){transition-delay:.04s}
    .nav.is-open ul li:nth-child(2){transition-delay:.08s}
    .nav.is-open ul li:nth-child(3){transition-delay:.12s}
    .nav.is-open ul li:nth-child(4){transition-delay:.16s}
    .nav.is-open ul li:nth-child(5){transition-delay:.20s}
    .nav.is-open ul li:nth-child(6){transition-delay:.24s}
    .nav ul li:last-child{border-bottom:none}
    .nav ul a{display:block;padding:14px 4px;font-size:14px}
    .nav ul a::after{display:none}
    .nav-cta{padding:7px 10px;font-size:clamp(9px,2.8vw,11px);white-space:nowrap;letter-spacing:.03em}
    .hero{padding:40px 16px 0}
    .hero-meta{flex-wrap:wrap;gap:8px 12px;margin-bottom:28px;padding-bottom:16px}
    .hero-meta .mono{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .hero h1{font-size:clamp(28px,10.5vw,52px);line-height:.95;hyphens:none;word-break:normal;overflow-wrap:break-word}
    .hero-tag{font-size:16px;max-width:100%}
    .hero-cta{flex-direction:column;align-items:stretch;gap:10px;margin-bottom:40px}
    .hero-cta .btn{width:100%;justify-content:center;box-sizing:border-box}
    .hero-grid{grid-template-columns:1fr;gap:46px;min-height:auto}
    .hero-photo{min-height:400px}
    section{padding:64px 20px}
    .services{grid-template-columns:1fr}
    .service{border-right:none;border-bottom:3px solid var(--ink)}
    .service:last-child{border-bottom:none}
    .about-grid{grid-template-columns:1fr;gap:54px}
    .gallery{grid-template-columns:repeat(2,1fr);grid-auto-rows:260px}
    .info-grid{grid-template-columns:1fr}
    .info-block:first-child{border-right:none;border-bottom:3px solid var(--ink)}
    .foot{grid-template-columns:1fr 1fr;gap:46px}
    .foot-brand{font-size:46px}
    .schedule-row.today{margin:0 -20px;padding:18px 20px}
    .vcard-strip, .reviews-cta-section, .map-directions-row{padding:24px 20px}
  }
  @media (max-width:480px){
    .nav .brand.brand-has-img .nav-brand-img{max-width:min(120px,34vw);max-height:calc(38px * var(--lw-logo-scale, 1))}
    .hero h1{font-size:clamp(26px,9.5vw,44px)}
  }
  @media (prefers-reduced-motion:reduce){
    *, *::before, *::after{
      animation-duration:.01ms !important; animation-iteration-count:1 !important;
      transition-duration:.01ms !important;
    }
    html{scroll-behavior:auto !important}
    .nav ul, .nav ul li{transition:none !important; transform:none !important}
  }
  /* LW · lightbox galería (clic = vista completa) */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;font-family:system-ui,sans-serif}
  @media (max-width:654px){
    .lw-gallery-lightbox-close{top:8px;right:8px}
  }

  /* ═══════════ URBAN-BOLD PRO ANIMATIONS ═══════════ */
  :root{
    --tv-ease: cubic-bezier(.22,.61,.36,1);
    --tv-ease-out-expo: cubic-bezier(.16,1,.3,1);
    --tv-snap: cubic-bezier(.7,0,.2,1);
  }
  @keyframes tv-fade-in{from{opacity:0}to{opacity:1}}
  @keyframes tv-fade-up{from{opacity:0;transform:translateY(54px)}to{opacity:1;transform:none}}
  @keyframes tv-fade-left{from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:none}}
  @keyframes tv-fade-right{from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:none}}
  @keyframes tv-zoom-in{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
  @keyframes tv-slam{0%{transform:translateY(-120%) skewY(-6deg);opacity:0}60%{transform:translateY(8px) skewY(1deg);opacity:1}100%{transform:none;opacity:1}}
  @keyframes tv-snap-in{0%{transform:scale(.4) rotate(-8deg);opacity:0}70%{transform:scale(1.05) rotate(1deg)}100%{transform:none;opacity:1}}
  @keyframes tv-clip-up{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes tv-clip-right{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes tv-glitch{0%,100%{transform:none;text-shadow:none}20%{transform:translate(-2px,1px);text-shadow:2px 0 var(--lime),-2px 0 #ff2d55}40%{transform:translate(2px,-1px);text-shadow:-2px 0 var(--lime),2px 0 #00e5ff}60%{transform:translate(-1px,0);text-shadow:1px 0 var(--lime)}80%{transform:translate(1px,1px);text-shadow:-1px 0 #ff2d55}}
  @keyframes tv-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
  @keyframes tv-word-up{from{transform:translateY(110%);opacity:0}to{transform:none;opacity:1}}
  @keyframes tv-img-before{0%{transform:scaleX(1);transform-origin:left}50%,100%{transform:scaleX(0);transform-origin:right}}
  @keyframes tv-img-after{0%{transform:scaleX(0);transform-origin:left}50%{transform:scaleX(1);transform-origin:left}51%{transform-origin:right}100%{transform:scaleX(0);transform-origin:right}}
  @keyframes tv-kenburns{0%{transform:scale(1.04)}100%{transform:scale(1.12)}}
  .tv-reveal{opacity:0;will-change:opacity,transform,clip-path}
  .tv-reveal.tv-in{animation:tv-fade-up .7s var(--tv-snap) both}
  .tv-reveal[data-anim="fade"].tv-in{animation:tv-fade-in .7s var(--tv-ease) both}
  .tv-reveal[data-anim="up"].tv-in{animation:tv-fade-up .7s var(--tv-snap) both}
  .tv-reveal[data-anim="left"].tv-in{animation:tv-fade-left .7s var(--tv-snap) both}
  .tv-reveal[data-anim="right"].tv-in{animation:tv-fade-right .7s var(--tv-snap) both}
  .tv-reveal[data-anim="zoom"].tv-in{animation:tv-zoom-in .7s var(--tv-snap) both}
  .tv-reveal[data-anim="slam"].tv-in{animation:tv-slam .9s var(--tv-snap) both}
  .tv-reveal[data-anim="snap"].tv-in{animation:tv-snap-in .7s var(--tv-snap) both}
  .tv-reveal[data-anim="clip"].tv-in,.tv-reveal[data-anim="clipR"].tv-in{animation-duration:.9s;animation-timing-function:var(--tv-ease-out-expo);animation-fill-mode:both}
  .tv-reveal[data-anim="clip"]{opacity:1}
  .tv-reveal[data-anim="clip"].tv-in{animation-name:tv-clip-up}
  .tv-reveal[data-anim="clipR"]{opacity:1}
  .tv-reveal[data-anim="clipR"].tv-in{animation-name:tv-clip-right}
  .tv-reveal[data-delay="1"].tv-in{animation-delay:.08s}
  .tv-reveal[data-delay="2"].tv-in{animation-delay:.16s}
  .tv-reveal[data-delay="3"].tv-in{animation-delay:.24s}
  .tv-reveal[data-delay="4"].tv-in{animation-delay:.32s}
  .tv-reveal[data-delay="5"].tv-in{animation-delay:.4s}
  .tv-reveal[data-delay="6"].tv-in{animation-delay:.48s}
  .tv-split{opacity:1;display:inline-block;max-width:100%}
  .tv-split .tv-word{display:inline-block;overflow:hidden;vertical-align:bottom;max-width:100%;overflow-wrap:break-word}
  .tv-split .tv-word > span{display:inline-block;transform:translateY(110%);opacity:0}
  .tv-split.tv-in .tv-word > span{animation:tv-word-up .8s var(--tv-snap) both;animation-delay:calc(var(--i,0)*70ms)}
  .tv-img-reveal{position:relative;overflow:hidden;isolation:isolate}
  .tv-img-reveal::before,.tv-img-reveal::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;transform-origin:left}
  .tv-img-reveal::before{background:#0A0A0A;transform:scaleX(1)}
  .tv-img-reveal::after{background:var(--lime);transform:scaleX(0)}
  .tv-img-reveal.tv-in::after{animation:tv-img-after 1.1s var(--tv-snap) both}
  .tv-img-reveal.tv-in::before{animation:tv-img-before 1.1s var(--tv-snap) both}
  .tv-img-reveal img{transform:scale(1.04)}
  .tv-img-reveal.tv-in img{animation:tv-kenburns 14s ease-out both}
  .hero-photo.tv-img-reveal::before,.hero-photo.tv-img-reveal::after{z-index:2}
  .hero-photo::after{z-index:3}
  .tv-hover-lift{transition:transform .25s var(--tv-snap),box-shadow .25s var(--tv-snap)}
  .tv-hover-lift:hover{transform:translate(-4px,-4px);box-shadow:8px 8px 0 var(--lime-hover,var(--lime))}
  .tv-hover-zoom{overflow:hidden}
  .tv-hover-zoom img{transition:transform .6s var(--tv-snap)}
  .tv-hover-zoom:hover img{transform:scale(1.08)}
  .tv-glitch-hover:hover{animation:tv-glitch .35s steps(2) 1}
  .tv-link-flash{position:relative}
  .tv-link-flash::before{content:"";position:absolute;inset:auto -4px -2px -4px;height:0;background:var(--lime);z-index:-1;pointer-events:none;transition:height .2s var(--tv-snap)}
  .tv-link-flash:hover::before{height:60%}
  /* Nav: solo subrayado nativo (::after); sin bloque lime que tapa el texto */
  .nav ul a.tv-link-flash::before{display:none !important}
  .nav ul a.tv-link-flash:hover::before{display:none !important}
  .nav ul a.tv-link-flash:hover{color:var(--lime-hover,var(--lime))}
  .tv-btn-shine{position:relative;overflow:hidden;isolation:isolate}
  .tv-btn-shine::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(110deg,transparent 35%,color-mix(in srgb, var(--lime) 55%, transparent) 50%,transparent 65%);transform:translateX(-120%)}
  .tv-btn-shine:hover::after{animation:tv-shimmer .9s var(--tv-ease) forwards}
  .tv-scroll-progress{position:fixed;top:0;left:0;height:4px;width:0;background:var(--lime);z-index:10001;pointer-events:none;transition:width .12s linear}
  nav.nav.tv-header-scrolled{box-shadow:0 4px 0 var(--lime)!important;transition:box-shadow .2s var(--tv-snap)}
  body.tv-loaded .tv-hero-anim{animation:tv-fade-up .85s var(--tv-snap) both}
  body.tv-loaded .tv-hero-anim.d1{animation-delay:.1s}
  body.tv-loaded .tv-hero-anim.d2{animation-delay:.2s}
  body.tv-loaded .tv-hero-anim.d3{animation-delay:.32s}
  @media (prefers-reduced-motion:reduce){
    .tv-reveal,.tv-reveal.tv-in,.tv-hero-anim,.tv-split .tv-word > span,.tv-img-reveal::before,.tv-img-reveal::after,.tv-glitch-hover:hover{
      animation:none !important;transition:none !important;opacity:1 !important;transform:none !important;filter:none !important;
    }
    .tv-img-reveal::before,.tv-img-reveal::after{display:none}
  }
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')

<!-- ═══════════════════ NAV ═══════════════════ -->
<nav class="nav"@if($logo_url) style="--lw-logo-scale: {{ $logo_scale ?? 1.35 }}"@endif>
  <div class="nav-inner">
    <a href="#" class="brand @if($logo_url) brand-has-img @endif" id="navBrandWrap">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }} · logo" width="180" height="36" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" width="180" height="36" decoding="async" hidden style="display:none"/>
      @endif
      @if(!$logo_url)
      <span class="brand-mark" id="navBrandMark">★</span>
      @endif
      @if(!$logo_url)
      <span id="navBrandName">{{ $nombre }}</span>
      @endif
    </a>
    <ul role="menu" id="boldNavList">
      <!-- Orden = orden visual de las secciones del HTML.
           `#contacto` y `#opiniones` viven dentro de la sección `#horario`
           (sub-bloques «Cómo» y CTA de reseñas), por eso aparecen aquí
           justo después de `Horario`, en el mismo orden con el que el
           usuario los encuentra al hacer scroll. -->
      <li><a href="#servicios" id="tplNavServicios" data-nav-link="servicios"@if(count($services) === 0) style="display:none;"@endif>Servicios</a></li>
      <li><a href="#sobre-nosotros" data-nav-link="sobre-nosotros">Nosotros</a></li>
      <li><a href="#galeria" data-nav-link="galeria">Galería</a></li>
      <li><a href="#horario" data-nav-link="horario">Horario</a></li>
      <li><a href="#contacto" data-nav-link="contacto">Contacto</a></li>
      <li><a href="#opiniones" id="tplNavOpiniones" data-nav-link="opiniones"@if(!$google_business_url) style="display:none;"@endif>Opiniones</a></li>
    </ul>
    <div class="nav-actions">
      <a href="https://wa.me/{{ $whatsapp }}" class="nav-cta" data-wa-link>Reservar →</a>
      <button type="button" id="navMenuToggle" class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="boldNavList">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero" style="padding-bottom:80px">
  <div class="hero-grid">
    <div>
      <div class="hero-meta">
        <span class="mono" id="heroMetaBrand">{{ $nombre }}</span>
        <span class="live" id="heroStatusPill"><span class="dot"></span><span id="heroStatusText">Comprobando…</span></span>
      </div>
      <h1 class="display" id="heroTitle">{{ $nombre }}</h1>
      <p class="hero-tag" id="heroTagline">{{ $tagline }}</p>
      <div class="hero-cta">
        <a href="#contacto" class="btn btn-primary">Reservar cita <span class="arrow">→</span></a>
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="btn btn-ghost" data-tel-link>Llamar ahora</a>
      </div>
    </div>
    <div class="hero-photo" id="heroPhotoWrap">
      @if($portada)
      <img id="heroPhotoImg" src="{{ $portada }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="heroPhotoImg" src="" alt="" hidden style="display:none"/>
      @endif
    </div>
  </div>
</section>

<!-- ═══════════════════ TICKER (frases derivadas del payload) ═══════════════════ -->
<div class="ticker" id="tplTicker" style="display:none;">
  <div class="ticker-track" id="tplTickerTrack"></div>
</div>
</div>

<!-- ═══════════════════ SERVICES (payload.services) ═══════════════════ -->
@if(count($services) > 0)
<section id="servicios">
  <div class="section-head">
    <div>
      <span class="section-num">[ 01 / Servicios ]</span>
      <h2 class="display section-title">Lo que<br/>hacemos.</h2>
    </div>
    <p class="section-sub">Carta de servicios y precios. Sin sorpresas.</p>
  </div>
  <div class="services" id="tplServicesList">
@foreach($services as $service)
    <div class="service">
      <div class="service-num">→ {{ str_pad((string) $loop->iteration, 2, '0', STR_PAD_LEFT) }}</div>
      <h3>{{ $service['name'] }}</h3>
      @if($service['description'])
      <p>{{ $service['description'] }}</p>
      @else
      <p>&nbsp;</p>
      @endif
      <div class="service-price">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ',', '.') }} €
        @else
        Consultar
        @endif
      </div>
    </div>
@endforeach
  </div>
</section>
@else
<section id="servicios" style="display:none;">
  <div class="section-head">
    <div>
      <span class="section-num">[ 01 / Servicios ]</span>
      <h2 class="display section-title">Lo que<br/>hacemos.</h2>
    </div>
    <p class="section-sub">Carta de servicios y precios. Sin sorpresas.</p>
  </div>
  <div class="services" id="tplServicesList"></div>
</section>
@endif

<!-- ═══════════════════ ABOUT ═══════════════════ -->
<section id="sobre-nosotros" class="about">
  <div class="about-grid">
    <div class="about-img" id="aboutPhotoWrap">
      @if($foto_equipo)
      <img id="aboutPhotoImg" src="{{ $foto_equipo }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="aboutPhotoImg" src="" alt="" hidden style="display:none"/>
      @endif
    </div>
    <div>
      <span class="section-num">[ 02 / Sobre nosotros ]</span>
      <h2 class="display" id="aboutTitle">{{ $nombre }}.</h2>
      <p id="aboutDescripcion">{{ $descripcion }}</p>
    </div>
  </div>
</section>

<!-- ═══════════════════ GALLERY (payload.galeria) ═══════════════════ -->
<section id="galeria">
  <div class="section-head">
    <div>
      <span class="section-num">[ 03 / Galería ]</span>
      <h2 class="display section-title">Trabajos<br/>recientes.</h2>
    </div>
    <p class="section-sub">Una muestra de lo que sale del local. Sin filtros.</p>
  </div>
    <div class="gallery" id="galleryLive">
@forelse($galeria as $imgUrl)
@php
  $cls = '';
  if ($loop->count > 1 && $loop->first) { $cls = ' tall'; }
  elseif ($loop->count > 3 && $loop->iteration === 4) { $cls = ' wide'; }
@endphp
    <div class="gallery-item{{ $cls }}"><img src="{{ $imgUrl }}" alt=""/></div>
@empty
    <div class="gallery-item tall"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item wide"><img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=70" alt=""/></div>
    <div class="gallery-item"><img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=70" alt=""/></div>
@endforelse
  </div>
</section>

<!-- ═══════════════════ HOURS + CONTACT ═══════════════════ -->
<section id="horario">
  <div class="section-head">
    <div>
      <span class="section-num">[ 04 / Encuéntranos ]</span>
      <h2 class="display section-title">Horario<br/>y cita.</h2>
    </div>
    <p class="section-sub" id="contactSub">Reserva con antelación o pásate sin avisar.</p>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <span class="schedule-status" id="statusPill">
        <span class="dot"></span>
        <span id="statusText">Comprobando…</span>
      </span>
      <h3>Cuándo</h3>
      @php
  $scheduleDays = [
    ['mon', 'Lun', 'Lunes', 1],
    ['tue', 'Mar', 'Martes', 2],
    ['wed', 'Mié', 'Miércoles', 3],
    ['thu', 'Jue', 'Jueves', 4],
    ['fri', 'Vie', 'Viernes', 5],
    ['sat', 'Sáb', 'Sábado', 6],
    ['sun', 'Dom', 'Domingo', 0],
  ];
  $todayIdx = (int) now()->dayOfWeek;
@endphp
      <div class="schedule" id="schedule">
@foreach($scheduleDays as [$key, $short, $full, $idx])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
  $isToday = $idx === $todayIdx;
@endphp
        <div class="schedule-row{{ $isToday ? ' today' : '' }}">
          <span class="day">{{ $short }}{{ $isToday ? ' · hoy' : '' }}</span>
          @if($open)
          <span>{{ $row['open'] }} → {{ $row['close'] }}</span>
          @else
          <span class="closed">cerrado</span>
          @endif
        </div>
@endforeach
      </div>
    </div>
    <div class="info-block">
      <a id="contacto" aria-hidden="true" style="display:block;height:0;overflow:hidden"></a>
      <h3>Cómo</h3>
      <div class="contact-list">
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span class="icon">☏</span><span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span></a>
        @if($correo)
        <a href="mailto:{{ $correo }}" id="contactEmailLink"><span class="icon">@</span><span id="contactEmailDisplay">{{ $correo }}</span></a>
        @else
        <a href="mailto:" id="contactEmailLink" hidden><span class="icon">@</span><span id="contactEmailDisplay"></span></a>
        @endif
        <a href="https://wa.me/{{ $whatsapp }}" data-wa-link><span class="icon">W</span>WhatsApp · respondemos rápido</a>
        @if($direccion)
        <a href="{{ $google_maps_url ?: '#' }}" id="contactAddressRow"@if($google_maps_url) target="_blank" rel="noopener noreferrer"@endif><span class="icon">◉</span><span id="contactAddressText">{{ $direccion }}</span></a>
        @else
        <a href="#" id="contactAddressRow" hidden><span class="icon">◉</span><span id="contactAddressText"></span></a>
        @endif
      </div>
    </div>
  </div>
  <div class="map-section @if(!is_numeric($map_lat) || !is_numeric($map_lon)) bold-map-empty @endif" id="mapSection">
    <div class="map-shell">
      <div id="mapLeafletContainer" class="map-leaflet" role="img" aria-label="Mapa del negocio"></div>
    </div>
    <div class="map-directions-row @if($google_maps_url) is-visible @endif" id="mapDirectionsRow">
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn btn-ghost" target="_blank" rel="noopener noreferrer" style="border-color:var(--ink);color:var(--ink)">Abrir en Google Maps →</a>
    </div>
  </div>
  <section id="opiniones" class="reviews-cta-section @if($google_business_url) is-visible @endif">
    <span class="section-num">[ 05 / Opiniones ]</span>
    <h3>Lo que dicen<br/>quienes nos eligen.</h3>
    <p>Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google: ayuda a otros a descubrirnos.</p>
    <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn btn-primary" target="_blank" rel="noopener noreferrer" style="background:var(--ink);color:var(--lime);border-color:var(--ink)">Ver y escribir reseñas →</a>
  </section>
  <div class="vcard-strip @if($vcard_enabled && $vcard_download_url) is-visible @endif" id="tplVcardWrap">
    <div>
      <strong>Guarda nuestro contacto.</strong>
      <small>Descarga la tarjeta y añádenos a tu agenda con un toque.</small>
    </div>
    <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn btn-primary" download style="background:var(--lime);color:var(--lime-on,var(--ink));border-color:var(--lime)">Descargar vCard →</a>
  </div>
</section>

<!-- ═══════════════════ CTA ═══════════════════ -->
<section class="cta">
  <h2 id="ctaTitle" class="display">Reserva.<br/>Ven.<br/>Sal nuevo.</h2>
  <a href="https://wa.me/{{ $whatsapp }}" class="cta-btn" data-wa-link>Reservar por WhatsApp →</a>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer>
  <div class="foot">
    <div>
      @php
  $footParts = preg_split('/\s+/', trim($nombre));
@endphp
      <div class="foot-brand" id="footBrand">@if(count($footParts) >= 2){{ $footParts[0] }}<br/><span class="accent">{{ implode(' ', array_slice($footParts, 1)) }}</span>@else<span class="accent">{{ $nombre }}</span>@endif</div>
      <p id="footTagline">{{ $tagline }}</p>
    </div>
    <div>
      <h4>Visitar</h4>
      <ul>
        <li><a href="#servicios" id="footNavServicios"@if(count($services) === 0) style="display:none;"@endif>Servicios</a></li>
        <li><a href="#sobre-nosotros">Nosotros</a></li>
        <li><a href="#galeria">Galería</a></li>
        <li><a href="#horario">Horario</a></li>
        <li><a href="#opiniones" id="footNavOpiniones"@if(!$google_business_url) style="display:none;"@endif>Opiniones</a></li>
      </ul>
    </div>
    <div>
      <h4>Contactar</h4>
      <ul>
        <li><a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span></a></li>
        <li id="footEmailRow"@if(!$correo) hidden @endif><a id="footEmailLink" href="mailto:{{ $correo }}"><span id="footEmailDisplay"></span></a></li>
        <li><a href="https://wa.me/{{ $whatsapp }}" data-wa-link>WhatsApp</a></li>
        <li id="footAddressRow"@if(!$direccion) hidden @endif><a href="{{ $google_maps_url ?: '#' }}" id="footAddressLink"@if($google_maps_url) target="_blank" rel="noopener noreferrer"@endif><span id="footAddressText">{{ $direccion }}</span></a></li>
      </ul>
    </div>
    <div>
      <h4>Síguenos</h4>
      <ul>
        <li><a href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer">TikTok</a></li>
        <li><a href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank" rel="noopener noreferrer">Facebook</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">
    <span id="footBottomBrand">© {{ date('Y') }} · {{ $nombre }}</span>
    <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://onez.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
  </div>
</footer>
@endsection

@push('body-end')
<script>
  window.__lwLat = {{ is_numeric($map_lat) ? $map_lat : 'null' }};
  window.__lwLon = {{ is_numeric($map_lon) ? $map_lon : 'null' }};
</script>

<script>
window.__lwTrackUrl = '{{ $api_base_url }}/api/v1/public/{{ $subdomain }}/track';
function lwTrackClick(kind) {
  fetch(window.__lwTrackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: kind })
  }).catch(function () {});
}
(function () {
  function bindTrack(el, kind) {
    if (!el || el.dataset.lwTrackBound === '1') return;
    el.dataset.lwTrackBound = '1';
    el.addEventListener('click', function () { lwTrackClick(kind); });
  }
  document.querySelectorAll('a[data-wa-link], a[href*="wa.me"]').forEach(function (el) {
    bindTrack(el, 'whatsapp_click');
  });
  document.querySelectorAll('[data-tel-link]').forEach(function (el) {
    bindTrack(el, 'phone_click');
  });
})();
</script>



@verbatim
<script>
(function () {
  var p = new URLSearchParams(location.search);
  if (p.get('thumb') === '1') { window.__LW_SKIP_LEAFLET = true; return; }
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  s.crossOrigin = '';
  document.head.appendChild(s);
})();
</script>
<style>
/* En modo preview, los enlaces externos y botones de acción no parecen clicables. */
html.lw-preview-inert a[href^="tel:"],
html.lw-preview-inert a[href^="mailto:"],
html.lw-preview-inert a[href^="http"],
html.lw-preview-inert a[target="_blank"],
html.lw-preview-inert a[download],
html.lw-preview-inert a[data-wa-link],
html.lw-preview-inert a[data-tel-link],
html.lw-preview-inert #tplBookingLink,
html.lw-preview-inert #tplVcardLink,
html.lw-preview-inert #tplGbizLink,
html.lw-preview-inert #tplMapsExternalLink,
html.lw-preview-inert #tplSocialInstagram,
html.lw-preview-inert #tplSocialTiktok,
html.lw-preview-inert #tplSocialFacebook {
  cursor: default !important;
}
/* Navegación interna sigue como puntero. Se aplica por especificidad mayor. */
html.lw-preview-inert a[href^="#"] {
  cursor: pointer !important;
}
</style>
<script>
/* ─────────────────────────────────────────────────────────────────
 * Modo preview (?preview=1): TODOS los elementos clicables quedan
 * inertes excepto navegación interna (#anchors), el burger del nav
 * móvil y los controles de Leaflet. La SPA del onboarding pasa
 * preview=1 en thumbnails, en el modal "Ver" del paso 1 y en los
 * previews laterales de los pasos 2+. La web pública del cliente
 * NO pasa este flag, así que ahí los botones funcionan normal.
 * ───────────────────────────────────────────────────────────────── */
(function initPreviewInertMode() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('preview') !== '1') return;
  document.documentElement.classList.add('lw-preview-inert');

  function isAllowed(target) {
    if (!target || target.nodeType !== 1) return false;
    // 1) Anchor a sección interna: <a href="#xxx">
    if (target.tagName === 'A') {
      var href = target.getAttribute('href') || '';
      if (href.charAt(0) === '#' && href.length > 1) return true;
    }
    // 2) Burger del menú móvil
    if (target.id === 'burger') return true;
    // 3) Controles internos de Leaflet
    if (target.className && typeof target.className === 'string' &&
        target.className.indexOf('leaflet-') === 0) return true;
    return false;
  }

  function findClickable(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.nodeType === 1 && (el.tagName === 'A' || el.tagName === 'BUTTON' || isAllowed(el))) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  function findAncestorWithLeaflet(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.nodeType === 1 && el.className && typeof el.className === 'string') {
        if (el.className.indexOf('leaflet-') >= 0) return true;
      }
      el = el.parentNode;
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var clickable = findClickable(e.target);
    if (!clickable) return;
    if (isAllowed(clickable)) return;
    if (findAncestorWithLeaflet(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  }, true); // capture: nos ejecutamos antes que cualquier handler de la página

  // También bloqueamos el "submit" por si algún template tuviese un <form>
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();
</script>
<script>
(function initUrbanPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('urban-preview');
  }
})();

/* ───── DATA: horario por defecto ────────────────────── */
const BOLD_SCHEDULE_DEFAULT = [
  { name:"Lun", full:"Lunes",     idx:1, open:"10:00", close:"20:00" },
  { name:"Mar", full:"Martes",    idx:2, open:"10:00", close:"20:00" },
  { name:"Mié", full:"Miércoles", idx:3, open:"10:00", close:"20:00" },
  { name:"Jue", full:"Jueves",    idx:4, open:"10:00", close:"21:00" },
  { name:"Vie", full:"Viernes",   idx:5, open:"10:00", close:"21:00" },
  { name:"Sáb", full:"Sábado",    idx:6, open:"10:00", close:"18:00" },
  { name:"Dom", full:"Domingo",   idx:0, open:null,    close:null    },
];
let SCHEDULE = BOLD_SCHEDULE_DEFAULT.map(function (d) {
  return { name: d.name, full: d.full, idx: d.idx, open: d.open, close: d.close };
});

function syncBoldScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = BOLD_SCHEDULE_DEFAULT.map(function (d) {
      return { name: d.name, full: d.full, idx: d.idx, open: d.open, close: d.close };
    });
    return;
  }
  var map = [
    ['mon', 'Lun', 'Lunes', 1],
    ['tue', 'Mar', 'Martes', 2],
    ['wed', 'Mié', 'Miércoles', 3],
    ['thu', 'Jue', 'Jueves', 4],
    ['fri', 'Vie', 'Viernes', 5],
    ['sat', 'Sáb', 'Sábado', 6],
    ['sun', 'Dom', 'Domingo', 0],
  ];
  SCHEDULE = map.map(function (t) {
    var row = h[t[0]];
    if (!row || row.closed) {
      return { name: t[1], full: t[2], idx: t[3], open: null, close: null };
    }
    return { name: t[1], full: t[2], idx: t[3], open: row.open || '10:00', close: row.close || '20:00' };
  });
}

/* ───── GALERÍA ──────────────────────────────────────── */
function escapeBoldGalleryAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Peluquería / salón — solo en vista previa (?embed=1 o ?preview=1). */
var URBAN_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
};

function shouldUseUrbanSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('urban-preview');
}

function urbanResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseUrbanSampleMedia()) return '';
  return URBAN_PREVIEW_SAMPLE[sampleKey] || '';
}

var BOLD_DEFAULT_GALLERY_INNER =
  '<div class="gallery-item tall"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item wide"><img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=70" alt=""/></div>';

function renderBoldGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = BOLD_DEFAULT_GALLERY_INNER;
  } else {
    root.innerHTML = list
      .map(function (src, i) {
        var cls = '';
        if (list.length > 1 && i === 0) cls = ' tall';
        else if (list.length > 3 && i === 3) cls = ' wide';
        return (
          '<div class="gallery-item' + cls + '">' +
          '<img src="' + escapeBoldGalleryAttr(src) + '" alt=""/></div>'
        );
      })
      .join('');
  }
  if (typeof window.tvAnimationsRefresh === 'function') {
    requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
  }
}

function updateBoldGallerySlider(_isPro) {
  // Mantenemos siempre el grid editorial con sus tarjetas + hover (sin slider en Pro).
  var root = document.getElementById('galleryLive');
  if (!root) return;
  root.classList.remove('gallery-slider');
  root.querySelectorAll('.bold-gallery-nav-btn').forEach(function (btn) { btn.remove(); });
  var photos = Array.prototype.slice.call(root.querySelectorAll('.gallery-item'));
  photos.forEach(function (p, i) {
    p.classList.remove('is-active', 'tall', 'wide');
    if (photos.length > 1 && i === 0) p.classList.add('tall');
    else if (photos.length > 3 && i === 3) p.classList.add('wide');
  });
}

/* ───── HERO + ABOUT photo ───────────────────────────── */
function updateBoldHeroPhoto(raw) {
  var img = document.getElementById('heroPhotoImg');
  if (!img) return;
  var hasPortada = raw && Object.prototype.hasOwnProperty.call(raw, 'portada');
  if (!hasPortada && !shouldUseUrbanSampleMedia()) return;
  var src = urbanResolvePreviewPhotoSrc(raw && raw.portada, 'portada');
  if (!src) {
    img.removeAttribute('src');
    img.hidden = true;
    img.style.display = 'none';
    return;
  }
  var withCacheBust = src;
  if (/^https?:\/\//i.test(src) && src !== URBAN_PREVIEW_SAMPLE.portada) {
    var sep = src.indexOf('?') >= 0 ? '&' : '?';
    withCacheBust = src + sep + 'lwts=' + Date.now();
  }
  img.src = withCacheBust;
  img.hidden = false;
  img.style.display = 'block';
}

function updateBoldAboutPhoto(raw) {
  var img = document.getElementById('aboutPhotoImg');
  if (!img) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseUrbanSampleMedia()) return;
  var src = urbanResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo');
  if (!src) {
    img.removeAttribute('src');
    img.hidden = true;
    img.style.display = 'none';
    return;
  }
  img.src = src;
  img.hidden = false;
  img.style.display = 'block';
}

/* ───── TICKER (frases derivadas del payload) ────────── */
function updateBoldTicker(raw) {
  var ticker = document.getElementById('tplTicker');
  var track = document.getElementById('tplTickerTrack');
  if (!ticker || !track) return;
  var brand = (raw && raw.nombre ? String(raw.nombre) : '').trim();
  var tagline = (raw && raw.tagline ? String(raw.tagline) : '').trim();
  var phrases = [];
  if (brand) phrases.push(brand);
  if (tagline) phrases.push(tagline);
  if (raw && raw.direccion) {
    var parts = String(raw.direccion).split(',').map(function(s){return s.trim();}).filter(Boolean);
    if (parts.length > 1) phrases.push(parts[parts.length - 1]);
  }
  if (phrases.length === 0) {
    ticker.style.display = 'none';
    track.innerHTML = '';
    return;
  }
  ticker.style.display = 'block';
  var bullet = ' <span class="star">●</span> ';
  var seq = phrases.join(bullet);
  track.innerHTML =
    '<span>' + seq + bullet + seq + bullet + '</span>' +
    '<span>' + seq + bullet + seq + bullet + '</span>';
}

/* ───── MAP (Leaflet) ────────────────────────────────── */
var boldPreviewMap = null;
var boldPreviewMarker = null;
var BOLD_MAP_ZOOM = 18;

function destroyBoldPreviewMap() {
  if (boldPreviewMap) {
    try { boldPreviewMap.remove(); } catch (e) {}
    boldPreviewMap = null;
    boldPreviewMarker = null;
  }
}

function boldRadarIcon() {
  if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return null;
  var html =
    '<div class="bold-map-pin-wrap">' +
    '<span class="bold-map-radar-ring"></span>' +
    '<span class="bold-map-radar-ring d2"></span>' +
    '<span class="bold-map-core"></span></div>';
  return L.divIcon({
    className: 'bold-leaflet-divicon',
    html: html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

function updateBoldPreviewMap(lat, lon) {
  var sec = document.getElementById('mapSection');
  var container = document.getElementById('mapLeafletContainer');
  if (!sec || !container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyBoldPreviewMap();
    sec.classList.add('bold-map-empty');
    return;
  }
  if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
  sec.classList.remove('bold-map-empty');

  function applyMap() {
    if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
    if (!boldPreviewMap) {
      boldPreviewMap = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        /** Solo se permite zoom desde los botones +/-: la rueda atrapaba el
         * scroll de la página al pasar por encima del mapa, el doble-clic
         * acercaba accidentalmente al hacer foco, y el shift+drag (boxZoom)
         * confundía a usuarios con teclado. `touchZoom` se deja en el default
         * (true) para que el pinch siga funcionando en móvil. */
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([lat, lon], BOLD_MAP_ZOOM);
      L.control.attribution({ prefix: false }).addTo(boldPreviewMap);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(boldPreviewMap);
    } else {
      boldPreviewMap.setView([lat, lon], BOLD_MAP_ZOOM);
    }
    if (boldPreviewMarker) boldPreviewMap.removeLayer(boldPreviewMarker);
    boldPreviewMarker = L.marker([lat, lon], { icon: boldRadarIcon() }).addTo(boldPreviewMap);
    setTimeout(function () { if (boldPreviewMap) boldPreviewMap.invalidateSize(); }, 80);
    setTimeout(function () { if (boldPreviewMap) boldPreviewMap.invalidateSize(); }, 320);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(applyMap);
  });
}

/* ───── HELPERS ──────────────────────────────────────── */
function escapeHtmlTextBold(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBoldPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits:0 }).format(n);
}

function buildDirectionsUrlBold(raw) {
  raw = raw || {};
  var manual = (raw.google_maps_url || '').trim();
  if (manual) return manual;
  var mlat = raw.map_lat;
  var mlon = raw.map_lon;
  var la = typeof mlat === 'number' ? mlat : parseFloat(mlat);
  var lo = typeof mlon === 'number' ? mlon : parseFloat(mlon);
  if (Number.isFinite(la) && Number.isFinite(lo)) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(la + ',' + lo);
  }
  var addr = (raw.direccion || '').trim();
  if (addr) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
  return '';
}

function syncBoldTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;

  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services)
    ? raw.services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  var sec = document.getElementById('servicios');
  var list = document.getElementById('tplServicesList');
  var navSvc = document.getElementById('tplNavServicios');
  var footSvc = document.getElementById('footNavServicios');
  if (sec && list) {
    if (services.length === 0) {
      sec.style.display = 'none';
      list.innerHTML = '';
      if (navSvc) navSvc.style.display = 'none';
      if (footSvc) footSvc.style.display = 'none';
    } else {
      sec.style.display = '';
      if (navSvc) navSvc.style.display = '';
      if (footSvc) footSvc.style.display = '';
      list.innerHTML = services
        .slice(0, 9)
        .map(function (s, i) {
          var num = String(i + 1).padStart(2, '0');
          var nm = escapeHtmlTextBold(String(s.name || ''));
          var pr = escapeHtmlTextBold(formatBoldPrice(s.price));
          var dc = s.description && String(s.description).trim();
          var descHtml = dc
            ? '<p>' + escapeHtmlTextBold(String(s.description)) + '</p>'
            : '<p>&nbsp;</p>';
          return (
            '<div class="service">' +
            '<div class="service-num">→ ' + num + '</div>' +
            '<h3>' + nm + '</h3>' +
            descHtml +
            '<div class="service-price">' + pr + '</div>' +
            '</div>'
          );
        })
        .join('');
    }
  }

  var mapsUrl = buildDirectionsUrlBold(raw);
  var mapsRow = document.getElementById('mapDirectionsRow');
  var mapsA = document.getElementById('tplMapsExternalLink');
  if (mapsRow && mapsA) {
    if (mapsUrl) {
      mapsRow.classList.add('is-visible');
      mapsA.href = mapsUrl;
    } else {
      mapsRow.classList.remove('is-visible');
      mapsA.removeAttribute('href');
    }
  }

  var gUrl = (raw.google_business_url || '').trim();
  var gSection = document.getElementById('opiniones');
  var gLink = document.getElementById('tplGbizLink');
  var navOp = document.getElementById('tplNavOpiniones');
  var footOp = document.getElementById('footNavOpiniones');
  if (gSection && gLink) {
    if (gUrl) {
      gSection.classList.add('is-visible');
      gLink.href = gUrl;
      if (navOp) navOp.style.display = '';
      if (footOp) footOp.style.display = '';
    } else {
      gSection.classList.remove('is-visible');
      gLink.removeAttribute('href');
      if (navOp) navOp.style.display = 'none';
      if (footOp) footOp.style.display = 'none';
    }
  }

  var vcEnabled = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
  var vcUrl = (raw.vcard_download_url || '').trim();
  var vcWrap = document.getElementById('tplVcardWrap');
  var vcA = document.getElementById('tplVcardLink');
  if (vcWrap && vcA) {
    if (vcEnabled && vcUrl) {
      vcWrap.classList.add('is-visible');
      vcA.href = vcUrl;
    } else {
      vcWrap.classList.remove('is-visible');
      vcA.removeAttribute('href');
    }
  }

  var LW_DEFAULT_SOCIAL_BOLD = {
    instagram: 'https://www.instagram.com/onez.es',
    tiktok: 'https://www.tiktok.com/@onez',
    facebook: 'https://www.facebook.com/onez'
  };
  function boldResolveSocialHref(raw, key, fallback) {
    var u = (raw[key] || '').trim();
    return u || fallback || '#';
  }
  var igEl = document.getElementById('tplSocialInstagram');
  var ttEl = document.getElementById('tplSocialTiktok');
  var fbEl = document.getElementById('tplSocialFacebook');
  if (igEl) igEl.href = boldResolveSocialHref(raw, 'instagram_url', LW_DEFAULT_SOCIAL_BOLD.instagram);
  if (ttEl) ttEl.href = boldResolveSocialHref(raw, 'tiktok_url', LW_DEFAULT_SOCIAL_BOLD.tiktok);
  if (fbEl) fbEl.href = boldResolveSocialHref(raw, 'facebook_url', LW_DEFAULT_SOCIAL_BOLD.facebook);
}

/* ───── HORARIO render + estado abierto/cerrado ──────── */
function renderBoldSchedule() {
  var now = new Date();
  var today = now.getDay();

  var wrap = document.getElementById('schedule');
  if (!wrap) return;
  wrap.innerHTML = '';
  var ordered = SCHEDULE.slice().sort(function (a, b) {
    return ((a.idx + 6) % 7) - ((b.idx + 6) % 7);
  });
  ordered.forEach(function (d) {
    var isToday = d.idx === today;
    var openDay = Boolean(d.open);
    var row = document.createElement('div');
    row.className = 'schedule-row' + (isToday ? ' today' : '');
    var dayLabel = isToday ? d.name + ' · hoy' : d.name;
    row.innerHTML =
      '<span class="day">' + dayLabel + '</span>' +
      (openDay
        ? '<span>' + d.open + ' → ' + d.close + '</span>'
        : '<span class="closed">cerrado</span>');
    wrap.appendChild(row);
  });

  var todayD = SCHEDULE.find(function (d) { return d.idx === today; });
  var openToday = Boolean(todayD && todayD.open);
  var pill = document.getElementById('statusPill');
  var txt = document.getElementById('statusText');
  if (pill && txt) {
    pill.classList.toggle('open', openToday);
    pill.classList.toggle('closed', !openToday);
    txt.textContent = openToday ? 'Abierto hoy · cierra ' + todayD.close : 'Cerrado hoy';
  }

  var heroPill = document.getElementById('heroStatusPill');
  var heroTxt = document.getElementById('heroStatusText');
  if (heroPill && heroTxt) {
    heroTxt.textContent = openToday
      ? 'Abierto · cierra ' + todayD.close
      : 'Cerrado hoy';
    heroPill.style.color = openToday ? 'var(--lime)' : '#999';
    var dot = heroPill.querySelector('.dot');
    if (dot) {
      dot.style.background = openToday ? 'var(--lime)' : '#999';
      dot.style.animation = openToday ? 'pulse 2s infinite' : 'none';
    }
  }
}

function scrollEmbedPreviewToHash() {
  if (new URLSearchParams(window.location.search).get('embed') !== '1') return;
  var id = (window.location.hash || '').replace(/^#/, '');
  if (!id) return;
  function doScroll() {
    var el = document.getElementById(id);
    if (!el) return;
    var nav = document.querySelector('nav.nav');
    var offset = nav ? Math.round(nav.getBoundingClientRect().height) + 10 : 10;
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
  }
  requestAnimationFrame(function () { requestAnimationFrame(doScroll); });
  setTimeout(doScroll, 80);
  setTimeout(doScroll, 280);
}

/* ───── APPLY LIVE PREVIEW DATA ──────────────────────── */
function applyLivePreviewData(raw, opts) {
  opts = opts || {};
  var defaults = {
    name: 'Tu negocio',
    tagline: 'Tagline corto que describe lo que hacéis.',
    aboutText: 'Descripción del negocio: quiénes sois, qué hacéis y por qué importa.',
    phoneWa: '',
  };

  var name = (raw && raw.nombre ? String(raw.nombre).trim() : '') || defaults.name;
  var tagline = (raw && raw.tagline ? String(raw.tagline).trim() : '') || defaults.tagline;
  var phoneRaw = (raw && raw.telefono ? String(raw.telefono).trim() : '');
  var phoneWa = phoneRaw.replace(/\D/g, '') || defaults.phoneWa;
  var descripcion = (raw && raw.descripcion ? String(raw.descripcion).trim() : '');
  var direccion = (raw && raw.direccion ? String(raw.direccion).trim() : '');
  var correo = (raw && raw.correo ? String(raw.correo).trim() : '');

  var logoUrl = (raw && raw.logo_url ? String(raw.logo_url).trim() : '');
  var navEl = document.querySelector('nav.nav');
  if (navEl) {
    if (logoUrl) {
      var lsc = (raw && typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale)) ? raw.logo_scale : (logoUrl ? 1.35 : 1);
      if (lsc < 0.45) lsc = 0.45;
      if (lsc > 1.5) lsc = 1.5;
      navEl.style.setProperty('--lw-logo-scale', String(lsc));
    } else {
      navEl.style.removeProperty('--lw-logo-scale');
    }
  }
  var navBrandWrap = document.getElementById('navBrandWrap');
  var navBrandLogo = document.getElementById('navBrandLogo');
  var navBrandName = document.getElementById('navBrandName');
  if (navBrandWrap && navBrandLogo && navBrandName) {
    if (logoUrl) {
      navBrandLogo.src = logoUrl;
      navBrandLogo.alt = name + ' · logo';
      navBrandLogo.hidden = false;
      navBrandLogo.style.display = 'block';
      navBrandName.style.display = 'none';
      navBrandWrap.classList.add('brand-has-img');
    } else {
      navBrandLogo.removeAttribute('src');
      navBrandLogo.hidden = true;
      navBrandLogo.style.display = 'none';
      navBrandName.style.display = '';
      navBrandWrap.classList.remove('brand-has-img');
    }
  }
  if (navBrandName) navBrandName.textContent = name;

  var heroMetaBrand = document.getElementById('heroMetaBrand');
  if (heroMetaBrand) heroMetaBrand.textContent = name;

  var heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = name;

  var heroTagline = document.getElementById('heroTagline');
  if (heroTagline) heroTagline.textContent = tagline;

  var aboutTitle = document.getElementById('aboutTitle');
  if (aboutTitle) aboutTitle.textContent = name + '.';

  var aboutDescripcion = document.getElementById('aboutDescripcion');
  if (aboutDescripcion) aboutDescripcion.textContent = descripcion || defaults.aboutText;

  var footBrand = document.getElementById('footBrand');
  if (footBrand) {
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      var first = parts[0];
      var rest = parts.slice(1).join(' ');
      footBrand.innerHTML = escapeHtmlTextBold(first) + '<br/><span class="accent">' + escapeHtmlTextBold(rest) + '</span>';
    } else {
      footBrand.innerHTML = '<span class="accent">' + escapeHtmlTextBold(name) + '</span>';
    }
  }

  var footTagline = document.getElementById('footTagline');
  if (footTagline) footTagline.textContent = tagline;

  var footBottomBrand = document.getElementById('footBottomBrand');
  if (footBottomBrand) {
    footBottomBrand.textContent = '© ' + new Date().getFullYear() + ' · ' + name;
  }

  var ctaTitle = document.getElementById('ctaTitle');
  if (ctaTitle && !ctaTitle.dataset.userOverride) {
    ctaTitle.innerHTML = 'Reserva.<br/>Ven.<br/>Sal nuevo.';
  }

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var contactEmailLink = document.getElementById('contactEmailLink');
  var contactEmailDisplay = document.getElementById('contactEmailDisplay');
  if (contactEmailLink && contactEmailDisplay) {
    if (correo) {
      contactEmailLink.href = 'mailto:' + correo;
      contactEmailDisplay.textContent = correo;
      contactEmailLink.hidden = false;
    } else {
      contactEmailDisplay.textContent = '';
      contactEmailLink.hidden = true;
    }
  }
  var footEmailRow = document.getElementById('footEmailRow');
  var footEmailLink = document.getElementById('footEmailLink');
  var footEmailDisplay = document.getElementById('footEmailDisplay');
  if (footEmailRow && footEmailLink && footEmailDisplay) {
    if (correo) {
      footEmailLink.href = 'mailto:' + correo;
      footEmailDisplay.textContent = correo;
      footEmailRow.hidden = false;
    } else {
      footEmailDisplay.textContent = '';
      footEmailRow.hidden = true;
    }
  }

  var contactAddressRow = document.getElementById('contactAddressRow');
  var contactAddressText = document.getElementById('contactAddressText');
  if (contactAddressRow && contactAddressText) {
    if (direccion) {
      contactAddressText.textContent = direccion;
      contactAddressRow.hidden = false;
      var dirUrl = buildDirectionsUrlBold(raw);
      if (dirUrl) {
        contactAddressRow.href = dirUrl;
        contactAddressRow.target = '_blank';
        contactAddressRow.rel = 'noopener noreferrer';
      }
    } else {
      contactAddressText.textContent = '';
      contactAddressRow.hidden = true;
    }
  }
  var footAddressRow = document.getElementById('footAddressRow');
  var footAddressLink = document.getElementById('footAddressLink');
  var footAddressText = document.getElementById('footAddressText');
  if (footAddressRow && footAddressLink && footAddressText) {
    if (direccion) {
      footAddressText.textContent = direccion;
      footAddressRow.hidden = false;
      var dirUrl2 = buildDirectionsUrlBold(raw);
      if (dirUrl2) {
        footAddressLink.href = dirUrl2;
        footAddressLink.target = '_blank';
        footAddressLink.rel = 'noopener noreferrer';
      } else {
        footAddressLink.href = '#';
      }
    } else {
      footAddressText.textContent = '';
      footAddressRow.hidden = true;
    }
  }

  var photoRaw = Object.assign({}, raw || {});
  if (shouldUseUrbanSampleMedia()) {
    if (!Object.prototype.hasOwnProperty.call(photoRaw, 'portada')) photoRaw.portada = '';
    if (!Object.prototype.hasOwnProperty.call(photoRaw, 'foto_equipo')) photoRaw.foto_equipo = '';
  }
  updateBoldHeroPhoto(photoRaw);
  updateBoldAboutPhoto(photoRaw);

  var galeria = (raw && Array.isArray(raw.galeria)) ? raw.galeria.filter(Boolean) : [];
  renderBoldGallery(galeria);
  var isPro = raw && (raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1);
  updateBoldGallerySlider(isPro);

  updateBoldTicker(raw || {});

  var mlat = raw && raw.map_lat;
  var mlon = raw && raw.map_lon;
  var latN = typeof mlat === 'number' ? mlat : parseFloat(mlat);
  var lonN = typeof mlon === 'number' ? mlon : parseFloat(mlon);
  if (Number.isFinite(latN) && Number.isFinite(lonN)) {
    updateBoldPreviewMap(latN, lonN);
  } else {
    updateBoldPreviewMap(NaN, NaN);
  }

  syncBoldScheduleFromPreview(raw && raw.horario);
  renderBoldSchedule();

  syncBoldTemplateExtensions(raw || {});

  if (opts.alignToHash) scrollEmbedPreviewToHash();

  if (typeof window.tvAnimationsRefresh === 'function') {
    var embedBooted =
      document.body.classList.contains('embed-preview') && document.body.dataset.lwTvBoot === '1';
    if (embedBooted && typeof window.tvEmbedPreviewRefresh === 'function') {
      requestAnimationFrame(function () { window.tvEmbedPreviewRefresh(); });
    } else {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }
}

/* ───── INIT FROM QUERY (fallback dev) ──────────────── */
(function initUrbanPreviewSampleMedia() {
  if (!shouldUseUrbanSampleMedia()) return;
  function boot() {
    updateBoldHeroPhoto({ portada: '' });
    updateBoldAboutPhoto({ foto_equipo: '' });
    renderBoldGallery([]);
    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (!params.has('preview')) {
    if (shouldUseUrbanSampleMedia()) {
      updateBoldHeroPhoto({ portada: '' });
      updateBoldAboutPhoto({ foto_equipo: '' });
    }
    return;
  }
  applyLivePreviewData({
    nombre: params.get('nombre') || '',
    tagline: params.get('tagline') || '',
    telefono: params.get('telefono') || '',
    portada: params.get('portada') || '',
    descripcion: params.get('descripcion') || '',
    foto_equipo: params.get('foto_equipo') || '',
    direccion: params.get('direccion') || '',
    correo: params.get('correo') || '',
  }, { alignToHash: !!window.location.hash.replace(/^#/, '') });
})();

/* ───── NAV ACTIVO (IntersectionObserver) ────────────── */
(function initBoldActiveNav() {
  var navList = document.getElementById('boldNavList');
  if (!navList) return;
  var links = Array.prototype.slice.call(navList.querySelectorAll('a[data-nav-link]'));
  if (links.length === 0) return;

  // Mapa hash → enlace
  var byId = {};
  links.forEach(function (a) {
    var key = a.getAttribute('data-nav-link');
    if (key) byId[key] = a;
  });

  // IDs reales que existen en el DOM
  var ids = Object.keys(byId).filter(function (id) {
    return document.getElementById(id) != null;
  });
  if (ids.length === 0) return;

  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav-link') === id);
    });
  }

  // IntersectionObserver: el ítem activo es la sección cuya parte superior está
  // más cerca del 25% superior del viewport
  var visible = new Map();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
      else visible.delete(e.target.id);
    });
    // Elegir la sección con mayor ratio visible
    var bestId = null;
    var bestRatio = 0;
    visible.forEach(function (ratio, id) {
      if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
    });
    if (bestId) setActive(bestId);
  }, {
    // Margen superior negativo para que la sección "active" cambie cuando
    // su título cruza un 25% por debajo del top del viewport
    rootMargin: '-25% 0px -55% 0px',
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
  });

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) io.observe(el);
  });

  // Click en un enlace marca su sección como activa de inmediato (UX inmediato
  // antes de que el smooth scroll termine).
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var id = a.getAttribute('data-nav-link');
      if (id) setActive(id);
    });
  });

  // Estado inicial: si hay hash, marcarlo
  var initial = (window.location.hash || '').replace(/^#/, '');
  if (initial && byId[initial]) setActive(initial);
})();

/* ───── MENÚ MÓVIL (hamburguesa) ─────────────────────── */
(function initBoldMobileMenu() {
  var nav = document.querySelector('nav.nav');
  var btn = document.getElementById('navMenuToggle');
  var list = document.getElementById('boldNavList');
  if (!nav || !btn || !list) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!nav.classList.contains('is-open'));
  });

  // Cerrar al pulsar un enlace del menú
  list.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== list) {
      if (t.tagName === 'A') { setOpen(false); break; }
      t = t.parentNode;
    }
  });

  // Cerrar al hacer click fuera del nav
  document.addEventListener('click', function (e) {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(e.target)) return;
    setOpen(false);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
  });

  // Si se redimensiona a desktop, cerrar (por si quedó abierto)
  var mq = window.matchMedia('(min-width:881px)');
  function onChange(ev) { if (ev.matches) setOpen(false); }
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();

setInterval(renderBoldSchedule, 60000);
</script>
<div id="lw-gallery-lightbox" class="lw-gallery-lightbox" hidden aria-modal="true" role="dialog" aria-label="Imagen a tamaño completo">
  <button type="button" class="lw-gallery-lightbox-backdrop" tabindex="-1" aria-label="Cerrar"></button>
  <figure class="lw-gallery-lightbox-frame">
    <button type="button" class="lw-gallery-lightbox-close" aria-label="Cerrar">×</button>
    <img class="lw-gallery-lightbox-img" src="" alt="" decoding="async"/>
  </figure>
</div>
<script>
(function initLwGalleryLightbox(){
  var lb=document.getElementById('lw-gallery-lightbox');
  if(!lb)return;
  var backdrop=lb.querySelector('.lw-gallery-lightbox-backdrop');
  var closeBtn=lb.querySelector('.lw-gallery-lightbox-close');
  var imgEl=lb.querySelector('.lw-gallery-lightbox-img');
  var prevOverflow='';
  function openLb(src,alt){
    if(!src)return;
    imgEl.src=src;
    imgEl.alt=alt||'';
    lb.hidden=false;
    prevOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
  }
  function closeLb(){
    lb.hidden=true;
    imgEl.removeAttribute('src');
    imgEl.alt='';
    document.body.style.overflow=prevOverflow||'';
  }
  document.addEventListener('click',function(e){
    var sec=document.getElementById('galeria');
    if(!sec||!sec.contains(e.target))return;
    if(e.target.closest('#lw-gallery-lightbox'))return;
    var im=e.target.closest('img');
    if(im&&sec.contains(im)){
      e.preventDefault();
      e.stopPropagation();
      openLb(im.currentSrc||im.src,im.alt||'');
      return;
    }
    var tile=e.target.closest('[data-lightbox-src]');
    if(tile&&sec.contains(tile)){
      var u=tile.getAttribute('data-lightbox-src');
      if(u){ e.preventDefault(); openLb(u,''); }
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!lb.hidden)closeLb();
    if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.closest){
      var t=e.target.closest('#galeria [data-lightbox-src]');
      if(t&&document.getElementById('galeria')&&document.getElementById('galeria').contains(t)){
        e.preventDefault();
        var u=t.getAttribute('data-lightbox-src');
        if(u)openLb(u,'');
      }
    }
  });
  if(backdrop)backdrop.addEventListener('click',closeLb);
  if(closeBtn)closeBtn.addEventListener('click',closeLb);
})();
</script>


<script>
/* URBAN-BOLD animations — capa visual; no altera preview ni datos */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tvIo = null;
  var booted = false;

  function isHidden(el) {
    if (!el) return true;
    var st = window.getComputedStyle(el);
    return st.display === 'none' || st.visibility === 'hidden';
  }

  function isInViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.96 && r.bottom > 0;
  }

  function markReveal(el, anim) {
    if (!el || el.classList.contains('tv-reveal') || el.closest('.no-anim')) return;
    if (isHidden(el)) return;
    el.classList.add('tv-reveal');
    if (anim) el.setAttribute('data-anim', anim);
  }

  function tagImgReveal(wrap, anim) {
    if (!wrap || isHidden(wrap)) return;
    if (document.body.classList.contains('embed-preview') && wrap.classList.contains('tv-in')) return;
    var img = wrap.querySelector('img');
    if (!img || img.hidden || !img.getAttribute('src')) {
      markReveal(wrap, anim === 'clipR' ? 'right' : 'up');
      return;
    }
    if (!wrap.classList.contains('tv-img-reveal')) {
      wrap.classList.add('tv-img-reveal', 'tv-reveal');
      wrap.setAttribute('data-anim', anim);
    }
    if (isInViewport(wrap)) wrap.classList.add('tv-in');
  }

  function splitWords(el) {
    if (!el || el.dataset.tvSplit === 'done') return;
    if (el.children.length > 0 && !el.querySelector('.tv-word')) return;
    var words = el.textContent.split(/(\s+)/);
    el.textContent = '';
    var wordIndex = 0;
    words.forEach(function (w) {
      if (/^\s+$/.test(w)) {
        el.appendChild(document.createTextNode(w));
        return;
      }
      if (!w) return;
      var span = document.createElement('span');
      span.className = 'tv-word';
      span.style.setProperty('--i', wordIndex);
      var inner = document.createElement('span');
      inner.textContent = w;
      span.appendChild(inner);
      el.appendChild(span);
      wordIndex += 1;
    });
    el.dataset.tvSplit = 'done';
  }

  function refreshHeroTitleSplit() {
    var el = document.getElementById('heroTitle');
    if (!el) return;
    var plain = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (el.dataset.tvSplit === 'done' && el.dataset.tvSplitText === plain) {
      el.classList.add('tv-split');
      if (isInViewport(el)) el.classList.add('tv-in');
      return;
    }
    el.dataset.tvSplitText = plain;
    el.classList.remove('tv-reveal');
    el.removeAttribute('data-anim');
    el.classList.add('tv-split');
    delete el.dataset.tvSplit;
    splitWords(el);
    if (isInViewport(el)) el.classList.add('tv-in');
  }

  function cleanupLegacyTvTags() {
    document.querySelectorAll('section.tv-reveal, .tv-magnetic, .tv-parallax, .tv-cursor').forEach(function (el) {
      el.classList.remove('tv-reveal', 'tv-in', 'tv-img-reveal', 'tv-magnetic', 'tv-parallax', 'tv-cursor');
      el.removeAttribute('data-anim');
      el.removeAttribute('data-delay');
      if (el.style && el.style.transform) el.style.transform = '';
    });
  }

  function autoTag() {
    cleanupLegacyTvTags();

    document.querySelectorAll('.nav ul a.tv-link-flash').forEach(function (el) {
      el.classList.remove('tv-link-flash');
    });

    document.querySelectorAll('.hero-meta .mono, .hero-meta .live, .hero-tag, .hero-cta .btn').forEach(function (el, i) {
      if (!el.classList.contains('tv-hero-anim')) {
        el.classList.add('tv-hero-anim', 'd' + Math.min(i + 1, 3));
      }
    });

    refreshHeroTitleSplit();

    tagImgReveal(document.getElementById('heroPhotoWrap'), 'clipR');

    document.querySelectorAll('.section-head').forEach(function (el) {
      markReveal(el, 'up');
    });
    document.querySelectorAll('.section-head .display, .section-title').forEach(function (el) {
      markReveal(el, 'slam');
    });

    document.querySelectorAll('#tplServicesList .service').forEach(function (el, i) {
      markReveal(el, 'snap');
      el.classList.add('tv-hover-lift');
      el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
    });

    document.querySelectorAll('#galleryLive .gallery-item').forEach(function (el, i) {
      markReveal(el, 'zoom');
      el.classList.add('tv-hover-zoom');
      el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
    });

    tagImgReveal(document.getElementById('aboutPhotoWrap'), 'clip');

    document.querySelectorAll('#sobre-nosotros .section-num, #aboutDescripcion').forEach(function (el) {
      markReveal(el, 'left');
    });
    var aboutTitle = document.getElementById('aboutTitle');
    if (aboutTitle) markReveal(aboutTitle, 'slam');

    document.querySelectorAll('.info-block').forEach(function (el, i) {
      markReveal(el, i === 0 ? 'left' : 'right');
    });

    var reviewsSec = document.querySelector('.reviews-cta-section.is-visible');
    if (reviewsSec && !isHidden(reviewsSec)) markReveal(reviewsSec, 'fade');

    var vcard = document.querySelector('.vcard-strip.is-visible');
    if (vcard && !isHidden(vcard)) markReveal(vcard, 'snap');

    var cta = document.querySelector('.cta');
    if (cta) markReveal(cta, 'slam');

    document.querySelectorAll('.nav-cta, .btn-primary, .btn-ghost, .cta-btn, .reviews-cta-section .btn-primary').forEach(function (el) {
      if (!el.classList.contains('tv-btn-shine')) el.classList.add('tv-btn-shine');
    });

    document.querySelectorAll('#heroTitle, .section-title').forEach(function (el) {
      if (!el.classList.contains('tv-glitch-hover')) el.classList.add('tv-glitch-hover');
    });
  }

  function revealInViewport() {
    document.querySelectorAll('.tv-reveal:not(.tv-in), .tv-split:not(.tv-in)').forEach(function (el) {
      if (isInViewport(el)) el.classList.add('tv-in');
    });
  }

  function observe() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.tv-reveal, .tv-split').forEach(function (el) {
        el.classList.add('tv-in');
      });
      return;
    }
    if (!tvIo) {
      tvIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('tv-in');
              tvIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -54px 0px' },
      );
    }
    document.querySelectorAll('.tv-reveal:not(.tv-in), .tv-split:not(.tv-in)').forEach(function (el) {
      if (!isHidden(el)) tvIo.observe(el);
    });
  }

  function runRevealPass() {
    revealInViewport();
    observe();
  }

  function scrollProgress() {
    if (document.querySelector('.tv-scroll-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'tv-scroll-progress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement;
      var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.width = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function stickyHeader() {
    var nav = document.querySelector('nav.nav');
    if (!nav || nav.dataset.tvStickyBound) return;
    nav.dataset.tvStickyBound = '1';
    function update() {
      if (window.scrollY > 16) nav.classList.add('tv-header-scrolled');
      else nav.classList.remove('tv-header-scrolled');
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  window.tvAnimationsRefresh = function () {
    if (reduced) return;
    autoTag();
    runRevealPass();
    requestAnimationFrame(runRevealPass);
  };

  window.tvEmbedPreviewRefresh = function () {
    if (reduced) return;
    refreshHeroTitleSplit();
    document.querySelectorAll('#tplServicesList .service').forEach(function (el, i) {
      if (!el.classList.contains('tv-reveal')) {
        markReveal(el, 'snap');
        el.classList.add('tv-hover-lift');
        el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
      }
    });
    document.querySelectorAll('#galleryLive .gallery-item').forEach(function (el, i) {
      if (!el.classList.contains('tv-reveal')) {
        markReveal(el, 'zoom');
        el.classList.add('tv-hover-zoom');
        el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
      }
    });
    runRevealPass();
  };

  function boot() {
    if (booted) return;
    booted = true;
    if (document.body.classList.contains('embed-preview')) {
      document.body.dataset.lwTvBoot = '1';
    }
    document.body.classList.add('tv-loaded');
    if (reduced) {
      document.querySelectorAll('.tv-reveal, .tv-split').forEach(function (el) {
        el.classList.add('tv-in');
      });
      return;
    }
    autoTag();
    runRevealPass();
    scrollProgress();
    stickyHeader();
    setTimeout(runRevealPass, 100);
    setTimeout(runRevealPass, 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
</script>



@endverbatim

<script>
(function bootUrbanBoldTenantPage() {
  function run() {
    if (typeof applyLivePreviewData === 'function') {
      applyLivePreviewData({
        logo_url: @json($logo_url),
        logo_scale: @json($logo_scale ?? null),
        nombre: @json($nombre),
        tagline: @json($tagline),
        telefono: @json($telefono),
        whatsapp: @json($whatsapp),
        portada: @json($portada),
        portada_2: @json($portada_2),
        portada_3: @json($portada_3),
        descripcion: @json($descripcion),
        foto_equipo: @json($foto_equipo),
        direccion: @json($direccion),
        correo: @json($correo),
        galeria: @json($galeria),
        horario: @json($horario),
        map_lat: @json($map_lat),
        map_lon: @json($map_lon),
        services: @json($services),
        google_maps_url: @json($google_maps_url),
        google_business_url: @json($google_business_url),
        booking_url: @json($booking_url),
        vcard_enabled: @json($vcard_enabled),
        is_pro: @json($is_pro),
        subdomain: @json($subdomain),
        api_base_url: @json($api_base_url),
        vcard_download_url: @json($vcard_download_url),
        instagram_url: @json($instagram_url),
        tiktok_url: @json($tiktok_url),
        facebook_url: @json($facebook_url)
      });
    }
    updateBoldTicker({
      nombre: @json($nombre),
      tagline: @json($tagline),
      direccion: @json($direccion)
    });
    if (typeof window.__lwLat === 'number' && typeof window.__lwLon === 'number') {
      updateBoldPreviewMap(window.__lwLat, window.__lwLon);
    } else {
      updateBoldPreviewMap(NaN, NaN);
    }
    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
</script>

@endpush
