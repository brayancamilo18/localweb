@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
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
  /* ═══════════ COASTAL-CALM — ORIGINAL TOKENS ═══════════ */
  :root{
    --sand:#F2EBE0;
    --paper:#FBF8F2;
    --ink:#2A2A26;
    --ink-soft:#5C564E;
    --ink-mute:#928B82;
    --sage:#7C9079;
    --sage-deep:#536052;
    --terracotta:#C76E4A;
    --terracotta-soft:#E8B89E;
    --line:rgba(42,42,38,.12);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--paper);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif;font-weight:400;-webkit-font-smoothing:antialiased;line-height:1.55;font-size:16px}
  section[id],a[id]{scroll-margin-top:80px}
  ::selection{background:var(--sage);color:#fff}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;cursor:pointer;border:none;background:none}
  img{display:block;max-width:100%}
  .serif{font-family:"DM Serif Display",Georgia,serif;font-weight:400;letter-spacing:-.015em;line-height:1.05}
  .italic{font-style:italic;color:var(--terracotta)}
  .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--sage-deep)}
  .eyebrow::before{content:"";display:inline-block;width:24px;height:1px;background:currentColor}

  /* ─── NAV ─── */
  .nav{position:sticky;top:0;z-index:9000;background:rgba(251,248,242,.86);backdrop-filter:saturate(140%) blur(14px);border-bottom:1px solid var(--line)}
  .nav-inner{max-width:1240px;margin:0 auto;padding:22px 32px;display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:12px;font-family:"DM Serif Display";font-size:24px;letter-spacing:-.01em}
  .brand-mark{width:34px;height:34px;border-radius:50%;background:var(--sage);color:var(--paper);display:grid;place-items:center;font-size:15px;font-weight:500}
  #navBrandName{font-family:"DM Serif Display";font-size:24px;letter-spacing:-.01em}
  .nav{--lw-logo-scale:1}
  .nav .brand.brand-has-img .nav-brand-img{display:block;height:calc(36px * var(--lw-logo-scale,1));width:auto;max-width:calc(180px * var(--lw-logo-scale,1));object-fit:contain;image-rendering:auto}
  .nav .brand.brand-has-img .brand-mark{display:none !important}
  .nav .brand.brand-has-img #navBrandName{display:none !important}
  .nav ul{list-style:none;display:flex;gap:36px;font-size:14px;color:var(--ink-soft)}
  .nav ul a{position:relative;padding:6px 0;transition:color .18s}
  .nav ul a:hover{color:var(--ink)}
  .nav ul a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--terracotta);transform:scaleX(0);transform-origin:left;transition:transform .25s}
  .nav ul a:hover::after{transform:scaleX(1)}
  .nav ul a.is-active{color:var(--ink)}
  .nav ul a.is-active::after{transform:scaleX(1)}
  .nav-actions{display:flex;align-items:center;gap:14px}
  .nav-cta{padding:11px 22px;border-radius:999px;background:var(--ink);color:var(--paper);font-size:13px;font-weight:500;letter-spacing:.01em;transition:background .15s,transform .15s}
  .nav-cta:hover{background:var(--sage-deep);transform:translateY(-1px)}
  .menu-toggle{display:none;width:40px;height:40px;border-radius:50%;background:var(--sand);color:var(--ink);flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0}
  .menu-toggle span{display:block;width:18px;height:1.5px;background:var(--ink);transition:.25s}
  .nav.is-open .menu-toggle span:nth-child(1){transform:translateY(5.5px) rotate(45deg)}
  .nav.is-open .menu-toggle span:nth-child(2){opacity:0}
  .nav.is-open .menu-toggle span:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}

  /* ─── HERO ─── */
  .hero{padding:60px 32px 100px;position:relative}
  .hero-inner{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 1.1fr;gap:64px;align-items:center;min-height:78vh}
  .hero-meta{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .hero-meta .live{display:inline-flex;align-items:center;gap:8px;color:var(--sage);font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}
  .hero-meta .live .dot{width:8px;height:8px;background:var(--sage);border-radius:50%;animation:breath 2.4s ease-in-out infinite}
  .hero h1{font-size:clamp(56px,7.5vw,108px);margin:24px 0 28px}
  .hero h1 span{display:block}
  .hero-tag{font-size:18px;line-height:1.65;color:var(--ink-soft);max-width:440px;margin-bottom:36px}
  .hero-cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
  .btn-primary{display:inline-flex;align-items:center;gap:10px;padding:16px 28px;background:var(--terracotta);color:#fff;border-radius:999px;font-size:14px;font-weight:500;letter-spacing:.01em;transition:background .15s,transform .15s,box-shadow .2s}
  .btn-primary:hover{background:#A85A39;transform:translateY(-2px);box-shadow:0 12px 24px -8px rgba(199,110,74,.45)}
  .btn-ghost{display:inline-flex;align-items:center;gap:10px;padding:16px 24px;color:var(--ink);font-size:14px;font-weight:500}
  .btn-ghost .arrow{width:28px;height:28px;border-radius:50%;background:var(--sand);display:grid;place-items:center;font-size:13px;transition:transform .2s,background .15s}
  .btn-ghost:hover .arrow{transform:translateX(3px);background:var(--terracotta-soft)}
  .hero-photo{position:relative;border-radius:32px;overflow:hidden;aspect-ratio:4/5;background:var(--sand)}
  .hero-photo img{width:100%;height:100%;object-fit:cover}
  .hero-photo .badge-card{position:absolute;left:24px;bottom:24px;background:rgba(251,248,242,.92);backdrop-filter:blur(10px);padding:14px 18px;border-radius:18px;display:flex;align-items:center;gap:12px;box-shadow:0 18px 40px -16px rgba(0,0,0,.18)}
  .badge-card .dot{width:8px;height:8px;border-radius:50%;background:var(--sage);animation:breath 2.4s ease-in-out infinite}
  @keyframes breath{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
  .badge-card .lbl{font-size:13px;font-weight:500}
  .badge-card .sub{font-size:11px;color:var(--ink-mute);margin-top:1px}
  .hero-orb{position:absolute;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle at 30% 30%,var(--terracotta-soft),var(--terracotta) 70%);right:-60px;top:80px;z-index:-1;filter:blur(60px);opacity:.55;animation:coastalOrbFloat 14s ease-in-out infinite}
  @keyframes coastalOrbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-20px,16px) scale(1.08)}}

  /* ─── REVEAL (como soft-organic / mono-edito) ─── */
  .nav.scrolled{box-shadow:0 14px 44px -22px rgba(42,42,38,.14)}
  .hero .hero-copy > *{opacity:0;transform:translateY(28px);transition:opacity .95s cubic-bezier(.65,0,.35,1),transform .95s cubic-bezier(.65,0,.35,1)}
  .hero .hero-photo{opacity:0;transform:translateY(32px) scale(.98);transition:opacity 1.05s cubic-bezier(.65,0,.35,1),transform 1.05s cubic-bezier(.65,0,.35,1);transition-delay:.12s}
  .hero.in .hero-copy > *{opacity:1;transform:none}
  .hero.in .hero-photo{opacity:1;transform:none}
  .hero.in .hero-meta{transition-delay:0s}
  .hero.in .hero-copy h1{transition-delay:.08s}
  .hero.in .hero-copy .hero-tag{transition-delay:.18s}
  .hero.in .hero-copy .hero-cta{transition-delay:.28s}
  .slide-up{opacity:0;transform:translateY(36px);transition:opacity 1s cubic-bezier(.65,0,.35,1),transform 1s cubic-bezier(.65,0,.35,1)}
  .slide-up.in{opacity:1;transform:none}
  .slide-up[data-d="1"]{transition-delay:.12s}
  .slide-up[data-d="2"]{transition-delay:.24s}
  .slide-up[data-d="3"]{transition-delay:.36s}
  .room-list .room.slide-up:nth-child(2){transition-delay:.1s}
  .room-list .room.slide-up:nth-child(3){transition-delay:.2s}
  .gallery-grid > div.slide-up:nth-child(2){transition-delay:.06s}
  .gallery-grid > div.slide-up:nth-child(3){transition-delay:.12s}
  .gallery-grid > div.slide-up:nth-child(4){transition-delay:.18s}
  .gallery-grid > div.slide-up:nth-child(5){transition-delay:.24s}
  .gallery-grid > div.slide-up:nth-child(6){transition-delay:.3s}
  .gallery-grid > div.slide-up:nth-child(7){transition-delay:.36s}

  /* ─── TICKER ─── */
  .ticker{max-width:1240px;margin:0 auto;padding:0 32px 80px;display:flex;align-items:center;gap:48px;flex-wrap:wrap;color:var(--ink-mute);overflow:hidden}
  .ticker-track{display:flex;gap:32px;font-size:14px;white-space:nowrap;animation:scroll 40s linear infinite;will-change:transform}
  .ticker:hover .ticker-track{animation-duration:80s}
  .ticker .star{color:var(--terracotta);font-size:10px}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* ─── ABOUT ─── */
  section{padding:120px 32px}
  .about-inner{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:96px;align-items:center}
  .about-photo-wrap{position:relative;width:100%}
  .about-photo-main{border-radius:24px;overflow:hidden;aspect-ratio:3/4;width:100%;max-height:min(72vh,640px);background:var(--sand) center/cover;background-size:cover}
  .about-photo-wrap img{display:none!important}
  .about-text h2{font-size:clamp(40px,5.5vw,72px);margin:20px 0 28px}
  .about-text p{color:var(--ink-soft);margin-bottom:18px;font-size:17px;line-height:1.75;max-width:480px}

  /* ─── ROOMS / SERVICES (coastal-calm original) ─── */
  .offerings{background:var(--sand);border-radius:48px;margin:0 32px;padding:120px 64px}
  .offerings-head{max-width:1180px;margin:0 auto 64px;text-align:center}
  .offerings-head h2{font-size:clamp(40px,5.5vw,72px);margin:18px auto 16px;max-width:700px}
  .offerings-head p{color:var(--ink-soft);font-size:17px;max-width:520px;margin:0 auto;line-height:1.7}
  .room-list{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
  .room{background:var(--paper);border-radius:24px;overflow:hidden;transition:transform .3s,box-shadow .3s}
  .room:hover{transform:translateY(-6px);box-shadow:0 30px 60px -24px rgba(42,42,38,.14)}
  .room-img{aspect-ratio:5/4;overflow:hidden;background:var(--sand)}
  .room-img img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
  .room:hover .room-img img{transform:scale(1.04)}
  .room-body{padding:28px 26px}
  .room-title{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:8px}
  .room-title h3{font-family:"DM Serif Display";font-size:26px;letter-spacing:-.01em}
  .room-price{font-family:"DM Serif Display";font-size:24px;color:var(--terracotta);white-space:nowrap}
  .room-price small{display:block;font-family:"DM Sans";font-size:11px;color:var(--ink-mute);font-weight:400;margin-top:-2px;text-align:right}
  .room p{color:var(--ink-soft);font-size:14.5px;line-height:1.6;margin-bottom:18px}
  .room-feats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
  .room-feats span{padding:5px 11px;background:var(--sand);border-radius:999px;font-size:11.5px;color:var(--ink-soft);letter-spacing:.02em}
  .room-cta{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;color:var(--terracotta);font-weight:500;border-bottom:1px solid var(--terracotta);padding-bottom:2px;transition:gap .2s}
  .room-cta:hover{gap:12px}

  /* ─── GALLERY (coastal-calm original) ─── */
  .gallery-section{padding:120px 32px 60px}
  .gallery-head{max-width:1240px;margin:0 auto 56px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
  .gallery-head h2{font-size:clamp(40px,5.5vw,72px);max-width:560px;margin-top:18px}
  .gallery-grid{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
  .gallery-grid > div{border-radius:18px;overflow:hidden;aspect-ratio:1/1;background:var(--sand);transition:transform .4s;cursor:pointer}
  .gallery-grid > div:hover{transform:translateY(-4px)}
  .gallery-grid > div:nth-child(1){grid-column:span 2;grid-row:span 2;aspect-ratio:1/1}
  .gallery-grid > div:nth-child(4){grid-column:span 2;aspect-ratio:2/1}
  .gallery-grid > div:nth-child(7){grid-column:span 2;aspect-ratio:2/1}
  .gallery-grid img{width:100%;height:100%;object-fit:cover;transition:transform .8s;cursor:zoom-in}
  .gallery-grid > div:hover img{transform:scale(1.05)}

  /* ─── HOURS / CONTACT (coastal-calm original) ─── */
  .info{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:flex-start}
  .info-card{background:var(--paper)}
  .info-card h3{font-family:"DM Serif Display";font-size:32px;margin:14px 0 24px}
  .schedule-row{display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--line);font-size:15px}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row.today{color:var(--terracotta);font-weight:500}
  .schedule-row.today .day::after{content:" · hoy";color:var(--ink-mute);font-weight:400;font-size:13px}
  .schedule-row .closed{color:var(--ink-mute);font-style:italic}
  .schedule-status{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:var(--sand);color:var(--sage-deep);font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;margin-bottom:14px}
  .schedule-status .dot{width:7px;height:7px;border-radius:50%;background:var(--sage)}
  .schedule-status.open .dot{animation:statusPulse 2.4s infinite}
  .schedule-status.closed{color:var(--ink-mute)}
  .schedule-status.closed .dot{background:var(--ink-mute);animation:none}
  @keyframes statusPulse{0%{box-shadow:0 0 0 0 rgba(124,144,121,.6)}70%{box-shadow:0 0 0 8px rgba(124,144,121,0)}100%{box-shadow:0 0 0 0 rgba(124,144,121,0)}}
  .contact-card{background:var(--paper);border:1px solid var(--line);border-radius:32px;padding:40px 36px}
  .contact-link{display:flex;gap:18px;align-items:center;padding:14px 0;border-bottom:1px solid var(--line);font-size:15.5px;color:var(--ink);transition:gap .2s}
  .contact-link:hover{gap:22px}
  .contact-link:last-child{border-bottom:none}
  .contact-link .ico{width:40px;height:40px;border-radius:50%;background:var(--sand);display:grid;place-items:center;color:var(--sage-deep);font-size:14px;flex-shrink:0}
  .contact-link strong{display:block;margin-bottom:1px}
  .contact-link span{font-size:13px;color:var(--ink-mute)}

  /* ─── MAP (adapted to coastal-calm) ─── */
  .map-section{max-width:1240px;margin:40px auto 0;border-radius:24px;overflow:hidden;border:1px solid var(--line)}
  .map-section.bold-map-empty{display:none}
  .map-shell{position:relative;background:var(--sand)}
  .map-leaflet{height:min(340px,50vh);min-height:220px;width:100%;background:var(--sand)}
  .map-shell .leaflet-container{font-family:"DM Sans";background:var(--sand)}
  .map-shell .leaflet-control-zoom a{background:var(--paper);color:var(--sage-deep);border:1px solid var(--line);border-radius:8px!important;font-weight:600}
  .map-shell .leaflet-control-zoom a:hover{background:var(--sage);color:#fff}
  .map-shell .leaflet-bar{border:none;box-shadow:none}
  .map-shell .leaflet-control-attribution{background:var(--paper)!important;color:var(--ink-mute)!important;font-size:10px!important}
  .map-shell .leaflet-control-attribution a{color:var(--terracotta)!important}
  .bold-leaflet-divicon{background:transparent!important;border:none!important}
  .bold-map-pin-wrap{position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;pointer-events:none}
  .bold-map-core{width:12px;height:12px;background:var(--terracotta);border:3px solid var(--paper);border-radius:50%;box-shadow:0 0 0 1px var(--terracotta),0 4px 12px rgba(0,0,0,.2);position:relative;z-index:2}
  .bold-map-radar-ring{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border:2px solid var(--terracotta);border-radius:50%;box-shadow:0 0 10px rgba(199,110,74,.25);animation:boldMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;pointer-events:none}
  .bold-map-radar-ring.d2{animation-delay:1.25s}
  @keyframes boldMapRadar{0%{transform:scale(0.4);opacity:.95}65%{opacity:.2}100%{transform:scale(2.15);opacity:0}}
  .map-directions-row{display:none;justify-content:flex-start;align-items:center;padding:20px 32px;background:var(--paper)}
  .map-directions-row.is-visible{display:flex}

  /* ─── REVIEWS CTA ─── */
  .reviews-cta-section{max-width:1240px;margin:40px auto 0;background:var(--sand);border:1px solid var(--line);border-radius:32px;padding:40px 36px;display:none;flex-direction:column;gap:14px;align-items:flex-start}
  .reviews-cta-section.is-visible{display:flex}
  .reviews-cta-section h3{font-family:"DM Serif Display";font-size:32px;line-height:1.05;letter-spacing:-.01em}
  .reviews-cta-section p{font-size:14px;line-height:1.55;color:var(--ink-soft);max-width:520px}

  /* ─── VCARD ─── */
  .vcard-strip{max-width:1240px;margin:24px auto 0;background:var(--ink);color:var(--paper);border-radius:24px;padding:28px 36px;display:none;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .vcard-strip.is-visible{display:flex}
  .vcard-strip strong{font-family:"DM Serif Display";font-size:22px;letter-spacing:-.01em}
  .vcard-strip small{font-size:11px;color:var(--ink-mute);display:block;margin-top:4px;letter-spacing:.02em}

  /* ─── CTA ─── */
  .cta-calm{background:var(--sage-deep);color:var(--paper);border-radius:48px;margin:80px 32px;padding:120px 64px;text-align:center;position:relative;overflow:hidden}
  .cta-calm h2{font-family:"DM Serif Display";font-size:clamp(40px,5.5vw,72px);line-height:1.05;letter-spacing:-.015em;margin-bottom:36px}
  .cta-calm h2 em{font-style:italic;color:var(--terracotta-soft)}
  .cta-calm .btn-primary{font-size:16px;padding:18px 36px}

  /* ─── FOOTER (coastal-calm original) ─── */
  footer{padding:100px 32px 40px;background:var(--paper);border-top:1px solid var(--line);margin-top:80px}
  .foot{max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:48px;margin-bottom:64px}
  .foot-brand{font-family:"DM Serif Display";font-size:42px;letter-spacing:-.015em;line-height:1;margin-bottom:18px}
  .foot-brand .accent{color:var(--terracotta)}
  .foot p{color:var(--ink-soft);max-width:300px;line-height:1.6;font-size:15px}
  .foot h4{font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:18px}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:10px}
  .foot ul a{font-size:14.5px;color:var(--ink-soft);transition:color .15s}
  .foot ul a:hover{color:var(--terracotta)}
  .foot-bottom{max-width:1240px;margin:0 auto;padding-top:32px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink-mute);flex-wrap:wrap;gap:14px}
  .foot-bottom a{color:var(--terracotta)}

  /* ─── EMBED ─── */
  html.embed-preview-root{scroll-behavior:auto!important}
  body.embed-preview .info{scroll-margin-top:80px}

  /* ─── RESPONSIVE ─── */
  @media (max-width:880px){
    .nav-inner{padding:16px 20px}
    .nav ul{display:none}
    .menu-toggle{display:flex}
    section{padding:64px 20px}
    .hero{padding:32px 20px 56px}
    .hero-inner{grid-template-columns:1fr;gap:40px;min-height:auto}
    .hero-orb{display:none}
    .about-inner{grid-template-columns:1fr;gap:48px}
    .offerings{margin:0 16px;padding:64px 24px;border-radius:32px}
    .room-list{grid-template-columns:1fr}
    .gallery-section{padding:64px 20px 40px}
    .gallery-grid{grid-template-columns:repeat(2,1fr)}
    .gallery-grid > div:nth-child(1),.gallery-grid > div:nth-child(4),.gallery-grid > div:nth-child(7){grid-column:span 2;grid-row:auto;aspect-ratio:2/1}
    .cta-calm{margin:40px 16px;padding:64px 24px;border-radius:32px}
    .info{grid-template-columns:1fr;gap:32px}
    .foot{grid-template-columns:1fr 1fr;gap:32px}
    .foot-brand{font-size:32px}
    .reviews-cta-section,.vcard-strip{margin-left:16px;margin-right:16px}
    .map-section{margin-left:16px;margin-right:16px;margin-top:24px}
    .contact-card{padding:28px 20px;border-radius:24px}
    .map-directions-row{padding:16px 20px}
    .nav.is-open ul{display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;background:rgba(251,248,242,.96);backdrop-filter:blur(14px);border-top:1px solid var(--line);padding:8px 20px 16px;z-index:100;box-shadow:0 14px 24px rgba(0,0,0,.1)}
    .nav.is-open ul li{border-bottom:1px solid var(--line)}
    .nav.is-open ul li:last-child{border-bottom:none}
    .nav.is-open ul a{display:block;padding:14px 4px;font-size:16px;color:var(--ink)}
  }
  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
    html{scroll-behavior:auto!important}
    .slide-up,.hero .hero-copy > *,.hero .hero-photo{opacity:1!important;transform:none!important}
    .hero-orb{animation:none!important}
  }

  /* ─── LIGHTBOX ─── */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;border-radius:50%;font-family:system-ui,sans-serif}
  @media (max-width:640px){.lw-gallery-lightbox-close{top:8px;right:8px}}
