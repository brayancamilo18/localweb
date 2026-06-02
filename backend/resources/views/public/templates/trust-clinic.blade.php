@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
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
  /* ═══════════ TRUST-CLINIC — ORIGINAL TOKENS ═══════════ */
  :root{
    --bg:#FBFAF7;
    --paper:#FFFFFF;
    --ink:#0E1F1A;
    --ink-2:#3A4A45;
    --ink-3:#7A8A85;
    --line:#E5E2D9;
    --line-2:#D4D0C4;
    --accent:#1A4F3F;
    --accent-2:color-mix(in srgb, var(--accent) 82%, #000000);
    --accent-soft:color-mix(in srgb, var(--accent) 8%, #ffffff);
    --gold:#A88B4A;
    --warn:#B85C39;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:"Inter",-apple-system,sans-serif;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
  section[id],a[id]{scroll-margin-top:80px}
  ::selection{background:var(--accent);color:#fff}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;cursor:pointer;border:none;background:none}
  img{display:block;max-width:100%}
  .serif{font-family:"Source Serif 4",Georgia,serif;font-weight:400;letter-spacing:-0.005em}
  .container{max-width:1280px;margin:0 auto;padding:0 46px}
  .eyebrow{display:inline-block;font-size:11.5px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:0.14em}
  .rule{display:inline-block;width:46px;height:1px;background:var(--accent);vertical-align:4px;margin-right:14px}

  /* ─── NAV ─── */
  .nav{position:sticky;top:0;z-index:9000;background:var(--paper);border-bottom:1px solid var(--line);transition:box-shadow .2s}
  .nav.scrolled{box-shadow:0 1px 0 var(--line-2),0 8px 24px -16px rgba(14,31,26,.08)}
  .nav-inner{display:flex;justify-content:space-between;align-items:center;padding:18px 46px;max-width:1280px;margin:0 auto}
  .brand{display:flex;align-items:center;gap:14px}
  .brand-mark{width:54px;height:54px;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:"Source Serif 4",serif;font-size:20px;font-weight:600;letter-spacing:-0.01em}
  .brand-name{display:flex;flex-direction:column;line-height:1.15}
  .brand-name strong{font-family:"Source Serif 4",serif;font-size:19px;font-weight:600;letter-spacing:-0.01em;color:var(--ink)}
  .brand-name small{font-size:10.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.12em;font-weight:500;margin-top:2px}
  #navBrandName{font-family:"Source Serif 4",serif;font-size:19px;font-weight:600;letter-spacing:-0.01em;color:var(--ink)}
  .nav{--lw-logo-scale:1}
  .nav .brand.brand-has-img .nav-brand-img{display:block;height:calc(50px * var(--lw-logo-scale,1));width:auto;max-width:calc(260px * var(--lw-logo-scale,1));object-fit:contain;image-rendering:auto}
  .nav .brand.brand-has-img .brand-mark{display:none !important}
  .nav .brand.brand-has-img #navBrandName{display:none !important}
  .nav ul{list-style:none;display:flex;gap:50px;align-items:center}
  .nav ul a{font-size:14px;font-weight:500;color:var(--ink-2);padding:6px 0;border-bottom:1px solid transparent;transition:color .15s,border-color .15s}
  .nav ul a:hover{color:var(--accent);border-color:var(--accent)}
  .nav ul a.is-active{color:var(--accent);border-color:var(--accent)}
  .nav-actions{display:flex;align-items:center;gap:14px}
  .nav-cta{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:var(--accent);color:#fff;font-size:13.5px;font-weight:500;letter-spacing:0.005em;transition:background .15s}
  .nav-cta:hover{background:var(--ink)}
  .menu-toggle{display:none;width:42px;height:42px;background:transparent;border:1px solid var(--line);flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0}
  .menu-toggle span{display:block;width:18px;height:1.5px;background:var(--ink);transition:transform .25s,opacity .15s}
  .nav.is-open .menu-toggle span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
  .nav.is-open .menu-toggle span:nth-child(2){opacity:0}
  .nav.is-open .menu-toggle span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}

  /* ─── HERO ─── */
  .hero{padding:96px 0 80px;border-bottom:1px solid var(--line);position:relative}
  .hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:80px;align-items:start}
  .hero-meta{display:flex;align-items:center;gap:14px;margin-bottom:50px}
  .hero-meta .live{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;color:var(--ink-3);text-transform:uppercase;letter-spacing:.16em}
  .hero-meta .live .dot{width:8px;height:8px;background:var(--accent);animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .hero h1{font-family:"Source Serif 4",serif;font-size:clamp(44px,5.5vw,72px);font-weight:500;line-height:1.07;letter-spacing:-0.025em;color:var(--ink);margin-bottom:46px}
  .hero h1 em{font-style:italic;color:var(--accent);font-weight:400}
  .hero-tag{font-size:17px;line-height:1.65;color:var(--ink-2);max-width:520px;margin-bottom:54px}
  .hero-cta{display:flex;gap:14px;margin-bottom:48px;flex-wrap:wrap}
  .btn-p{display:inline-flex;align-items:center;gap:10px;padding:15px 28px;background:var(--accent);color:#fff;font-size:14px;font-weight:500;transition:background .15s,transform .15s}
  .btn-p:hover{background:var(--ink);transform:translateY(-1px)}
  .btn-g{display:inline-flex;align-items:center;gap:10px;padding:15px 24px;background:transparent;color:var(--ink);font-size:14px;font-weight:500;border:1px solid var(--line-2);transition:border-color .15s,color .15s}
  .btn-g:hover{border-color:var(--accent);color:var(--accent)}
  .hero-card{background:var(--paper);border:1px solid var(--line);padding:8px;position:relative}
  .hero-card::before{content:"";position:absolute;top:-8px;right:-8px;width:48px;height:48px;border-top:2px solid var(--accent);border-right:2px solid var(--accent)}
  .hero-card::after{content:"";position:absolute;bottom:-8px;left:-8px;width:48px;height:48px;border-bottom:2px solid var(--accent);border-left:2px solid var(--accent)}
  .hero-portrait{width:100%;aspect-ratio:4/5;background:var(--line) center/cover;filter:saturate(.9)}

  /* ─── TICKER ─── */
  .ticker{background:var(--paper);border-bottom:1px solid var(--line);padding:24px 0;overflow:hidden}
  .ticker-track{display:flex;gap:46px;font-size:13px;font-weight:500;color:var(--ink-2);white-space:nowrap;animation:scroll 40s linear infinite;text-transform:uppercase;letter-spacing:.06em}
  .ticker .star{color:var(--accent);font-size:10px}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* ─── SECTIONS ─── */
  section{padding:120px 0}
  .section-head{display:grid;grid-template-columns:1fr 1.4fr;gap:80px;margin-bottom:72px;align-items:end}
  .section-head h2{font-family:"Source Serif 4",serif;font-size:clamp(50px,4.5vw,56px);font-weight:500;line-height:1.1;letter-spacing:-0.025em;margin-top:18px}
  .section-head h2 em{font-style:italic;color:var(--accent);font-weight:400}
  .section-head .desc{font-size:16px;color:var(--ink-2);line-height:1.65;max-width:520px;padding-bottom:8px}

  /* ─── SERVICES (trust-clinic original) ─── */
  .services-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border-top:1px solid var(--line)}
  .svc{padding:54px 46px 50px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);position:relative;background:var(--paper);transition:background .2s}
  .svc:nth-child(2n){border-right:none}
  .svc:hover{background:#FDFCF8}
  .svc-num{position:absolute;top:46px;right:46px;font-family:"Source Serif 4",serif;font-size:13px;color:var(--ink-3);font-style:italic}
  .svc h3{font-family:"Source Serif 4",serif;font-size:24px;font-weight:600;letter-spacing:-0.015em;margin-bottom:8px;line-height:1.2;max-width:80%}
  .svc-body{font-size:14.5px;color:var(--ink-2);line-height:1.65;margin-bottom:24px}
  .svc-foot{display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;border-top:1px dashed var(--line-2)}
  .svc-price{font-family:"Source Serif 4",serif;font-size:22px;font-weight:600;color:var(--accent);letter-spacing:-0.01em}
  .svc-price small{font-size:12px;color:var(--ink-3);font-family:"Inter";font-weight:400;margin-left:4px}
  .svc-link{font-size:13px;color:var(--accent);font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:gap .2s}
  .svc:hover .svc-link{gap:10px}

  /* ─── ABOUT (trust-clinic original) ─── */
  .trust-section{background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .trust-img{aspect-ratio:5/6;background:var(--line) center/cover;position:relative}
  .trust-content h2{font-family:"Source Serif 4",serif;font-size:clamp(48px,4vw,52px);font-weight:500;line-height:1.1;letter-spacing:-0.02em;margin:18px 0 28px}
  .trust-content h2 em{font-style:italic;color:var(--accent);font-weight:400}
  .trust-content > p{font-size:16px;line-height:1.7;color:var(--ink-2);margin-bottom:20px;max-width:520px}


  /* ABOUT EXTRAS (trust-clinic) */
  .trust-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:64px;padding-top:48px;border-top:1px solid var(--line)}
  .trust-about-extra--text-first .trust-about-extra__photo{order:2}
  .trust-about-extra--text-first .trust-content{order:1}
  .trust-about-extra--photo-first .trust-about-extra__photo{order:1}
  .trust-about-extra--photo-first .trust-content{order:2}
  .trust-about-extra .trust-content h3{font-family:"Source Serif 4",serif;font-size:clamp(36px,3.5vw,46px);font-weight:500;line-height:1.1;letter-spacing:-0.02em;margin:18px 0 28px}
  @media (max-width:900px){.trust-about-extra.trust-grid{grid-template-columns:1fr;gap:40px}.trust-about-extra .trust-about-extra__photo{order:-1!important}}

  .trust-about-extras{display:flex;flex-direction:column;gap:80px;margin-top:64px;padding-top:48px;border-top:1px solid var(--line)}
  .trust-about-extra--text-first .trust-about-extra__photo{order:2}
  .trust-about-extra--text-first .trust-content{order:1}
  .trust-about-extra--photo-first .trust-about-extra__photo{order:1}
  .trust-about-extra--photo-first .trust-content{order:2}
  .trust-about-extra .trust-content h3{font-family:"Source Serif 4",serif;font-size:clamp(36px,3.5vw,46px);font-weight:500;line-height:1.1;letter-spacing:-0.02em;margin:18px 0 28px}
  @media (max-width:900px){.trust-about-extra.trust-grid{grid-template-columns:1fr;gap:40px}.trust-about-extra .trust-about-extra__photo{order:-1!important}}
  /* ─── GALLERY (trust-clinic original) ─── */
  .trust-gal-section{padding:72px 0;border-top:1px solid var(--line)}
  .trust-gal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .trust-gal-grid img{width:100%;height:220px;object-fit:cover;border-radius:6px;cursor:zoom-in}
  @media (max-width:900px){.trust-gal-grid{grid-template-columns:1fr}}

  /* ─── HOURS / CONTACT (trust-clinic original) ─── */
  .info-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:46px;border-top:1px solid var(--line)}
  .info-card{background:var(--paper);border:1px solid var(--line);padding:54px}
  .info-card h3{font-family:"Source Serif 4",serif;font-size:24px;font-weight:600;margin:14px 0 24px;letter-spacing:-0.015em}
  .schedule-row{display:grid;grid-template-columns:1fr auto;padding:13px 0;border-bottom:1px solid var(--line);font-size:14.5px;align-items:center;gap:16px}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row.today{background:var(--accent-soft);margin:0 -16px;padding:13px 16px;border-bottom:1px solid var(--line);position:relative}
  .schedule-row.today::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
  .schedule-row.today .day{color:var(--accent);font-weight:600}
  .schedule-row.today .day::after{content:" — hoy";font-weight:400;color:var(--ink-3);font-style:italic;font-family:"Source Serif 4"}
  .schedule-row .day{color:var(--ink-2)}
  .schedule-row .time{font-variant-numeric:tabular-nums;color:var(--ink);font-weight:500}
  .schedule-row .time.closed{color:var(--ink-3);font-style:italic;font-family:"Source Serif 4";font-weight:400}
  .schedule-status{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;background:var(--accent-soft);color:var(--accent);font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
  .schedule-status .dot{width:7px;height:7px;background:var(--accent)}
  .schedule-status.open .dot{animation:statusPulse 2.4s infinite}
  .schedule-status.closed{background:var(--bg);color:var(--ink-3)}
  .schedule-status.closed .dot{background:var(--ink-3);animation:none}
  @keyframes statusPulse{0%{box-shadow:0 0 0 0 rgba(26,79,63,.6)}70%{box-shadow:0 0 0 8px rgba(26,79,63,0)}100%{box-shadow:0 0 0 0 rgba(26,79,63,0)}}
  .contact-list{display:flex;flex-direction:column;gap:0}
  .contact-list a{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);font-size:14.5px;font-weight:500;transition:padding .15s}
  .contact-list a:last-child{border-bottom:none}
  .contact-list a:hover{padding-left:6px}
  .contact-list .icon{width:50px;height:50px;background:var(--accent);color:#fff;display:grid;place-items:center;font-size:14px;flex-shrink:0}

  /* ─── MAP ─── */
  .map-section{max-width:1280px;margin:0 auto;border:1px solid var(--line);border-top:none;overflow:hidden}
  .map-section.bold-map-empty{display:none}
  .map-shell{position:relative;background:var(--line)}
  .map-leaflet{height:min(354px,50vh);min-height:220px;width:100%;background:var(--line)}
  .map-shell .leaflet-container{font-family:"Inter";background:var(--line)}
  .map-shell .leaflet-control-zoom a{display:flex;align-items:center;justify-content:center;width:50px;height:50px;padding:0;line-height:1;font-size:22px;text-align:center;text-decoration:none;background:var(--paper);color:var(--accent);border:1px solid var(--line);font-weight:600}
  .map-shell .leaflet-control-zoom a:hover{background:var(--accent);color:#fff}
  .map-shell .leaflet-bar{border:none;box-shadow:none}
  .map-shell .leaflet-control-attribution{background:var(--paper)!important;color:var(--ink-3)!important;font-size:10px!important}
  .map-shell .leaflet-control-attribution a{color:var(--accent)!important}
  .bold-leaflet-divicon{background:transparent!important;border:none!important}
  .bold-map-pin-wrap{position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;pointer-events:none}
  .bold-map-core{width:12px;height:12px;background:var(--accent);border:3px solid var(--paper);box-shadow:0 0 0 1px var(--accent),0 4px 12px rgba(0,0,0,.2);position:relative;z-index:2}
  .bold-map-radar-ring{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border:2px solid var(--accent);box-shadow:0 0 10px rgba(26,79,63,.25);transform-origin:center center;animation:boldMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;pointer-events:none}
  .bold-map-radar-ring.d2{animation-delay:1.25s}
  @keyframes boldMapRadar{0%{transform:scale(0.4);opacity:.95}65%{opacity:.2}100%{transform:scale(2.15);opacity:0}}
  .map-directions-row{display:none;justify-content:flex-start;align-items:center;padding:20px 46px;background:var(--paper)}
  .map-directions-row.is-visible{display:flex}

  /* ─── REVIEWS CTA ─── */
  .reviews-cta-section{max-width:1280px;margin:24px auto 0;background:var(--paper);border:1px solid var(--line);padding:54px;display:none;flex-direction:column;gap:14px;align-items:flex-start}
  .reviews-cta-section.is-visible{display:flex}
  .reviews-cta-section h3{font-family:"Source Serif 4";font-size:24px;font-weight:600;line-height:1.1;letter-spacing:-.015em}
  .reviews-cta-section p{font-size:14px;line-height:1.55;color:var(--ink-2);max-width:520px}

  /* ─── VCARD ─── */
  .vcard-strip{max-width:1280px;margin:24px auto 0;background:var(--ink);color:#fff;padding:28px 46px;display:none;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .vcard-strip.is-visible{display:flex}
  .vcard-strip strong{font-family:"Source Serif 4";font-size:22px;font-weight:600;letter-spacing:-.01em}
  .vcard-strip small{font-size:11px;color:var(--ink-3);display:block;margin-top:4px;letter-spacing:.02em}

  /* ─── CTA (trust-clinic original) ─── */
  .cta-strip{background:var(--ink);color:#fff;padding:80px 0;border-top:4px solid var(--accent)}
  .cta-inner{display:grid;grid-template-columns:1.4fr 1fr;gap:48px;align-items:center}
  .cta-strip h2{font-family:"Source Serif 4",serif;font-size:clamp(46px,4vw,48px);font-weight:500;line-height:1.15;letter-spacing:-0.02em}
  .cta-strip h2 em{font-style:italic;color:#A8C9BC}
  .cta-actions{display:flex;flex-direction:column;gap:14px}
  .cta-actions .btn-p{background:var(--paper);color:var(--ink);justify-content:center;padding:18px 24px;font-weight:600}
  .cta-actions .btn-p:hover{background:var(--accent);color:#fff}
  .cta-actions .btn-g{border-color:rgba(255,255,255,.2);color:#fff;justify-content:center;padding:18px 24px}
  .cta-actions .btn-g:hover{border-color:#fff;color:#fff;background:rgba(255,255,255,.05)}

  /* ─── FOOTER (trust-clinic original) ─── */
  footer{background:var(--paper);padding:80px 0 46px;border-top:1px solid var(--line)}
  .foot{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid var(--line)}
  .foot-brand{font-family:"Source Serif 4";font-size:28px;font-weight:600;letter-spacing:-.015em;line-height:1;margin-bottom:18px;color:var(--ink)}
  .foot-brand .accent{color:var(--accent)}
  .foot p{font-size:13.5px;color:var(--ink-2);line-height:1.65;max-width:354px}
  .foot h4{font-family:"Source Serif 4",serif;font-size:14px;font-weight:600;color:var(--ink);margin-bottom:18px;letter-spacing:-0.005em}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:11px}
  .foot ul a{font-size:13.5px;color:var(--ink-2);transition:color .15s}
  .foot ul a:hover{color:var(--accent)}
  .foot-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:24px;font-size:12px;color:var(--ink-3);flex-wrap:wrap;gap:10px}
  .foot-bottom a{color:var(--accent);font-weight:500}

  /* ─── EMBED ─── */
  html.embed-preview-root{scroll-behavior:auto!important}
  body.embed-preview #aboutExtraBlocks .tv-reveal,
  body.embed-preview #aboutExtraBlocks .tv-split,
  body.trust-preview #aboutExtraBlocks .tv-reveal,
  body.trust-preview #aboutExtraBlocks .tv-split{
    opacity:1!important;
    transform:none!important;
    filter:none!important;
    clip-path:none!important;
    animation:none!important;
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width:980px){
    .hero-grid{grid-template-columns:1fr;gap:48px}
    .hero-card{max-width:380px}
    .section-head{grid-template-columns:1fr;gap:24px}
    .services-grid{grid-template-columns:1fr}
    .svc{border-right:none}
    .trust-grid{grid-template-columns:1fr;gap:54px}
    .trust-img{max-width:480px;margin:0 auto;width:100%}
    .info-grid{grid-template-columns:1fr;gap:16px}
    .cta-inner{grid-template-columns:1fr;gap:46px}
    .foot{grid-template-columns:1fr 1fr;gap:50px}
  }
  @media (max-width:680px){
    .container{padding:0 20px}
    .nav ul,.nav-cta{display:none}
    .menu-toggle{display:flex}
    .nav-inner{padding:14px 20px}
    .brand-mark{width:50px;height:50px;font-size:18px}
    #navBrandName{font-size:16px}
    .brand-name small{font-size:9.5px}
    .hero{padding:56px 0 56px}
    section{padding:64px 0}
    .svc{padding:28px 22px}
    .svc h3{max-width:100%}
    .info-card{padding:24px}
    .schedule-row.today{margin:0 -10px;padding:13px 10px}
    .foot{grid-template-columns:1fr;gap:46px}
    .foot-bottom{flex-direction:column;gap:8px;text-align:center}
    .cta-strip{padding:48px 0}
    .map-section{margin-left:0;margin-right:0}
    .reviews-cta-section,.vcard-strip{margin-left:0;margin-right:0}
    .trust-gal-grid{grid-template-columns:1fr}
    .nav.is-open ul{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;background:var(--paper);border-top:1px solid var(--line);padding:8px 20px 16px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.08)}
    .nav.is-open ul li{border-bottom:1px solid var(--line)}
    .nav.is-open ul li:last-child{border-bottom:none}
    .nav.is-open ul a{display:block;padding:14px 4px;font-size:15px;color:var(--ink)}
  }
  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    html{scroll-behavior:auto!important}
  }

  /* ─── LIGHTBOX ─── */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;font-family:system-ui,sans-serif}
  @media (max-width:654px){.lw-gallery-lightbox-close{top:8px;right:8px}}

  /* ═══════════ TRUST-CLINIC PRO ANIMATIONS ═══════════ */
  :root{
    --tv-ease: cubic-bezier(.22,.61,.36,1);
    --tv-ease-out-expo: cubic-bezier(.16,1,.3,1);
    --tv-ease-in-out: cubic-bezier(.65,.05,.36,1);
  }
  @keyframes tv-fade-in{from{opacity:0}to{opacity:1}}
  @keyframes tv-fade-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
  @keyframes tv-fade-down{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:none}}
  @keyframes tv-fade-left{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
  @keyframes tv-fade-right{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
  @keyframes tv-zoom-in{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
  @keyframes tv-blur-in{from{opacity:0;filter:blur(14px);transform:translateY(10px)}to{opacity:1;filter:blur(0);transform:none}}
  @keyframes tv-clip-up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes tv-kenburns{0%{transform:scale(1.02)}100%{transform:scale(1.08)}}
  @keyframes tv-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
  @keyframes tv-img-before{0%{transform:scaleX(1);transform-origin:left}50%,100%{transform:scaleX(0);transform-origin:right}}
  @keyframes tv-img-after{0%{transform:scaleX(0);transform-origin:left}50%{transform:scaleX(1);transform-origin:left}51%{transform-origin:right}100%{transform:scaleX(0);transform-origin:right}}
  .tv-reveal{opacity:0;will-change:opacity,transform,filter}
  .tv-reveal.tv-in{animation:tv-fade-up .9s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="fade"].tv-in{animation:tv-fade-in 1s var(--tv-ease) both}
  .tv-reveal[data-anim="up"].tv-in{animation:tv-fade-up .9s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="left"].tv-in{animation:tv-fade-left .9s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="right"].tv-in{animation:tv-fade-right .9s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="zoom"].tv-in{animation:tv-zoom-in .9s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="blur"].tv-in{animation:tv-blur-in 1s var(--tv-ease-out-expo) both}
  .tv-reveal[data-anim="clip"]{opacity:1}
  .tv-reveal[data-anim="clip"].tv-in{animation:tv-clip-up 1.1s var(--tv-ease-out-expo) both}
  .tv-reveal[data-delay="1"].tv-in{animation-delay:.08s}
  .tv-reveal[data-delay="2"].tv-in{animation-delay:.16s}
  .tv-reveal[data-delay="3"].tv-in{animation-delay:.24s}
  .tv-reveal[data-delay="4"].tv-in{animation-delay:.32s}
  .tv-reveal[data-delay="5"].tv-in{animation-delay:.40s}
  .tv-reveal[data-delay="6"].tv-in{animation-delay:.48s}
  .tv-split{opacity:1}
  .tv-split .tv-word{display:inline-block;opacity:0;transform:translateY(.55em);filter:blur(6px)}
  .tv-split.tv-in .tv-word{animation:tv-blur-in .9s var(--tv-ease-out-expo) both;animation-delay:calc(var(--i,0)*60ms)}
  .tv-img-reveal{position:relative;overflow:hidden;isolation:isolate}
  .tv-img-reveal::before,.tv-img-reveal::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;transform-origin:left}
  .tv-img-reveal::before{background:#FBFAF7;transform:scaleX(1)}
  .tv-img-reveal::after{background:#1A4F3F;transform:scaleX(0)}
  .tv-img-reveal.tv-in::after{animation:tv-img-after 1.2s var(--tv-ease-in-out) both}
  .tv-img-reveal.tv-in::before{animation:tv-img-before 1.2s var(--tv-ease-in-out) both}
  .tv-img-reveal img{transform:scale(1.02);transition:transform 1.4s var(--tv-ease-out-expo)}
  .tv-img-reveal.tv-in img{animation:tv-kenburns 14s ease-out both}
  .hero-card.tv-img-reveal::before,.hero-card.tv-img-reveal::after,#heroPhotoWrap.tv-img-reveal::before,#heroPhotoWrap.tv-img-reveal::after{display:none}
  .tv-hover-lift{transition:transform .4s var(--tv-ease),box-shadow .4s var(--tv-ease)}
  .tv-hover-lift:hover{transform:translateY(-4px);box-shadow:0 18px 54px -22px rgba(14,31,26,.18)}
  .tv-hover-zoom{overflow:hidden;border-radius:6px}
  .tv-hover-zoom img{transition:transform .8s var(--tv-ease-out-expo)}
  .tv-hover-zoom:hover img{transform:scale(1.06)}
  .tv-underline-anim{background-image:linear-gradient(currentColor,currentColor);background-size:0 1.5px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .4s var(--tv-ease)}
  .tv-underline-anim:hover{background-size:100% 1.5px}
  .tv-btn-shine{position:relative;overflow:hidden;isolation:isolate}
  .tv-btn-shine::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);transform:translateX(-120%)}
  .tv-btn-shine:hover::after{animation:tv-shimmer 1.1s var(--tv-ease) forwards}
  .tv-scroll-progress{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#1A4F3F,#2D6855,#A88B4A);z-index:10001;pointer-events:none;transition:width .12s linear}
  nav.nav.tv-header-scrolled{background:rgba(251,250,247,.92)!important;backdrop-filter:saturate(140%) blur(12px);-webkit-backdrop-filter:saturate(140%) blur(12px);box-shadow:0 1px 0 rgba(14,31,26,.06),0 8px 24px -16px rgba(14,31,26,.08)}
  body.tv-loaded .tv-hero-anim{animation:tv-fade-up 1s var(--tv-ease-out-expo) both}
  body.tv-loaded .tv-hero-anim.d1{animation-delay:.12s}
  body.tv-loaded .tv-hero-anim.d2{animation-delay:.24s}
  body.tv-loaded .tv-hero-anim.d3{animation-delay:.36s}
  @media (prefers-reduced-motion:reduce){
    .tv-reveal,.tv-reveal.tv-in,.tv-hero-anim,.tv-split .tv-word,.tv-img-reveal::before,.tv-img-reveal::after{
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
    <a href="#" class="brand" id="navBrandWrap">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span class="brand-mark" id="navBrandMark">★</span>
      <span id="navBrandName">{{ $nombre }}</span>
    </a>
    <ul role="menu" id="boldNavList">
      <li><a href="#servicios" id="tplNavServicios" data-nav-link="servicios" style="display:none;">Servicios</a></li>
      <li><a href="#sobre-nosotros" data-nav-link="sobre-nosotros">Nosotros</a></li>
      <li><a href="#galeria" data-nav-link="galeria">Galería</a></li>
      <li><a href="#horario" data-nav-link="horario">Contacto</a></li>
      <li><a href="#opiniones" id="tplNavOpiniones" data-nav-link="opiniones" style="display:none;">Reseñas</a></li>
    </ul>
    <div class="nav-actions">
      <a href="https://wa.me/{{ $whatsapp }}" class="nav-cta" data-wa-link>Pedir cita →</a>
      <button type="button" id="navMenuToggle" class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="boldNavList">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero">
  <div class="container">
    <div class="hero-grid">
      <div>
        <div class="hero-meta">
          <span class="live" id="heroStatusPill"><span class="dot"></span><span id="heroStatusText">Comprobando…</span></span>
        </div>
        <h1 class="serif" id="heroTitle">{{ $nombre }}</h1>
        <p class="hero-tag" id="heroTagline">{{ $tagline }}</p>
        <div class="hero-cta">
          <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="btn-p" data-tel-link>Llamar ahora →</a>
          <a href="https://wa.me/{{ $whatsapp }}" class="btn-g" data-wa-link>WhatsApp</a>
        </div>
          </div>
      <div class="hero-card" id="heroPhotoWrap">
        <div class="hero-portrait" id="heroPortrait" role="img"></div>
        <img id="heroPhotoImg" src="" alt="" hidden style="display:none"/>
      </div>
    </div>
  </div>
</section>

<!-- TICKER -->
<div class="ticker" id="tplTicker" style="display:none;">
  <div class="ticker-track" id="tplTickerTrack"></div>
</div>
</div>

<!-- ═══════════════════ SERVICES ═══════════════════ -->
<section id="servicios" style="display:none;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow"><span class="rule"></span>Servicios</span>
        <h2 class="serif">Áreas de <em>especialización.</em></h2>
      </div>
      <p class="desc">Atendemos cada caso con la dedicación que merece.</p>
    </div>
    <div class="services-grid" id="tplServicesList">

@foreach($services as $service)
    <div class="service">
      <h3>{{ $service['name'] }}</h3>
      @if($service['description'])<p>{{ $service['description'] }}</p>@endif
      <div class="service-price">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ",", ".") }} €
        @else
        Consultar
        @endif
      </div>
    </div>
@endforeach
  </div>
  </div>
</section>

<!-- ═══════════════════ ABOUT ═══════════════════ -->
<section id="sobre-nosotros" class="trust-section">
  <div class="container">
    <div class="trust-grid">
      <div class="trust-img" id="trustImgDiv"></div>
      <div class="trust-content">
        <span class="eyebrow"><span class="rule"></span>Nuestra trayectoria</span>
        <h2 class="serif" id="aboutTitle">Tu negocio.</h2>
        <p id="aboutDescripcion">Descripción del negocio: quiénes sois, qué hacéis y por qué importa.</p>
          </div>
    </div>
  </div>
    @include('public.partials.about-extra-blocks-trust-clinic')
</section>

<!-- ═══════════════════ GALLERY ═══════════════════ -->
<section id="galeria" class="trust-gal-section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow"><span class="rule"></span>Instalaciones</span>
        <h2 class="serif">Nuestras <em>instalaciones.</em></h2>
      </div>
      <p class="desc">Espacios pensados para la comodidad de cada consulta.</p>
    </div>
    <div class="trust-gal-grid" id="galleryLive"></div>
  </div>
</section>

<!-- ═══════════════════ HOURS + CONTACT ═══════════════════ -->
<section id="horario">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow"><span class="rule"></span>Visítenos</span>
        <h2 class="serif">Horario y <em>localización.</em></h2>
      </div>
      <p class="desc" id="contactSub">Atendemos con cita previa. Llámenos para consultas urgentes.</p>
    </div>
    <div class="info-grid">
      <div class="info-card">
        <span class="schedule-status" id="statusPill">
          <span class="dot"></span>
          <span id="statusText">Comprobando…</span>
        </span>
        <h3 class="serif">Horario de consulta</h3>
        <div id="schedule"></div>
        </div>
      <div class="info-card">
        <a id="contacto" aria-hidden="true" style="display:block;height:0;overflow:hidden"></a>
        <span class="eyebrow"><span class="rule"></span>Contacto</span>
        <h3 class="serif">Habla con nosotros</h3>
        <div class="contact-list">
          <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span class="icon">☏</span><span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span></a>
          <a href="mailto:" id="contactEmailLink" hidden><span class="icon">@</span><span id="contactEmailDisplay"></span></a>
          <a href="https://wa.me/{{ $whatsapp }}" data-wa-link><span class="icon">W</span>WhatsApp</a>
          <a href="#" id="contactAddressRow" hidden><span class="icon">◉</span><span id="contactAddressText"></span></a>
      </div>
        </div>
      </div>
    </div>
  <div class="map-section @if(!is_numeric($map_lat) || !is_numeric($map_lon)) bold-map-empty @endif" id="mapSection">
    <div class="map-shell">
      <div id="mapLeafletContainer" class="map-leaflet" role="img" aria-label="Mapa del negocio"></div>
    </div>
    <div class="map-directions-row" id="mapDirectionsRow">
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn-p" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>
  </div>
  <section id="opiniones" class="reviews-cta-section">
    <span class="eyebrow"><span class="rule"></span>Reseñas verificadas</span>
    <h3 class="serif">Lo que dicen quienes nos eligen.</h3>
    <p>Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google.</p>
    <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn-p" target="_blank" rel="noopener noreferrer">Ver y escribir reseñas →</a>
  </section>
  <div class="vcard-strip" id="tplVcardWrap">
    <div>
      <strong>Guarda nuestro contacto.</strong>
      <small>Descarga la tarjeta y añádenos a tu agenda con un toque.</small>
    </div>
    <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn-p" download style="background:var(--accent)">Descargar vCard →</a>
  </div>
</section>

<!-- ═══════════════════ CTA ═══════════════════ -->
<section class="cta-strip">
  <div class="container">
    <div class="cta-inner">
      <div>
        <span class="eyebrow" style="color:#A8C9BC"><span class="rule" style="background:#A8C9BC"></span>Primera consulta</span>
        <h2 class="serif" id="ctaTitle">Pida cita ahora<br/>y le atenderemos <em>esta misma semana.</em></h2>
        <p></p>
      </div>
      <div class="cta-actions">
        <a href="https://wa.me/{{ $whatsapp }}" class="btn-p" data-wa-link>WhatsApp →</a>
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="btn-g" data-tel-link>Llamar</a>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer>
  <div class="container">
    <div class="foot">
      <div>
        <div class="foot-brand" id="footBrand">Tu<br/><span class="accent">negocio</span></div>
        <p id="footTagline">Tagline corto que describe lo que hacéis.</p>
      </div>
      <div>
        <h4>Despacho</h4>
        <ul>
          <li><a href="#servicios" id="footNavServicios" style="display:none;">Servicios</a></li>
          <li><a href="#sobre-nosotros">Nosotros</a></li>
          <li><a href="#galeria">Galería</a></li>
          <li><a href="#horario">Horario</a></li>
          <li><a href="#opiniones" id="footNavOpiniones" style="display:none;">Reseñas</a></li>
        </ul>
      </div>
      <div>
        <h4>Contacto</h4>
        <ul>
          <li><a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span></a></li>
          <li id="footEmailRow" hidden><a id="footEmailLink" href="#"><span id="footEmailDisplay"></span></a></li>
          <li><a href="https://wa.me/{{ $whatsapp }}" data-wa-link>WhatsApp</a></li>
          <li id="footAddressRow" hidden><a href="#" id="footAddressLink"><span id="footAddressText"></span></a></li>
        </ul>
      </div>
      <div>
        <h4>Síguenos</h4>
        <ul>
          <li><a href="#" href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li><a href="#" href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer">TikTok</a></li>
          <li><a href="#" href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank" rel="noopener noreferrer">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span id="footBottomBrand">© 2026 · Tu negocio</span>
      <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Web creada con <a href="https://onez.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
    </div>
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
  if (window.__LW_LEAFLET_LOADER_STARTED) return;
  window.__LW_LEAFLET_LOADER_STARTED = true;
  var s = document.createElement('script');
  s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  s.crossOrigin = '';
  s.onload = function () {
    if (typeof lwBootTenantMap === 'function') {
      lwBootTenantMap(window.__lwMapAddress || '');
    }
  };
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
(function initTrustPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1' || params.get('preview') === '1' || params.get('parentOrigin')) {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
    document.body.classList.add('trust-preview');
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

/** Clínica / salud — solo en vista previa (?embed=1 o ?preview=1). */
var TRUST_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1685022036259-04cf91a89af1?auto=format&fit=crop&w=1400&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1740410643780-883b33ee1b86?auto=format&fit=crop&w=1000&q=80',
};

function shouldUseTrustSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('trust-preview');
}

function trustResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseTrustSampleMedia()) return '';
  return TRUST_PREVIEW_SAMPLE[sampleKey] || '';
}

var BOLD_DEFAULT_GALLERY_INNER =
  '<div><img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?auto=format&fit=crop&w=1200&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1662997777051-f50b550bff53?auto=format&fit=crop&w=1200&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1685022036259-04cf91a89af1?auto=format&fit=crop&w=1200&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1744723856265-866d19b9cf1a?auto=format&fit=crop&w=1200&q=70" alt=""/></div>';

function renderBoldGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = BOLD_DEFAULT_GALLERY_INNER;
  } else {
    root.innerHTML = list
      .map(function (src) {
        return '<div><img src="' + escapeBoldGalleryAttr(src) + '" alt=""/></div>';
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
  return;
}

/* ───── HERO + ABOUT photo ───────────────────────────── */
function updateBoldHeroPhoto(raw) {
  var img = document.getElementById('heroPhotoImg');
  if (!img) return;
  var hasPortada = raw && Object.prototype.hasOwnProperty.call(raw, 'portada');
  if (!hasPortada) return;
  var src = (raw && raw.portada ? String(raw.portada).trim() : '');
  if (!src) {
    img.removeAttribute('src');
    img.hidden = true;
    img.style.display = 'none';
    return;
  }
  var withCacheBust = src;
  if (/^https?:\/\//i.test(src)) {
    var sep = src.indexOf('?') >= 0 ? '&' : '?';
    withCacheBust = src + sep + 'lwts=' + Date.now();
  }
  img.src = withCacheBust;
  img.hidden = false;
  img.style.display = 'block';
}

function updateBoldAboutPhoto(raw) {
  raw = raw || {};
  var hasFoto = Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseTrustSampleMedia()) return;
  var src = trustResolvePreviewPhotoSrc(raw.foto_equipo, 'foto_equipo');
  var trustImg = document.getElementById('trustImgDiv');
  if (trustImg) {
    trustImg.style.backgroundImage = src ? 'url("' + String(src).replace(/"/g, '\\"') + '")' : '';
    if (src && trustImg.classList.contains('tv-reveal') && !trustImg.classList.contains('tv-in')) {
      trustImg.classList.add('tv-in');
    }
  }
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
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    lat = window.__lwLat;
    lon = window.__lwLon;
  }
  var sec = document.getElementById('mapSection');
  var container = document.getElementById('mapLeafletContainer');
  if (!sec || !container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyBoldPreviewMap();
    sec.classList.add('bold-map-empty');
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  sec.classList.remove('bold-map-empty');
  if (typeof L === 'undefined') {
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(function () { updateBoldPreviewMap(lat, lon); });
    }
    return;
  }

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

function escapeTrustAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderTrustAboutExtras(sections) {
  var wrap = document.getElementById('aboutExtraBlocks');
  if (!wrap) return;
  wrap.className = 'trust-about-extras';
  var list = Array.isArray(sections) ? sections.filter(function (s) { return s != null; }) : [];
  if (list.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = list
    .map(function (sec, i) {
      var title = escapeHtmlTextBold(String(sec.title || '').trim());
      var desc = escapeHtmlTextBold(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mainTF = typeof lwIsMainAboutTextFirst === 'function' ? lwIsMainAboutTextFirst(wrap) : false;
      var textFirst = typeof lwAboutExtraTextFirst === 'function' ? lwAboutExtraTextFirst(i, mainTF) : i % 2 === 0;
      var mod = textFirst ? 'trust-about-extra--text-first' : 'trust-about-extra--photo-first';
      var bn = String(i + 3).padStart(2, '0');
      var bg = img ? ' style="background-image:url(\'' + escapeTrustAttr(img) + '\')"' : '';
      return (
        '<article class="trust-about-extra trust-grid ' +
        mod +
        '"><div class="trust-img trust-about-extra__photo' +
        (img ? ' has-photo' : '') +
        '"' +
        bg +
        '></div><div class="trust-content"><span class="eyebrow"><span class="rule"></span>Bloque ' +
        bn +
        '</span>' +
        (title ? '<h3 class="serif">' + title + '</h3>' : '') +
        (desc ? '<p>' + desc + '</p>' : '') +
        '</div></article>'
      );
    })
    .join('');
  if (typeof window.tvAnimationsRefresh === 'function') {
    requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
  } else if (typeof window.trustRevealAboutExtras === 'function') {
    window.trustRevealAboutExtras();
  } else if (typeof window.lwRefreshAboutExtrasReveal === 'function') {
    window.lwRefreshAboutExtrasReveal();
  }
}

window.lwRenderAboutExtrasImpl = renderTrustAboutExtras;

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
            '<article class="svc">' +
            '<span class="svc-num">/ ' + num + '</span>' +
            '<h3 class="serif">' + nm + '</h3>' +
            (dc ? '<p class="svc-body">' + escapeHtmlTextBold(String(s.description)) + '</p>' : '<p class="svc-body">&nbsp;</p>') +
            '<div class="svc-foot"><div class="svc-price serif">' + pr + '</div><span class="svc-link">Reservar →</span></div>' +
            '</article>'
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
        ? '<span class="time">' + d.open + ' \u2013 ' + d.close + '</span>'
        : '<span class="time closed">Cerrado</span>');
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
    heroPill.style.color = openToday ? 'var(--accent)' : '#999';
    var dot = heroPill.querySelector('.dot');
    if (dot) {
      dot.style.background = openToday ? 'var(--accent)' : '#999';
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
  if (aboutTitle) {
    var customAboutTitle = (raw && raw.about_title ? String(raw.about_title).trim() : '');
    if (raw && Object.prototype.hasOwnProperty.call(raw, 'about_title')) {
      aboutTitle.textContent = customAboutTitle || 'Sobre nosotros.';
    }
  }

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
    ctaTitle.innerHTML = 'Pida cita ahora<br/>y le atenderemos <em>esta misma semana.</em>';
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
  if (shouldUseTrustSampleMedia()) {
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
    requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
  }
}
</script>
<script src="/templates/lw-about-extras.js?v=2"></script>
<script>

/* ───── INIT FROM QUERY (fallback dev) ──────────────── */
(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (!params.has('preview')) {
    syncBoldScheduleFromPreview(null);
    renderBoldSchedule();
    renderBoldGallery([]);
    if (shouldUseTrustSampleMedia()) {
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


/* ─── TRUST-CLINIC: hero portrait + about photo ─── */
(function() {
  updateBoldHeroPhoto = function(raw) {
    var hasPortada = raw && Object.prototype.hasOwnProperty.call(raw, 'portada');
    if (!hasPortada && !shouldUseTrustSampleMedia()) return;
    var src = trustResolvePreviewPhotoSrc(raw && raw.portada, 'portada');
    var portrait = document.getElementById('heroPortrait');
    if (portrait) {
      portrait.style.backgroundImage = src ? 'url(' + src + ')' : '';
    }
  };
  /* updateBoldAboutPhoto ya actualiza #trustImgDiv en la definición principal */

  function bootTrustPreviewSamples() {
    if (!shouldUseTrustSampleMedia()) return;
    updateBoldHeroPhoto({ portada: '' });
    updateBoldAboutPhoto({ foto_equipo: '' });
    renderBoldGallery([]);
    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTrustPreviewSamples);
  } else {
    bootTrustPreviewSamples();
  }
})();

/* ─── NAV scroll shadow ─── */
(function(){
  var nav = document.querySelector('nav.nav');
  if (nav) window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, {passive:true});
})();
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
    imgEl.src=src;imgEl.alt=alt||'';lb.hidden=false;
    prevOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
  }
  function closeLb(){
    lb.hidden=true;imgEl.removeAttribute('src');imgEl.alt='';
    document.body.style.overflow=prevOverflow||'';
  }
  document.addEventListener('click',function(e){
    var sec=document.getElementById('galeria');
    if(!sec||!sec.contains(e.target))return;
    if(e.target.closest('#lw-gallery-lightbox'))return;
    var im=e.target.closest('img');
    if(im&&sec.contains(im)){
      e.preventDefault();e.stopPropagation();
      openLb(im.currentSrc||im.src,im.alt||'');
      return;
    }
    var tile=e.target.closest('[data-lightbox-src]');
    if(tile&&sec.contains(tile)){
      var u=tile.getAttribute('data-lightbox-src');
      if(u){e.preventDefault();openLb(u,'');}
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
/* TRUST-CLINIC animations — capa visual; no altera preview ni datos */
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
      span.textContent = w;
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
    document.querySelectorAll('section.tv-reveal, .tv-magnetic, .hero-card.tv-img-reveal, #heroPhotoWrap.tv-img-reveal, .hero-portrait.tv-img-reveal').forEach(function (el) {
      el.classList.remove('tv-reveal', 'tv-in', 'tv-img-reveal', 'tv-magnetic');
      el.removeAttribute('data-anim');
      el.removeAttribute('data-delay');
      if (el.style && el.style.transform) el.style.transform = '';
    });
  }

  function autoTag() {
    cleanupLegacyTvTags();

    document.querySelectorAll('.nav ul a:not(.nav-cta)').forEach(function (el) {
      if (!el.classList.contains('tv-underline-anim')) el.classList.add('tv-underline-anim');
    });

    document.querySelectorAll('.hero-meta .live, .hero-tag, .hero-cta a').forEach(function (el, i) {
      if (!el.classList.contains('tv-hero-anim')) {
        el.classList.add('tv-hero-anim', 'd' + Math.min(i + 1, 3));
      }
    });

    refreshHeroTitleSplit();

    var heroCard = document.getElementById('heroPhotoWrap');
    if (heroCard && !isHidden(heroCard)) markReveal(heroCard, 'right');

    document.querySelectorAll('.section-head').forEach(function (el) {
      markReveal(el, 'up');
    });
    document.querySelectorAll('.section-head h2').forEach(function (el) {
      markReveal(el, 'blur');
    });

    document.querySelectorAll('#tplServicesList .svc').forEach(function (el, i) {
      markReveal(el, 'up');
      el.classList.add('tv-hover-lift');
      el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
    });

    document.querySelectorAll('#galleryLive > div').forEach(function (el, i) {
      markReveal(el, 'zoom');
      el.classList.add('tv-hover-zoom');
      el.setAttribute('data-delay', String(Math.min(i + 1, 6)));
    });

    var trustImg = document.getElementById('trustImgDiv');
    if (trustImg && !isHidden(trustImg)) {
      markReveal(trustImg, 'clip');
      if (trustImg.style.backgroundImage && trustImg.style.backgroundImage !== 'none') {
        trustImg.classList.add('tv-in');
      }
    }

    document.querySelectorAll('.trust-content > .eyebrow, #aboutDescripcion').forEach(function (el) {
      markReveal(el, 'left');
    });
    var aboutTitle = document.getElementById('aboutTitle');
    if (aboutTitle) markReveal(aboutTitle, 'blur');

    document.querySelectorAll('#aboutExtraBlocks .trust-about-extra').forEach(function (block) {
      var textFirst = block.classList.contains('trust-about-extra--text-first');
      var body = block.querySelector('.trust-content');
      var photo = block.querySelector('.trust-about-extra__photo, .trust-img');
      if (body) markReveal(body, textFirst ? 'left' : 'right');
      if (photo) tagImgReveal(photo, textFirst ? 'clip' : 'clipR');
      block.querySelectorAll('.trust-content h3').forEach(function (el) {
        markReveal(el, 'blur');
      });
      block.querySelectorAll('.trust-content p, .trust-content .eyebrow').forEach(function (el) {
        markReveal(el, 'left');
      });
    });

    document.querySelectorAll('.info-card').forEach(function (el, i) {
      markReveal(el, i === 0 ? 'left' : 'right');
    });

    var reviewsSec = document.getElementById('opiniones');
    if (reviewsSec && reviewsSec.classList.contains('is-visible') && !isHidden(reviewsSec)) {
      markReveal(reviewsSec, 'fade');
    }

    var vcard = document.getElementById('tplVcardWrap');
    if (vcard && vcard.classList.contains('is-visible') && !isHidden(vcard)) markReveal(vcard, 'fade');

    document.querySelectorAll('.cta-inner').forEach(function (el) {
      markReveal(el, 'fade');
    });

    document.querySelectorAll('.nav-cta, .hero-cta .btn-p, .hero-cta .btn-g, .cta-actions .btn-p, .cta-actions .btn-g, .reviews-cta-section .btn-p').forEach(function (el) {
      if (!el.classList.contains('tv-btn-shine')) el.classList.add('tv-btn-shine');
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

  function forcePreviewAboutExtras() {
    if (!document.body.classList.contains('embed-preview') && !document.body.classList.contains('trust-preview')) {
      return;
    }
    var root = document.getElementById('aboutExtraBlocks');
    if (!root) return;
    root.querySelectorAll('.tv-reveal:not(.tv-in), .tv-split:not(.tv-in)').forEach(function (el) {
      el.classList.add('tv-in');
    });
  }

  window.trustRevealAboutExtras = function () {
    forcePreviewAboutExtras();
    revealInViewport();
    observe();
  };

  function runRevealPass() {
    revealInViewport();
    observe();
    forcePreviewAboutExtras();
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
      if (window.scrollY > 12) nav.classList.add('tv-header-scrolled');
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

  function boot() {
    if (booted) return;
    booted = true;
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
(function bootTrustClinicTenantPage() {
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
        about_title: @json($about_title),
        about_sections: @json($about_sections),
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
    if (typeof updateBoldTicker === 'function') updateBoldTicker({
      nombre: @json($nombre),
      tagline: @json($tagline),
      direccion: @json($direccion)
    });
    if (typeof syncBoldScheduleFromPreview === 'function') syncBoldScheduleFromPreview(@json($horario));
    if (typeof renderBoldSchedule === 'function') renderBoldSchedule();
    if (typeof window.__lwLat === 'number' && typeof window.__lwLon === 'number') {
      if (typeof updateBoldPreviewMap === 'function') updateBoldPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateNoirPreviewMap === 'function') updateNoirPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateSleekPreviewMap === 'function') updateSleekPreviewMap(window.__lwLat, window.__lwLon);
      else if (typeof updateBloomPreviewMap === 'function') updateBloomPreviewMap(window.__lwLat, window.__lwLon);
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
