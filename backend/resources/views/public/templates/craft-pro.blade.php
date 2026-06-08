@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
    --bg:#FFFFFF; --bg-2:#F4F4F2; --bg-3:#E8E8E5;
    --ink:#0F1114; --ink-2:#3A3D43; --ink-3:#7A7D84;
    --line:#D8D8D4; --line-2:#BFBFBA;
    --orange:#FF5C00;
    --orange-2:color-mix(in srgb, var(--orange) 88%, #000000);
    --orange-soft:color-mix(in srgb, var(--orange) 10%, #ffffff);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:"Inter",system-ui,sans-serif;font-size:15.5px;line-height:1.55;-webkit-font-smoothing:antialiased}
  section[id],a[id]{scroll-margin-top:80px}
  ::selection{background:var(--orange);color:#fff}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;cursor:pointer;border:none;background:none}
  img{display:block;max-width:100%}
  .cond{font-family:"Barlow Condensed",Impact,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.005em}
  .container{max-width:1280px;margin:0 auto;padding:0 46px}
  .eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:"Inter";font-size:11.5px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.14em}
  .eyebrow::before{content:"";width:24px;height:2px;background:var(--orange)}

  /* NAV */
  .nav{position:sticky;top:0;z-index:9000;background:var(--ink);color:#fff;border-bottom:3px solid var(--orange)}
  .nav-inner{max-width:1280px;margin:0 auto;padding:14px 46px;display:flex;justify-content:space-between;align-items:center;gap:20px}
  .brand{display:flex;align-items:center;gap:14px}
  .brand-mark{width:48px;height:48px;background:var(--orange);color:#fff;display:grid;place-items:center;font-family:"Barlow Condensed",sans-serif;font-size:24px;font-weight:800;letter-spacing:-.01em;flex-shrink:0;clip-path:polygon(0 0,100% 0,100% 78%,82% 100%,0 100%)}
  .brand-name{display:flex;flex-direction:column;line-height:1.1}
  .brand-name strong{font-family:"Barlow Condensed",sans-serif;font-size:24px;color:#fff;font-weight:700;letter-spacing:.005em;text-transform:uppercase}
  .brand-name small{font-size:11px;color:#9A9D9F;text-transform:uppercase;letter-spacing:.12em;font-weight:500;margin-top:1px}
  #navBrandName{font-family:"Barlow Condensed",sans-serif;font-size:24px;color:#fff;font-weight:700;letter-spacing:.005em;text-transform:uppercase}
  .nav{--lw-logo-scale:1}
  .nav .brand.brand-has-img .nav-brand-img{display:block;height:calc(50px * var(--lw-logo-scale,1));width:auto;max-width:calc(260px * var(--lw-logo-scale,1));object-fit:contain;image-rendering:auto}
  .nav .brand.brand-has-img .brand-mark{display:none !important}
  .nav .brand.brand-has-img #navBrandName{display:none !important}
  .nav ul{list-style:none;display:flex;gap:46px;align-items:center}
  .nav ul a{font-family:"Barlow Condensed",sans-serif;font-size:16px;color:#D8D8D4;font-weight:600;text-transform:uppercase;letter-spacing:.04em;padding:6px 0;position:relative;transition:color .15s}
  .nav ul a:hover{color:#fff}
  .nav ul a:hover::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--orange)}
  .nav ul a.is-active{color:var(--orange)}
  .nav ul a.is-active::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--orange)}
  .nav-cta{display:inline-flex;align-items:center;gap:10px;padding:11px 22px;background:var(--orange);color:#fff;font-family:"Inter";font-size:14px;font-weight:700;letter-spacing:.005em;transition:background .15s}
  .nav-cta:hover{background:var(--orange-hover, var(--orange-2))}
  .nav-actions{display:flex;align-items:center;gap:14px}
  .menu-toggle{display:none;width:44px;height:44px;background:transparent;border:1.5px solid #fff;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0}
  .menu-toggle span{display:block;width:20px;height:2px;background:#fff;transition:.25s}
  .nav.is-open .menu-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}
  .nav.is-open .menu-toggle span:nth-child(2){opacity:0}
  .nav.is-open .menu-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

  /* HERO */
  .hero{padding:0;position:relative;overflow:hidden;background:var(--bg)}
  .hero-grid{max-width:1280px;margin:0 auto;padding:0 46px;display:grid;grid-template-columns:1.1fr 1fr;gap:0;align-items:stretch;min-height:78vh}
  .hero-text{padding:80px 60px 80px 0;display:flex;flex-direction:column;justify-content:center}
  .hero-badge{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;background:var(--ink);color:#fff;font-family:"Barlow Condensed";font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;width:fit-content;margin-bottom:46px}
  .hero-badge::before{content:"";width:6px;height:6px;background:var(--orange);border-radius:50%}
  .hero-meta{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .hero-meta .live{display:inline-flex;align-items:center;gap:8px;color:var(--orange);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
  .hero-meta .live .dot{width:8px;height:8px;background:var(--orange);border-radius:50%;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .hero h1{font-family:"Barlow Condensed",sans-serif;font-size:clamp(56px,8vw,124px);font-weight:800;line-height:.92;letter-spacing:-.005em;text-transform:uppercase;color:var(--ink);margin-bottom:24px}
  .hero h1 span{color:var(--orange)}
  .hero-tag{font-size:18px;line-height:1.6;color:var(--ink-2);max-width:520px;margin-bottom:50px;font-weight:400}
  .hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:48px}
  .btn-p{display:inline-flex;align-items:center;gap:12px;padding:18px 46px;background:var(--orange);color:#fff;font-family:"Barlow Condensed";font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;transition:background .15s;border:2px solid var(--orange)}
  .btn-p:hover{background:var(--orange-hover, var(--orange-2));border-color:var(--orange-hover, var(--orange-2))}
  .btn-g{display:inline-flex;align-items:center;gap:10px;padding:18px 28px;background:transparent;color:var(--ink);font-family:"Barlow Condensed";font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border:2px solid var(--ink);transition:background .15s,color .15s}
  .btn-g:hover{background:var(--ink);color:#fff}
  .hero-photo{position:relative;background:var(--ink);min-height:560px;overflow:hidden}
  .hero-photo img{width:100%;height:100%;object-fit:cover}
  .hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(15,17,20,.4) 0%,transparent 50%,color-mix(in srgb, var(--orange) 15%, transparent) 100%);pointer-events:none}

  /* TICKER */
  .ticker{background:var(--ink);color:#fff;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.08);padding:18px 0}
  .ticker-track{display:flex;gap:48px;font-family:"Barlow Condensed";font-size:18px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;animation:scroll 40s linear infinite}
  .ticker-track span{display:inline-flex;align-items:center;gap:14px}
  .ticker .star{color:var(--orange);font-size:10px}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* SECTIONS */
  section{padding:120px 0}
  .section-head{max-width:1280px;margin:0 auto;padding:0 46px;display:grid;grid-template-columns:1fr 1.4fr;gap:60px;align-items:end;margin-bottom:72px;padding-bottom:46px;border-bottom:2px solid var(--ink)}
  .section-head h2{font-family:"Barlow Condensed",sans-serif;font-size:clamp(48px,6vw,88px);font-weight:800;line-height:.92;letter-spacing:-.005em;text-transform:uppercase;margin-top:14px}
  .section-head h2 span{color:var(--orange)}
  .section-head .desc{font-size:16px;color:var(--ink-2);line-height:1.65;max-width:520px;padding-bottom:8px}

  /* SERVICES (craft-pro original) */
  .services-grid{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid var(--ink);background:var(--ink)}
  .svc{padding:50px 46px 46px;background:var(--bg);border-right:1px solid var(--line);position:relative;transition:background .2s,color .2s;display:flex;flex-direction:column}
  .svc:nth-child(3n){border-right:none}
  .svc:nth-child(n+4){border-top:1px solid var(--line)}
  .svc:hover{background:var(--ink);color:#fff}
  .svc-num{font-family:"Barlow Condensed";font-size:64px;font-weight:800;line-height:1;letter-spacing:-.01em;color:var(--bg-3);margin-bottom:24px;transition:color .2s}
  .svc:hover .svc-num{color:var(--orange)}
  .svc h3{font-family:"Barlow Condensed";font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:.005em;line-height:1.1;margin-bottom:14px}
  .svc-body{font-size:14.5px;line-height:1.6;color:var(--ink-2);margin-bottom:24px;flex:1;transition:color .2s}
  .svc:hover .svc-body{color:#C8C8C5}
  .svc-foot{display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid var(--line);margin-top:auto;transition:border-color .2s}
  .svc:hover .svc-foot{border-color:rgba(255,255,255,.15)}
  .svc-price{font-family:"Barlow Condensed";font-size:24px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.01em}
  .svc-price small{font-size:13px;color:var(--ink-3);font-family:"Inter";font-weight:500;text-transform:none;letter-spacing:0;margin-left:4px}
  .svc:hover .svc-price small{color:#9A9D9F}
  .svc-link{font-family:"Barlow Condensed";font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:inherit;display:inline-flex;align-items:center;gap:8px;transition:gap .2s}
  .svc:hover .svc-link{gap:12px;color:var(--orange)}

  /* ABOUT */
  .about{background:var(--ink);color:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .about-grid{max-width:1280px;margin:0 auto;padding:0 46px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
  .about-img{aspect-ratio:4/5;background:#1a1a1a;overflow:hidden;position:relative}
  .about-img img{width:100%;height:100%;object-fit:cover}
  .about h2{font-family:"Barlow Condensed";font-size:clamp(54px,6vw,72px);font-weight:800;line-height:.92;text-transform:uppercase;letter-spacing:-.005em;margin-bottom:24px;margin-top:14px}
  .about h2 span{color:var(--orange)}
  .about p{font-size:16px;line-height:1.7;color:#B0B0B0;margin-bottom:16px;max-width:480px}
  .craft-about-stack{max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(64px,8vw,88px)}
  .craft-about-extras{display:flex;flex-direction:column;gap:clamp(64px,8vw,88px);padding:0 46px;border-top:1px solid rgba(255,255,255,.12);padding-top:clamp(48px,6vw,72px)}
  .craft-about-extra{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
  .craft-about-extra--text-first .craft-about-extra__copy{order:1}
  .craft-about-extra--text-first .craft-about-extra__figure{order:2}
  .craft-about-extra--photo-first .craft-about-extra__figure{order:1}
  .craft-about-extra--photo-first .craft-about-extra__copy{order:2}
  .craft-about-extra__title{font-family:"Barlow Condensed";font-size:clamp(40px,5vw,56px);font-weight:800;line-height:.92;text-transform:uppercase;letter-spacing:-.005em;margin:14px 0 20px;color:#fff}
  .craft-about-extra__desc{font-size:16px;line-height:1.7;color:#B0B0B0;margin:0;max-width:480px}
  .craft-about-extra__img{aspect-ratio:4/5;background:#1a1a1a;overflow:hidden;position:relative;margin:0}
  .craft-about-extra__img img{width:100%;height:100%;object-fit:cover}
  .craft-about-extra__ph{position:absolute;inset:0;display:grid;place-items:center;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#666}
  .craft-about-extra__img.has-photo .craft-about-extra__ph{display:none}

  /* GALLERY (craft-pro original) */
  .craft-gal-section{padding:80px 0;border-top:1px solid var(--line);background:var(--bg-2)}
  .gallery{max-width:1280px;margin:0 auto;padding:0 46px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .gallery-item{overflow:hidden;border-radius:8px;border:1px solid var(--line);cursor:pointer;background:#eee}
  .gallery-item img{width:100%;height:min(254px,32vw);object-fit:cover;cursor:zoom-in;transition:transform .3s}
  .gallery-item:hover img{transform:scale(1.03)}
  .gallery-item.tall{grid-row:span 2}
  .gallery-item.tall img{height:100%}
  .gallery-item.wide{grid-column:span 2}

  /* HOURS / CONTACT (craft-pro original) */
  .info-grid{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid var(--ink)}
  .info-card{background:var(--bg);padding:48px 54px;border-right:1px solid var(--ink)}
  .info-card:last-child{border-right:none;background:var(--bg-2)}
  .info-card h3{font-family:"Barlow Condensed";font-size:46px;font-weight:800;text-transform:uppercase;letter-spacing:.005em;line-height:1.1;margin:14px 0 24px}
  .schedule-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;padding:14px 0;border-bottom:1px dashed var(--line);font-size:15px}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row .day{font-family:"Barlow Condensed";font-size:17px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink);min-width:120px}
  .schedule-row .dots{border-bottom:1.5px dotted var(--line-2);transform:translateY(-4px);height:1px}
  .schedule-row .time{font-family:"Barlow Condensed";font-size:17px;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums}
  .schedule-row.today{background:var(--orange);margin:0 -16px;padding:14px 16px;border-bottom:1px dashed transparent}
  .schedule-row.today .day,.schedule-row.today .time{color:#fff}
  .schedule-row.today .dots{border-color:rgba(255,255,255,.4)}
  .schedule-status{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:var(--ink);color:var(--orange);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px}
  .schedule-status .dot{width:7px;height:7px;border-radius:50%;background:var(--orange)}
  .schedule-status.open .dot{animation:statusPulse 2.4s infinite}
  .schedule-status.closed{background:var(--ink-3);color:#fff}
  .schedule-status.closed .dot{background:#fff;animation:none}
  @keyframes statusPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--orange) 60%, transparent)}70%{box-shadow:0 0 0 8px color-mix(in srgb, var(--orange) 0%, transparent)}100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--orange) 0%, transparent)}}
  .contact-list{display:flex;flex-direction:column;gap:0}
  .contact-list a{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--line);font-size:15px;font-weight:500;transition:padding .15s}
  .contact-list a:last-child{border-bottom:none}
  .contact-list a:hover{padding-left:6px}
  .contact-list .icon{width:46px;height:46px;background:var(--ink);color:var(--orange);display:grid;place-items:center;font-size:14px;flex-shrink:0;clip-path:polygon(0 0,100% 0,100% 78%,82% 100%,0 100%)}

  /* MAP */
  .map-section{max-width:1280px;margin:0 auto;padding:0;border:2px solid var(--ink);border-top:none}
  .map-section.bold-map-empty{display:none}
  .map-shell{position:relative;background:var(--ink)}
  .map-leaflet{height:min(354px,50vh);min-height:220px;width:100%;background:var(--ink)}
  .map-shell .leaflet-container{font-family:"Inter";background:var(--ink)}
  .map-shell .leaflet-control-zoom a{display:flex;align-items:center;justify-content:center;width:50px;height:50px;padding:0;line-height:1;font-size:22px;text-align:center;text-decoration:none;background:var(--ink);color:var(--orange);border:2px solid var(--orange);border-radius:0!important;font-weight:700}
  .map-shell .leaflet-control-zoom a:hover{background:var(--orange);color:#fff}
  .map-shell .leaflet-bar{border:none;box-shadow:none}
  .map-shell .leaflet-control-attribution{background:var(--ink)!important;color:#666!important;font-size:10px!important}
  .map-shell .leaflet-control-attribution a{color:var(--orange)!important}
  .bold-leaflet-divicon{background:transparent!important;border:none!important}
  .bold-map-pin-wrap{position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;pointer-events:none}
  .bold-map-core{width:12px;height:12px;background:var(--orange);border:3px solid var(--ink);box-shadow:0 0 0 1px var(--orange),0 4px 12px rgba(0,0,0,.5);position:relative;z-index:2}
  .bold-map-radar-ring{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border:2px solid var(--orange);box-shadow:0 0 10px color-mix(in srgb, var(--orange) 25%, transparent);transform-origin:center center;animation:boldMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;pointer-events:none}
  .bold-map-radar-ring.d2{animation-delay:1.25s}
  @keyframes boldMapRadar{0%{transform:scale(0.4);opacity:.95}65%{opacity:.2}100%{transform:scale(2.15);opacity:0}}
  .map-directions-row{display:none;justify-content:flex-start;align-items:center;padding:20px 46px;border-top:2px solid var(--ink);background:var(--bg)}
  .map-directions-row.is-visible{display:flex}

  /* REVIEWS CTA */
  .reviews-cta-section{max-width:1280px;margin:0 auto;background:var(--bg-2);border:2px solid var(--ink);border-top:none;padding:54px 46px;display:none;flex-direction:column;gap:14px;align-items:flex-start}
  .reviews-cta-section.is-visible{display:flex}
  .reviews-cta-section h3{font-family:"Barlow Condensed";font-size:46px;font-weight:700;line-height:.95;text-transform:uppercase;letter-spacing:-.01em}
  .reviews-cta-section p{font-size:14px;line-height:1.55;color:var(--ink-2);max-width:520px}

  /* VCARD */
  .vcard-strip{max-width:1280px;margin:0 auto;background:var(--ink);color:var(--orange);border:2px solid var(--ink);border-top:none;padding:28px 46px;display:none;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .vcard-strip.is-visible{display:flex}
  .vcard-strip strong{font-family:"Barlow Condensed";font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:-.01em}
  .vcard-strip small{font-size:11px;color:#888;display:block;margin-top:4px;letter-spacing:.02em}

  /* CTA (craft-pro original with diagonal hatching) */
  .cta-section{background:var(--orange);color:#fff;padding:96px 0;position:relative;overflow:hidden}
  .cta-section::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent 0,transparent 60px,rgba(0,0,0,.03) 60px,rgba(0,0,0,.03) 61px);pointer-events:none}
  .cta-inner{max-width:1280px;margin:0 auto;padding:0 46px;text-align:center;position:relative}
  .cta-section h2{font-family:"Barlow Condensed";font-size:clamp(48px,6vw,96px);font-weight:800;line-height:.92;letter-spacing:-.005em;text-transform:uppercase;margin-bottom:50px}
  .cta-btn{display:inline-flex;align-items:center;gap:12px;padding:22px 50px;background:#fff;color:var(--ink);font-family:"Barlow Condensed";font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;transition:background .15s,color .15s}
  .cta-btn:hover{background:var(--ink);color:#fff}

  /* FOOTER (craft-pro original) */
  footer{background:var(--ink);color:#9A9D9F;padding:80px 0 46px;border-top:4px solid var(--orange)}
  .foot{max-width:1280px;margin:0 auto;padding:0 46px;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,.1)}
  .foot-brand{font-family:"Barlow Condensed";font-size:28px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.005em;line-height:1.1}
  .foot-brand .accent{color:var(--orange)}
  .foot p{font-size:14px;line-height:1.65;color:#9A9D9F;max-width:354px;margin-top:12px}
  .foot h4{font-family:"Barlow Condensed";font-size:15px;font-weight:700;color:#fff;margin-bottom:18px;letter-spacing:.08em;text-transform:uppercase}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:11px}
  .foot ul a{font-size:14px;color:#9A9D9F;transition:color .15s}
  .foot ul a:hover{color:var(--orange)}
  .foot-bottom{max-width:1280px;margin:0 auto;padding:24px 46px 0;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:#666870;flex-wrap:wrap;gap:10px}
  .foot-bottom a{color:var(--orange)}

  /* EMBED */
  html.embed-preview-root{scroll-behavior:auto!important}
  body.embed-preview .info-grid{scroll-margin-top:80px}

  /* RESPONSIVE */
  @media (max-width:1080px){
    .hero-grid{grid-template-columns:1fr}
    .hero-text{padding:64px 0 48px}
    .hero-photo{min-height:480px}
    .services-grid{grid-template-columns:1fr 1fr}
    .svc:nth-child(3n){border-right:1px solid var(--line)}
    .svc:nth-child(2n){border-right:none}
    .svc:nth-child(n+3){border-top:1px solid var(--line)}
    .info-grid{grid-template-columns:1fr}
    .info-card{border-right:none;border-bottom:1px solid var(--ink)}
    .info-card:last-child{border-bottom:none}
    .about-grid{grid-template-columns:1fr;gap:50px}
    .craft-about-extra{grid-template-columns:1fr;gap:50px}
    .craft-about-extra__figure{order:-1!important}
    .foot{grid-template-columns:1fr 1fr;gap:46px}
    .section-head{grid-template-columns:1fr;gap:24px}
  }
  @media (max-width:680px){
    .container{padding:0 20px}
    .nav-inner{padding:12px 20px;gap:12px}
    .nav ul,.nav-cta{display:none}
    .menu-toggle{display:flex}
    .brand-mark{width:42px;height:42px;font-size:20px}
    #navBrandName{font-size:20px}
    .hero-grid{padding:0 20px}
    .hero-text{padding:48px 0 54px}
    .hero-photo{min-height:380px}
    section{padding:64px 0}
    .section-head{margin-bottom:54px;padding-bottom:20px;padding-left:20px;padding-right:20px}
    .services-grid{grid-template-columns:1fr}
    .svc{border-right:none!important}
    .svc:not(:first-child){border-top:1px solid var(--line)}
    .about-grid{padding:0 20px}
    .craft-about-extras{padding:0 20px}
    .gallery{grid-template-columns:1fr;padding:0 20px}
    .gallery-item img{height:auto}
    .info-card{padding:46px 24px}
    .schedule-row.today{margin:0 -10px;padding:14px 10px}
    .cta-section{padding:64px 0}
    .cta-inner{padding:0 20px}
    .foot{padding:0 20px;grid-template-columns:1fr;gap:46px}
    .foot-bottom{flex-direction:column;text-align:center;gap:8px;padding:24px 20px 0}
    .vcard-strip,.reviews-cta-section,.map-directions-row{padding-left:20px;padding-right:20px}
    .nav.is-open ul{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;background:var(--ink);border-top:2px solid var(--orange);padding:8px 20px 16px;z-index:100;box-shadow:0 14px 24px rgba(0,0,0,.35)}
    .nav.is-open ul li{border-bottom:1px solid rgba(255,255,255,.06)}
    .nav.is-open ul li:last-child{border-bottom:none}
    .nav.is-open ul a{display:block;padding:14px 4px;font-size:18px;color:#fff}
  }
  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
    html{scroll-behavior:auto!important}
    [data-anim]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}
  }

  /* ============================================================
     CRAFTO-STYLE ANIMATIONS (añadido — no altera funcionalidad)
     ============================================================ */
  @media (prefers-reduced-motion: no-preference){
    [data-anim]{
      opacity:0;
      will-change:transform,opacity,filter;
      transition:
        opacity .9s cubic-bezier(.22,.61,.36,1),
        transform 1s cubic-bezier(.22,.61,.36,1),
        filter .9s cubic-bezier(.22,.61,.36,1);
      transition-delay:var(--anim-d,0ms);
    }
    [data-anim="fade-in"]{transform:none}
    [data-anim="fade-in-up"]{transform:translate3d(0,46px,0)}
    [data-anim="fade-in-down"]{transform:translate3d(0,-46px,0)}
    [data-anim="fade-in-left"]{transform:translate3d(-56px,0,0)}
    [data-anim="fade-in-right"]{transform:translate3d(56px,0,0)}
    [data-anim="zoom-in"]{transform:scale(.92)}
    [data-anim="zoom-out"]{transform:scale(1.08)}
    [data-anim="rise"]{transform:translate3d(0,70px,0);filter:blur(6px)}
    [data-anim="reveal-mask"]{
      clip-path:inset(0 100% 0 0);
      opacity:1;
      transition:clip-path 1.1s cubic-bezier(.77,0,.18,1);
    }
    [data-anim].in-view{
      opacity:1;
      transform:none;
      filter:none;
      clip-path:inset(0 0 0 0);
    }
    .svc,.gallery-item,.info-card{transition:background .2s,color .2s,transform .45s cubic-bezier(.22,.61,.36,1),box-shadow .45s cubic-bezier(.22,.61,.36,1)}
    .svc:hover,.info-card:hover{transform:translateY(-6px)}
    .gallery-item{transition:transform .5s cubic-bezier(.22,.61,.36,1),box-shadow .5s cubic-bezier(.22,.61,.36,1),border-color .3s}
    .gallery-item:hover{transform:translateY(-4px);box-shadow:0 18px 54px -18px rgba(15,17,20,.35)}
    .nav ul a::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--orange);transform:scaleX(0);transform-origin:right center;transition:transform .35s cubic-bezier(.22,.61,.36,1)}
    .nav ul a:hover::after,.nav ul a.is-active::after{transform:scaleX(1);transform-origin:left center}
    .btn-p,.btn-g,.nav-cta,.cta-btn{position:relative;overflow:hidden;isolation:isolate}
    .btn-p::before,.btn-g::before,.nav-cta::before,.cta-btn::before{
      content:"";position:absolute;inset:0;z-index:-1;
      background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%);
      transform:translateX(-110%);transition:transform .7s cubic-bezier(.22,.61,.36,1);
    }
    .btn-p:hover::before,.btn-g:hover::before,.nav-cta:hover::before,.cta-btn:hover::before{transform:translateX(110%)}
    .hero-photo img{transition:transform 1.4s cubic-bezier(.22,.61,.36,1)}
    .hero.in-view-hero .hero-photo img{transform:scale(1.04)}
    .section-head{position:relative}
    .section-head::after{
      content:"";position:absolute;left:46px;right:46px;bottom:-2px;height:2px;background:var(--orange);
      transform:scaleX(0);transform-origin:left center;
      transition:transform 1s cubic-bezier(.77,0,.18,1) .15s;
    }
    .section-head.in-view::after{transform:scaleX(1)}
  }

  /* LIGHTBOX */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;font-family:system-ui,sans-serif}
  @media (max-width:654px){.lw-gallery-lightbox-close{top:8px;right:8px}}
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')

<!-- NAV -->
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
      <li><a href="#horario" data-nav-link="horario">Horario</a></li>
      <li><a href="#contacto" data-nav-link="contacto">Contacto</a></li>
      <li><a href="#opiniones" id="tplNavOpiniones" data-nav-link="opiniones" style="display:none;">Opiniones</a></li>
    </ul>
    <div class="nav-actions">
      <a href="https://wa.me/{{ $whatsapp }}" class="nav-cta" data-wa-link>Presupuesto gratis →</a>
      <button type="button" id="navMenuToggle" class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="boldNavList">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
    <div class="hero-grid">
      <div class="hero-text">
      <div class="hero-meta">
        <span class="live" id="heroStatusPill"><span class="dot"></span><span id="heroStatusText">Comprobando…</span></span>
      </div>
      <h1 class="cond" id="heroTitle">{{ $nombre }}</h1>
      <p class="hero-tag" id="heroTagline">{{ $tagline }}</p>
        <div class="hero-cta">
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="btn-p" data-tel-link>Llamar ahora</a>
        <a href="https://wa.me/{{ $whatsapp }}" class="btn-g" data-wa-link>WhatsApp</a>
        </div>
          </div>
    <div class="hero-photo" id="heroPhotoWrap">
      <img id="heroPhotoImg" src="" alt="" hidden style="display:none"/>
    </div>
  </div>
</section>

<!-- TICKER -->
<div class="ticker" id="tplTicker" style="display:none;">
  <div class="ticker-track" id="tplTickerTrack"></div>
</div>
</div>

<!-- SERVICES -->
<section id="servicios" style="display:none;">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Lo que hacemos</span>
        <h2 class="cond">Servicios <span>profesionales</span></h2>
      </div>
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

<!-- ABOUT -->
<section id="sobre-nosotros" class="about">
  <div class="craft-about-stack">
    <div class="about-grid">
      <div class="about-img" id="aboutPhotoWrap">
        @if($foto_equipo)
        <img id="aboutPhotoImg" src="{{ $foto_equipo }}" alt="{{ $nombre }}" decoding="async"/>
        @else
        <img id="aboutPhotoImg" src="" alt="" hidden style="display:none"/>
        @endif
      </div>
      <div>
        <span class="eyebrow">Sobre nosotros</span>
        <h2 class="cond" id="aboutTitle">{{ filled($about_title) ? $about_title : 'Sobre nosotros.' }}</h2>
        <p id="aboutDescripcion">{{ $descripcion }}</p>
      </div>
    </div>
    @include('public.partials.about-extra-blocks-craft-pro')
</div>
</section>

<!-- GALLERY -->
<section id="galeria" class="craft-gal-section">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Galería</span>
        <h2 class="cond">Trabajos en<br/><span>imágenes.</span></h2>
      </div>
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
@endforelse
  </div>
  </div>
</section>

<!-- HOURS + CONTACT -->
<section id="horario">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="eyebrow">Zona y disponibilidad</span>
        <h2 class="cond">Dónde llegamos<br/><span>y cuándo.</span></h2>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-card">
        <span class="schedule-status" id="statusPill">
          <span class="dot"></span>
          <span id="statusText">Comprobando…</span>
        </span>
        <h3 class="cond">Cuándo trabajamos</h3>
        <div id="schedule"></div>
      </div>
      <div class="info-card">
        <a id="contacto" aria-hidden="true" style="display:block;height:0;overflow:hidden"></a>
        <span class="eyebrow">Contacto</span>
        <h3 class="cond">Habla con nosotros</h3>
        <div class="contact-list">
          <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span class="icon">☏</span><span data-phone-display>{{ $telefono ?: 'Tu teléfono' }}</span></a>
          <a href="mailto:" id="contactEmailLink" hidden><span class="icon">@</span><span id="contactEmailDisplay"></span></a>
          <a href="https://wa.me/{{ $whatsapp }}" data-wa-link><span class="icon">W</span>WhatsApp · respondemos rápido</a>
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
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn-g" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
      </div>
          </div>
  <section id="opiniones" class="reviews-cta-section">
    <span class="eyebrow">Lo que dicen los vecinos</span>
    <h3>Lo que dicen<br/>quienes nos eligen.</h3>
    <p>Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google: ayuda a otros a descubrirnos.</p>
    <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn-p" target="_blank" rel="noopener noreferrer" style="background:var(--ink);color:var(--orange);border-color:var(--ink)">Ver y escribir reseñas →</a>
  </section>
  <div class="vcard-strip" id="tplVcardWrap">
          <div>
      <strong>Guarda nuestro contacto.</strong>
      <small>Descarga la tarjeta y añádenos a tu agenda con un toque.</small>
          </div>
    <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn-p" download style="border-color:var(--orange)">Descargar vCard →</a>
          </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-inner">
    <h2 id="ctaTitle" class="cond">¿Tienes un trabajo<br/>en mente?</h2>
    <a href="https://wa.me/{{ $whatsapp }}" class="cta-btn" data-wa-link>Reservar por WhatsApp →</a>
  </div>
</section>

<!-- FOOTER -->
<footer>
    <div class="foot">
    <div>
      <div class="foot-brand" id="footBrand">Tu<br/><span class="accent">negocio</span></div>
      <p id="footTagline">Tagline corto que describe lo que hacéis.</p>
      </div>
      <div>
      <h4>Visitar</h4>
      <ul>
        <li><a href="#servicios" id="footNavServicios" style="display:none;">Servicios</a></li>
        <li><a href="#sobre-nosotros">Nosotros</a></li>
        <li><a href="#galeria">Galería</a></li>
        <li><a href="#horario">Horario</a></li>
        <li><a href="#opiniones" id="footNavOpiniones" style="display:none;">Opiniones</a></li>
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
    <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://onez.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
  </div>
</footer>
@endsection

@push('body-end')
<script src="/templates/lw-about-extras.js?v=2"></script>
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
(function initBoldPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  /** Vista previa del onboarding (panel o pantalla completa con ?preview=1). */
  if (params.get('preview') === '1') {
    document.body.classList.add('bold-preview');
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

/** Fotos de muestra (comida rápida) en vista previa (?embed=1 o ?preview=1) si el usuario aún no subió imágenes. */
var BOLD_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=1400&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
};

function shouldUseBoldSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('bold-preview');
}

function boldResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseBoldSampleMedia()) return '';
  return BOLD_PREVIEW_SAMPLE[sampleKey] || '';
}

var BOLD_DEFAULT_GALLERY_INNER =
  '<div class="gallery-item tall"><img src="https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item wide"><img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div class="gallery-item"><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=70" alt=""/></div>';

function renderBoldGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = BOLD_DEFAULT_GALLERY_INNER;
    return;
  }
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
  if (!hasPortada && !shouldUseBoldSampleMedia()) return;
  var src = boldResolvePreviewPhotoSrc(raw && raw.portada, 'portada');
  if (!src) {
    img.removeAttribute('src');
    img.hidden = true;
    img.style.display = 'none';
    return;
  }
  var withCacheBust = src;
  if (/^https?:\/\//i.test(src) && src !== BOLD_PREVIEW_SAMPLE.portada) {
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
  if (!hasFoto && !shouldUseBoldSampleMedia()) return;
  var src = boldResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo');
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

function escapeAttrCraft(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderCraftAboutExtras(sections) {
  var wrap = document.getElementById('aboutExtraBlocks');
  if (!wrap) return;
  wrap.className = 'craft-about-extras';
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
      var mod = textFirst ? 'craft-about-extra--text-first' : 'craft-about-extra--photo-first';
      var blockNum = String(i + 3).padStart(2, '0');
      var imgTag = img
        ? '<img src="' + escapeAttrCraft(img) + '" alt="" loading="lazy" decoding="async"/>'
        : '';
      return (
        '<article class="craft-about-extra ' +
        mod +
        '">' +
        '<div class="craft-about-extra__copy">' +
        '<span class="eyebrow craft-about-extra__kicker">Bloque ' +
        blockNum +
        '</span>' +
        (title ? '<h3 class="cond craft-about-extra__title">' + title + '</h3>' : '') +
        (desc ? '<p class="craft-about-extra__desc">' + desc + '</p>' : '') +
        '</div>' +
        '<figure class="craft-about-extra__figure">' +
        '<div class="craft-about-extra__img' +
        (img ? ' has-photo' : '') +
        '">' +
        '<div class="craft-about-extra__ph" aria-hidden="true">Foto</div>' +
        imgTag +
        '</div></figure></article>'
      );
    })
    .join('');
  wrap.querySelectorAll('.craft-about-extra__desc, .craft-about-extra__title').forEach(function (el) {
    el.removeAttribute('data-anim');
    el.style.removeProperty('--anim-d');
    el.classList.remove('in-view');
  });
  if (typeof window.__craftoAnimRescan === 'number') {
    clearTimeout(window.__craftoAnimRescan);
  }
  window.__craftoAnimRescan = window.setTimeout(function () {
    if (typeof window.__craftoAnimApplyTags === 'function') window.__craftoAnimApplyTags();
    if (typeof window.__craftoAnimObserveAll === 'function') window.__craftoAnimObserveAll();
  }, 140);
}

window.lwRenderAboutExtrasImpl = renderCraftAboutExtras;

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
            '<article class="svc">' +
            '<div class="svc-num">' + num + '</div>' +
            '<h3>' + nm + '</h3>' +
            (dc ? '<p class="svc-body">' + escapeHtmlTextBold(String(s.description)) + '</p>' : '<p class="svc-body">&nbsp;</p>') +
            '<div class="svc-foot"><span class="svc-price">' + pr + '</span><span class="svc-link">Pedir →</span></div>' +
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
      '<span class="dots"></span>' +
      (openDay
        ? '<span class="time">' + d.open + ' – ' + d.close + '</span>'
        : '<span class="time" style="color:var(--ink-3);font-style:italic">cerrado</span>');
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
    heroPill.style.color = openToday ? 'var(--orange)' : '#999';
    var dot = heroPill.querySelector('.dot');
    if (dot) {
      dot.style.background = openToday ? 'var(--orange)' : '#999';
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
    aboutTitle.textContent = customAboutTitle || 'Sobre nosotros.';
  }

  if (raw && Object.prototype.hasOwnProperty.call(raw, 'about_sections')) {
    renderCraftAboutExtras(raw.about_sections);
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
    ctaTitle.innerHTML = 'Reserva.<br/>Ven.<br/>Creamos juntos.';
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

  updateBoldHeroPhoto(raw || {});
  updateBoldAboutPhoto(raw || {});

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
}

/* ───── INIT FROM QUERY (fallback dev) ──────────────── */
(function initBoldPreviewSampleMedia() {
  if (!shouldUseBoldSampleMedia()) return;
  function boot() {
    updateBoldHeroPhoto({ portada: '' });
    updateBoldAboutPhoto({ foto_equipo: '' });
    renderBoldGallery([]);
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
    syncBoldScheduleFromPreview(null);
    renderBoldSchedule();
    renderBoldGallery([]);
    if (shouldUseBoldSampleMedia()) {
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
/* ============================================================
   CRAFTO-STYLE ANIMATIONS — auto-tagging + IntersectionObserver
   No modifica datos, ni eventos, ni postMessage. Solo añade
   atributos data-anim y dispara la clase .in-view al hacer scroll.
   ============================================================ */
(function(){
  if (window.__craftoAnimInit) return; window.__craftoAnimInit = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  function tag(sel, anim, opts){
    opts = opts || {};
    var nodes = document.querySelectorAll(sel);
    nodes.forEach(function(el, i){
      if (el.hasAttribute('data-anim')) return;
      el.setAttribute('data-anim', anim);
      var base = opts.delay || 0;
      var step = opts.stagger || 0;
      if (base || step) el.style.setProperty('--anim-d', (base + i * step) + 'ms');
    });
  }

  function applyTags(){
    tag('.hero-meta', 'fade-in-down');
    tag('.hero-badge', 'fade-in-down');
    tag('.hero h1', 'fade-in-up', {delay:80});
    tag('.hero-tag', 'fade-in-up', {delay:180});
    tag('.hero-cta > *', 'fade-in-up', {delay:260, stagger:90});
    tag('.hero-photo', 'zoom-in', {delay:100});
    tag('.section-head .eyebrow, .section-head h2, .section-head .desc', 'fade-in-up', {stagger:90});
    tag('.services-grid .svc', 'fade-in-up', {stagger:90});
    tag('.about-img', 'fade-in-left');
    tag('.about-grid > *:not(.about-img)', 'fade-in-right', {stagger:80});
    tag('.craft-about-extra--text-first .craft-about-extra__copy', 'fade-in-left');
    tag('.craft-about-extra--text-first .craft-about-extra__figure', 'fade-in-right');
    tag('.craft-about-extra--photo-first .craft-about-extra__figure', 'fade-in-left');
    tag('.craft-about-extra--photo-first .craft-about-extra__copy', 'fade-in-right', { stagger: 80 });
    tag('.gallery .gallery-item', 'zoom-in', {stagger:70});
    tag('.info-grid .info-card', 'fade-in-up', {stagger:120});
    tag('.map-section', 'fade-in-up');
    tag('.reviews-cta-section', 'fade-in-up');
    tag('.vcard-strip', 'fade-in-up');
    tag('.cta-section .cta-inner > *', 'fade-in-up', {stagger:100});
    tag('.foot > *', 'fade-in-up', {stagger:80});
    tag('.foot-bottom', 'fade-in-up');
    tag('section h2:not([data-anim]), section h3:not([data-anim]):not(.craft-about-extra__title)', 'fade-in-up');
    tag('section p:not([data-anim]):not(.craft-about-extra__desc)', 'fade-in-up', {delay:80});
  }

  function isInViewport(el){
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (rect.height < 1 || vh < 1) return false;
    return rect.top < vh * 0.94 && rect.bottom > vh * 0.04;
  }

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;

  function observeAll(){
    if (!io){
      document.querySelectorAll('[data-anim]').forEach(function(el){ el.classList.add('in-view'); });
      document.querySelectorAll('.section-head').forEach(function(el){ el.classList.add('in-view'); });
      var hero = document.querySelector('.hero');
      if (hero) hero.classList.add('in-view-hero');
      return;
    }
    document.querySelectorAll('[data-anim]:not(.in-view)').forEach(function(el){
      if (isInViewport(el)) {
        el.classList.add('in-view');
        return;
      }
      io.observe(el);
    });
    document.querySelectorAll('.section-head:not(.in-view)').forEach(function(el){
      if (isInViewport(el)) {
        el.classList.add('in-view');
        return;
      }
      io.observe(el);
    });
    var hero = document.querySelector('.hero');
    if (hero && !hero.classList.contains('in-view-hero')){
      if (isInViewport(hero)) {
        hero.classList.add('in-view-hero');
      } else {
        var heroIo = new IntersectionObserver(function(entries){
          entries.forEach(function(e){
            if (e.isIntersecting){
              hero.classList.add('in-view-hero');
              heroIo.disconnect();
            }
          });
        }, { threshold: 0.05 });
        heroIo.observe(hero);
      }
    }
  }

  window.__craftoAnimApplyTags = applyTags;
  window.__craftoAnimObserveAll = observeAll;

  function boot(){ applyTags(); observeAll(); }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  if (document.body.classList.contains('embed-preview') || document.body.classList.contains('bold-preview')) {
    window.setTimeout(function(){
      document.querySelectorAll('[data-anim]:not(.in-view)').forEach(function(el, i){
        window.setTimeout(function(){ el.classList.add('in-view'); }, 40 + i * 50);
      });
      document.querySelectorAll('.section-head:not(.in-view)').forEach(function(el){ el.classList.add('in-view'); });
      var hero = document.querySelector('.hero');
      if (hero) hero.classList.add('in-view-hero');
    }, 80);
  }

  var mo = new MutationObserver(function(){
    clearTimeout(window.__craftoAnimRescan);
    window.__craftoAnimRescan = setTimeout(function(){ applyTags(); observeAll(); }, 120);
  });
  mo.observe(document.body, { childList:true, subtree:true });
})();
</script>


@endverbatim

<script>
(function bootCraftProTenantPage() {
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