</style>
@endverbatim

@endpush

@section('content')

<!-- ═══════════════════ NAV ═══════════════════ -->
<nav class="nav">
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
      <a href="https://wa.me/{{ $whatsapp }}" class="nav-cta" data-wa-link>Reservar →</a>
      <button type="button" id="navMenuToggle" class="menu-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="boldNavList">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero" id="hero">
  <div class="hero-orb" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <div class="hero-meta">
        <span class="live" id="heroStatusPill"><span class="dot"></span><span id="heroStatusText">Comprobando…</span></span>
      </div>
      <h1 class="serif" id="heroTitle">{{ $nombre }}</h1>
      <p class="hero-tag" id="heroTagline">{{ $tagline }}</p>
      <div class="hero-cta">
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="btn-primary" data-tel-link>Llamar ahora <span>→</span></a>
        <a href="https://wa.me/{{ $whatsapp }}" class="btn-ghost" data-wa-link>WhatsApp <span class="arrow">→</span></a>
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

<!-- ═══════════════════ ABOUT ═══════════════════ -->
<section id="sobre-nosotros">
  <div class="about-inner">
    <div class="about-photo-wrap slide-up" id="aboutPhotoWrap">
      <div class="about-photo-main" id="aboutPhotoMain" role="img" aria-label=""></div>
      <img id="aboutPhotoImg" src="" alt="" hidden style="display:none"/>
    </div>
    <div class="about-text slide-up" data-d="1">
      <span class="eyebrow">Sobre nosotros</span>
      <h2 class="serif" id="aboutTitle">Tu negocio.</h2>
      <p id="aboutDescripcion">Descripción del negocio: quiénes sois, qué hacéis y por qué importa.</p>
    </div>
  </div>
</section>

<!-- ═══════════════════ SERVICES ═══════════════════ -->
<section id="servicios" style="padding:60px 0;display:none;">
  <div class="offerings">
    <div class="offerings-head slide-up">
      <span class="eyebrow">Lo que ofrecemos</span>
      <h2 class="serif">Nuestros <span class="italic">servicios.</span></h2>
      <p>Todo lo que podemos hacer por ti.</p>
    </div>
    <div class="room-list" id="tplServicesList">

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

<!-- ═══════════════════ GALLERY ═══════════════════ -->
<section id="galeria" class="gallery-section">
  <div class="gallery-head slide-up">
    <div>
      <span class="eyebrow">Galería</span>
      <h2 class="serif">Pequeños momentos<br/><span class="italic">del día a día.</span></h2>
    </div>
  </div>
    <div class="gallery-grid" id="galleryLive">
@forelse($galeria as $imgUrl)
    <div class="gimg"><img src="{{ $imgUrl }}" alt=""/></div>
@empty
@endforelse
  </div>
</section>

<!-- ═══════════════════ HOURS + CONTACT ═══════════════════ -->
<section id="horario">
  <div class="info">
    <div class="info-card slide-up">
      <span class="schedule-status" id="statusPill">
        <span class="dot"></span>
        <span id="statusText">Comprobando…</span>
      </span>
      <h3>Cuándo nos encontráis</h3>
      <div id="schedule"></div>
    </div>
    <div class="contact-card slide-up" data-d="1">
      <a id="contacto" aria-hidden="true" style="display:block;height:0;overflow:hidden"></a>
      <span class="eyebrow">Contacto</span>
      <h3>Escríbenos directo</h3>
      <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" class="contact-link" data-tel-link>
        <span class="ico">☏</span>
        <div><strong data-phone-display>Tu teléfono</strong><span>Llamada directa</span></div>
      </a>
      <a href="mailto:" class="contact-link" id="contactEmailLink" hidden>
        <span class="ico">@</span>
        <div><strong id="contactEmailDisplay"></strong><span>Respondemos en 24h</span></div>
      </a>
      <a href="https://wa.me/{{ $whatsapp }}" class="contact-link" data-wa-link>
        <span class="ico">W</span>
        <div><strong>WhatsApp</strong><span>Respondemos rápido</span></div>
      </a>
      <a href="#" class="contact-link" id="contactAddressRow" hidden>
        <span class="ico">◉</span>
        <div><strong id="contactAddressText"></strong><span>Nuestra dirección</span></div>
      </a>
    </div>
  </div>
  <div class="map-section bold-map-empty" id="mapSection">
    <div class="map-shell">
      <div id="mapLeafletContainer" class="map-leaflet" role="img" aria-label="Mapa del negocio"></div>
    </div>
    <div class="map-directions-row" id="mapDirectionsRow">
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn-primary" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>
  </div>
  <section id="opiniones" class="reviews-cta-section slide-up">
    <span class="eyebrow">Lo que dicen los vecinos</span>
    <h3>Lo que dicen<br/>quienes nos eligen.</h3>
    <p>Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google.</p>
    <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn-primary" target="_blank" rel="noopener noreferrer" style="background:var(--ink);border:none">Ver y escribir reseñas →</a>
  </section>
  <div class="vcard-strip" id="tplVcardWrap">
    <div>
      <strong>Guarda nuestro contacto.</strong>
      <small>Descarga la tarjeta y añádenos a tu agenda con un toque.</small>
    </div>
    <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn-primary" download>Descargar vCard →</a>
  </div>
</section>

<!-- ═══════════════════ CTA ═══════════════════ -->
<section style="padding:0">
  <div class="cta-calm slide-up">
    <h2 id="ctaTitle">Reserva.<br/>Ven.<br/><em>Creamos juntos.</em></h2>
    <a href="https://wa.me/{{ $whatsapp }}" class="btn-primary" data-wa-link>Reservar por WhatsApp →</a>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
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
    <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">LocalWeb</a></span>
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
(function initCoastalPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('coastal-preview');
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

/** Hotel boutique / costa — solo en vista previa (?embed=1 o ?preview=1). */
var COASTAL_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
};

function shouldUseCoastalSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('coastal-preview');
}

function coastalResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseCoastalSampleMedia()) return '';
  return COASTAL_PREVIEW_SAMPLE[sampleKey] || '';
}

var BOLD_DEFAULT_GALLERY_INNER =
  '<div><img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=70" alt=""/></div>' +
  '<div><img src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=70" alt=""/></div>';

function renderBoldGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = BOLD_DEFAULT_GALLERY_INNER;
    Array.prototype.forEach.call(root.children, function (el) { el.classList.add('slide-up'); });
    coastalObserveReveals(root);
    return;
  }
  root.innerHTML = list
    .map(function (src, i) {
      return (
        '<div class="slide-up">' +
        '<img src="' + escapeBoldGalleryAttr(src) + '" alt=""/></div>'
      );
    })
    .join('');
  coastalObserveReveals(root);
}

function updateBoldGallerySlider(_isPro) {
  // Mantenemos siempre el grid editorial con sus tarjetas + hover (sin slider en Pro).
  var root = document.getElementById('galleryLive');
  if (!root) return;
  // No slider in coastal-calm — gallery uses CSS grid with nth-child spans.
  return;
}

/* ───── HERO + ABOUT photo ───────────────────────────── */
function updateBoldHeroPhoto(raw) {
  var img = document.getElementById('heroPhotoImg');
  if (!img) return;
  var hasPortada = raw && Object.prototype.hasOwnProperty.call(raw, 'portada');
  if (!hasPortada && !shouldUseCoastalSampleMedia()) return;
  var src = coastalResolvePreviewPhotoSrc(raw && raw.portada, 'portada');
  if (!src) {
    img.removeAttribute('src');
    img.hidden = true;
    img.style.display = 'none';
    return;
  }
  var withCacheBust = src;
  if (/^https?:\/\//i.test(src) && src !== COASTAL_PREVIEW_SAMPLE.portada) {
    var sep = src.indexOf('?') >= 0 ? '&' : '?';
    withCacheBust = src + sep + 'lwts=' + Date.now();
  }
  img.src = withCacheBust;
  img.hidden = false;
  img.style.display = 'block';
}

function updateBoldAboutPhoto(raw) {
  var main = document.getElementById('aboutPhotoMain');
  if (!main) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseCoastalSampleMedia()) return;
  var src = coastalResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo');
  main.style.backgroundImage = src ? 'url("' + String(src).replace(/"/g, '\\"') + '")' : '';
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
            '<article class="room slide-up">' +
            '<div class="room-body">' +
            '<div class="room-title"><h3>' + nm + '</h3><div class="room-price">' + pr + '</div></div>' +
            (dc ? '<p>' + escapeHtmlTextBold(String(s.description)) + '</p>' : '') +
            '<a href="#contacto" class="room-cta">Reservar →</a>' +
            '</div></article>'
          );
        })
        .join('');
      coastalObserveReveals(list);
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
    instagram: 'https://www.instagram.com/localweb.es',
    tiktok: 'https://www.tiktok.com/@localweb',
    facebook: 'https://www.facebook.com/localweb'
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
    heroPill.style.color = openToday ? 'var(--terracotta)' : '#999';
    var dot = heroPill.querySelector('.dot');
    if (dot) {
      dot.style.background = openToday ? 'var(--terracotta)' : '#999';
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
      var lsc = (raw && typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale)) ? raw.logo_scale : 1;
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

(function initCoastalPreviewSampleMedia() {
  if (!shouldUseCoastalSampleMedia()) return;
  function boot() {
    updateBoldHeroPhoto({ portada: '' });
    updateBoldAboutPhoto({ foto_equipo: '' });
    renderBoldGallery([]);
    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('in');
    coastalObserveReveals(document);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* ───── INIT FROM QUERY (fallback dev) ──────────────── */
(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (!params.has('preview')) {
    syncBoldScheduleFromPreview(null);
    renderBoldSchedule();
    renderBoldGallery([]);
    if (shouldUseCoastalSampleMedia()) {
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

/* ───── Animaciones (reveal al scroll + hero) ───────── */
function coastalObserveReveals(root) {
  var scope = root && root.querySelectorAll ? root : document;
  var nodes = scope.querySelectorAll
    ? scope.querySelectorAll('.slide-up:not(.in)')
    : document.querySelectorAll('.slide-up:not(.in)');
  if (!nodes.length) return;

  if (document.body.classList.contains('embed-preview') || document.body.classList.contains('coastal-preview')) {
    Array.prototype.forEach.call(nodes, function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, 70 + i * 110);
    });
    return;
  }

  if (!window.__coastalRevealIo) {
    window.__coastalRevealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          window.__coastalRevealIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
  }
  Array.prototype.forEach.call(nodes, function (el) {
    window.__coastalRevealIo.observe(el);
  });
}

(function initCoastalMotion() {
  var nav = document.querySelector('nav.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  var hero = document.getElementById('hero');
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('in'); });
    });
  }

  coastalObserveReveals(document);
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


@endverbatim

<script>
(function bootCoastalCalmTenantPage() {
  function run() {
    if (typeof applyLivePreviewData === 'function') {
      applyLivePreviewData({
        logo_url: @json($logo_url),
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
