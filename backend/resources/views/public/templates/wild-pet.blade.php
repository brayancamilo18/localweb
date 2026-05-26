@extends('public.layouts.tenant')

@push('head-extras')
<meta name="description" content="Plantilla profesional, divertida y colorida para negocios pet con personalidad." />
<script>
(function () {
  var p = new URLSearchParams(location.search);
  if (p.get('thumb') === '1') { window.__LW_SKIP_LEAFLET = true; return; }
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://unpkg.com/leaflet@' + '1.9.4/dist/leaflet.css';
  l.crossOrigin = '';
  document.head.appendChild(l);
})();
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Fredoka:wght@500;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">

@verbatim
<style>
  :root{
    /* Paleta maximalista */
    --cream:    #fff8ec;
    --paper:    #ffffff;
    --ink:      #1a1428;

    --lila:     #8b5cf6;
    --lila-soft:#ede4ff;
    --lima:     #84cc16;
    --lima-soft:#e6f6c8;
    --coral:    #fb7185;
    --coral-soft:#ffe1e6;
    --amar:     #facc15;
    --amar-soft:#fff2c0;
    --sky:      #38bdf8;
    --sky-soft: #d6f0ff;

    /* Fondo "cinético" — se anima vía JS */
    --bg-now:   var(--cream);

    --r-sm: 14px;
    --r:    22px;
    --r-lg: 32px;
    --r-xl: 48px;

    /* Bouncy / overshoot easings */
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-pop:    cubic-bezier(0.22, 1.6, 0.36, 1);
    --ease-soft:   cubic-bezier(0.4, 0, 0.2, 1);

    --display: "Bricolage Grotesque", system-ui, sans-serif;
    --display-2: "Fredoka", system-ui, sans-serif;
    --sans: "Nunito Sans", system-ui, sans-serif;

    --container: 1200px;
  }

  *,*::before,*::after{ box-sizing: border-box; }
  html{
    scroll-behavior: smooth;
    overflow-x: clip;
    max-width: 100%;
  }
  html.embed-preview-root{ scroll-behavior: auto; }
  body.embed-preview .sr,
  body.embed-preview [data-stagger],
  body.embed-preview .split,
  body.embed-preview .pop{ opacity: 1 !important; transform: none !important; }
  /* Preview embebido (React onboarding): mismas reglas compactas que móvil real */
  @media (max-width: 960px){
    html.embed-preview-root,
    body.embed-preview{
      overflow-x: clip;
      max-width: 100%;
    }
  }
  .hero-photo.has-photo .photo-fallback svg{ opacity: 0; }
  .hero-photo.has-photo .photo-fallback{
    background-size: cover;
    background-position: center;
  }
  .about-photo.has-photo .photo-fallback svg,
  .about-photo .photo-fallback.has-photo svg{ opacity: 0; }
  .about-photo.has-photo .photo-fallback,
  .about-photo .photo-fallback.has-photo{
    background-size: cover;
    background-position: center;
  }
  .about-photo.has-photo .photo-fallback::before,
  .about-photo .photo-fallback.has-photo::before{ opacity: 0; }
  .final-cta-photo.has-photo .photo-fallback svg,
  .final-cta-photo .photo-fallback.has-photo svg{ opacity: 0; }
  .final-cta-photo.has-photo .photo-fallback,
  .final-cta-photo .photo-fallback.has-photo{
    background-size: cover;
    background-position: center;
  }
  .final-cta-photo.has-photo .photo-fallback::before,
  .final-cta-photo .photo-fallback.has-photo::before{ opacity: 0; }
  .g-item.has-photo .photo-fallback svg{ opacity: 0; }
  .g-item.has-photo .photo-fallback::before{ opacity: 0; }
  body{
    margin: 0;
    font-family: var(--sans);
    color: var(--ink);
    background: var(--bg-now);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    transition: background-color .9s var(--ease-soft);
    overflow-x: clip;
    max-width: 100%;
  }
  img,svg{ display: block; max-width: 100%; }
  a{ color: inherit; }
  button{ font: inherit; cursor: pointer; }
  h1,h2,h3,h4{
    font-family: var(--display);
    font-weight: 800;
    color: var(--ink);
    margin: 0;
    line-height: 1.02;
    letter-spacing: -0.03em;
  }
  h1{ font-size: clamp(2.8rem, 7vw, 5.5rem); }
  h2{ font-size: clamp(2.2rem, 4.8vw, 3.8rem); }
  h3{ font-size: 1.4rem; font-family: var(--display-2); font-weight: 700; letter-spacing: -0.01em; }
  p{ margin: 0; }
  .num{ font-variant-numeric: tabular-nums; }

  :focus-visible{
    outline: 3px solid var(--lila);
    outline-offset: 4px;
    border-radius: 10px;
  }

  .container{
    width: min(100% - 32px, var(--container));
    margin-inline: auto;
    position: relative;
  }

  /* ===== Buttons ===== */
  .btn{
    display: inline-flex; align-items: center; gap: .6rem;
    padding: 1rem 1.5rem;
    border-radius: 999px;
    font-family: var(--display-2);
    font-weight: 700;
    font-size: 1.05rem;
    text-decoration: none;
    border: 2px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    transition: transform .35s var(--ease-spring), box-shadow .25s var(--ease-soft), background-color .25s var(--ease-soft);
    box-shadow: 4px 4px 0 var(--ink);
  }
  .btn svg{ width: 18px; height: 18px; }
  .btn:hover{
    transform: translate(-2px,-2px) rotate(-2deg) scale(1.04);
    box-shadow: 6px 6px 0 var(--ink);
  }
  .btn:active{
    transform: translate(2px,2px) rotate(0deg) scale(.98);
    box-shadow: 2px 2px 0 var(--ink);
  }
  .btn-primary{ background: var(--lila); color: #fff; }
  .btn-primary:hover{ background: #7c4cf0; }
  .btn-coral{ background: var(--coral); color: #fff; }
  .btn-coral:hover{ background: #f95a72; }
  .btn-amar{ background: var(--amar); color: var(--ink); }
  .btn-amar:hover{ background: #ffd933; }
  .btn-wa{ background: #25D366; color: #fff; }
  .btn-wa:hover{ background: #1ebe5a; transform: translate(-2px,-2px) rotate(2deg) scale(1.04); }
  .btn-sm{ padding: .55rem .9rem; font-size: .9rem; box-shadow: 3px 3px 0 var(--ink); }

  /* ===== Pills ===== */
  .pill{
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .45rem .9rem;
    border-radius: 999px;
    font-family: var(--display-2);
    font-weight: 700;
    font-size: .9rem;
    background: var(--paper);
    border: 2px solid var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
  }
  .pill .dot{
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--ink);
  }
  .pill.is-open .dot{ background: var(--lima); box-shadow: 0 0 0 4px var(--lima-soft); }
  .pill.is-closed .dot{ background: var(--coral); box-shadow: 0 0 0 4px var(--coral-soft); }

  /* ===== Decor shapes (parallax bounce) ===== */
  .decor{
    position: absolute;
    pointer-events: none;
    opacity: .9;
    will-change: transform;
  }
  .decor.dot-pattern{
    width: 140px; height: 140px;
    background-image: radial-gradient(var(--ink) 2px, transparent 2.5px);
    background-size: 18px 18px;
    opacity: .25;
  }
  .decor.blob{
    border-radius: 50%;
  }
  .decor.squig{
    width: 120px; height: 30px;
    background:
      radial-gradient(circle at 15px 15px, var(--coral) 9px, transparent 10px),
      radial-gradient(circle at 45px 15px, var(--amar) 9px, transparent 10px),
      radial-gradient(circle at 75px 15px, var(--lila) 9px, transparent 10px),
      radial-gradient(circle at 105px 15px, var(--lima) 9px, transparent 10px);
  }

  /* ===== Nav ===== */
  .nav{
    position: fixed; inset: 14px 0 auto 0;
    z-index: 60;
    pointer-events: none;
  }
  .nav-inner{
    pointer-events: auto;
    width: min(100% - 24px, var(--container));
    margin-inline: auto;
    display: flex; align-items: center; gap: 1rem;
    background: rgba(255,255,255,.7);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: .5rem .55rem .5rem 1.2rem;
    box-shadow: 4px 4px 0 var(--ink);
  }
  .brand{
    display: flex; align-items: center; gap: .55rem;
    font-family: var(--display);
    font-weight: 800;
    font-size: 1.15rem;
    text-decoration: none;
    color: var(--ink);
    letter-spacing: -0.02em;
  }
  .brand-mark{
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--amar);
    border: 2px solid var(--ink);
    display: grid; place-items: center;
    transition: transform .4s var(--ease-spring);
  }
  .brand:hover .brand-mark{ transform: rotate(-15deg) scale(1.08); }
  .nav-links{ display: flex; gap: .1rem; margin-left: auto; }
  .nav-links a{
    text-decoration: none;
    color: var(--ink);
    font-family: var(--display-2);
    font-weight: 600;
    font-size: .95rem;
    padding: .5rem .85rem;
    border-radius: 999px;
    transition: background-color .2s var(--ease-soft), transform .35s var(--ease-spring);
  }
  .nav-links a:hover{ background: var(--lila-soft); transform: rotate(-2deg) scale(1.06); }
  .nav-cta{ display: flex; gap: .4rem; align-items: center; flex-shrink: 0; }
  .burger{
    display: none;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--ink);
    align-items: center; justify-content: center;
    box-shadow: 2px 2px 0 var(--ink);
    flex-shrink: 0;
    transition: transform .35s var(--ease-spring), background-color .2s var(--ease-soft);
  }
  .burger:hover{ transform: rotate(-4deg) scale(1.05); }
  .burger span,
  .burger span::before,
  .burger span::after{
    display: block;
    width: 18px; height: 2.5px;
    background: var(--ink);
    border-radius: 2px;
    position: relative;
    transition: transform .32s var(--ease-spring), top .32s var(--ease-spring), opacity .2s var(--ease-soft), background-color .2s var(--ease-soft);
  }
  .burger span::before, .burger span::after{
    content: ""; position: absolute; left: 0;
  }
  .burger span::before{ top: -6px; }
  .burger span::after{ top: 4px; }
  .burger[aria-expanded="true"] span{ background: transparent; }
  .burger[aria-expanded="true"] span::before{
    top: 0;
    transform: rotate(45deg);
  }
  .burger[aria-expanded="true"] span::after{
    top: 0;
    transform: rotate(-45deg);
  }

  .sheet{
    position: fixed; inset: 0; z-index: 70;
    background: rgba(26,20,40,.55);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .35s var(--ease-soft), visibility .35s var(--ease-soft);
  }
  .sheet.open{
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  .sheet-inner{
    position: absolute; left: 12px; right: 12px; top: 78px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: var(--r-lg);
    padding: 1rem;
    box-shadow: 6px 6px 0 var(--ink);
    transform: translateY(-18px) scale(.97);
    opacity: 0;
    transition: transform .45s var(--ease-spring), opacity .35s var(--ease-soft);
    transform-origin: top center;
  }
  .sheet.open .sheet-inner{
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  .sheet-inner nav{
    display: grid;
    gap: .25rem;
    clear: both;
    padding-top: .35rem;
  }
  .sheet-inner a{
    display: block;
    padding: .9rem 1rem;
    text-decoration: none;
    color: var(--ink);
    font-family: var(--display-2);
    font-weight: 700;
    font-size: 1.1rem;
    border-radius: 16px;
    opacity: 0;
    transform: translateY(-10px);
    transition: background-color .2s var(--ease-soft), opacity .35s var(--ease-soft), transform .4s var(--ease-spring);
  }
  .sheet.open .sheet-inner a{
    opacity: 1;
    transform: translateY(0);
  }
  .sheet.open .sheet-inner nav a:nth-child(1){ transition-delay: .06s; }
  .sheet.open .sheet-inner nav a:nth-child(2){ transition-delay: .1s; }
  .sheet.open .sheet-inner nav a:nth-child(3){ transition-delay: .14s; }
  .sheet.open .sheet-inner nav a:nth-child(4){ transition-delay: .18s; }
  .sheet.open .sheet-inner nav a:nth-child(5){ transition-delay: .22s; }
  .sheet.open .sheet-inner nav a:nth-child(6){ transition-delay: .26s; }
  .sheet-inner a:hover{ background: var(--amar-soft); }
  .sheet-close{
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--amar);
    border: 2px solid var(--ink);
    float: right;
    display: grid; place-items: center;
    box-shadow: 2px 2px 0 var(--ink);
    transition: transform .35s var(--ease-spring);
  }
  .sheet-close:hover{ transform: rotate(-8deg) scale(1.06); }
  body.nav-sheet-open{ overflow: hidden; }

  /* ===== Sections ===== */
  section{ padding: clamp(72px, 10vw, 130px) 0; position: relative; }
  .eyebrow{
    display: inline-flex; align-items: center; gap: .5rem;
    text-transform: uppercase;
    letter-spacing: .14em;
    font-family: var(--display-2);
    font-size: .85rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--paper);
    border: 2px solid var(--ink);
    padding: .45rem .85rem;
    border-radius: 999px;
    box-shadow: 3px 3px 0 var(--ink);
    transform: rotate(-1.5deg);
  }
  .section-head{ max-width: 760px; margin-bottom: 3rem; }
  .section-head h2{ margin-top: 1rem; }
  .section-head p{ color: var(--ink); opacity: .75; margin-top: .8rem; font-size: 1.1rem; max-width: 56ch; }

  /* ===== HERO ===== */
  .hero{
    padding-top: clamp(130px, 14vw, 170px);
    padding-bottom: clamp(80px, 10vw, 130px);
    position: relative;
    overflow: hidden;
  }
  .hero-grid{
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
    position: relative;
    z-index: 2;
  }
  .hero h1{ margin-top: 1rem; }
  .hero h1 .w{ display: inline-block; }
  .hero h1 .w-1{ color: var(--lila); }
  .hero h1 .w-3{ color: var(--coral); transform: rotate(-3deg); display: inline-block; }
  .hero h1 .w-5{ color: var(--lima); }
  .hero-lede{
    margin-top: 1.5rem;
    font-size: 1.2rem;
    max-width: 50ch;
    color: var(--ink);
    opacity: .85;
  }
  .hero-cta{
    display: flex; gap: .9rem; flex-wrap: wrap;
    margin-top: 2rem;
  }
  .hero-meta{
    display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;
    margin-top: 1.8rem;
    font-family: var(--display-2);
    font-weight: 600;
    font-size: .95rem;
  }
  .hero-meta .stars{ color: var(--amar); font-size: 1.2rem; letter-spacing: .1em; -webkit-text-stroke: 1px var(--ink); }

  .hero-photos{
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1.05;
    max-width: 560px;
    margin-inline: auto;
  }
  .hero-photo{
    position: absolute;
    overflow: hidden;
    border: 3px solid var(--ink);
    box-shadow: 6px 6px 0 var(--ink);
    background: var(--paper);
    transition: transform .5s var(--ease-spring);
  }
  .hero-photo:hover{ transform: var(--hover-t, none) rotate(0deg) scale(1.04) !important; filter: saturate(1.2) hue-rotate(8deg); }
  .hp-1{
    width: 62%; aspect-ratio: 1/1;
    border-radius: 50%;
    top: 6%; left: 4%;
    transform: rotate(-6deg);
  }
  .hp-2{
    width: 48%; aspect-ratio: 4/5;
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
    bottom: 8%; right: 2%;
    transform: rotate(7deg);
  }
  .hp-3{
    width: 38%; aspect-ratio: 1/1;
    border-radius: 28px;
    top: 4%; right: 6%;
    transform: rotate(-9deg);
  }
  .hero-photo .photo-fallback{
    width: 100%; height: 100%;
    display: grid; place-items: center;
    position: relative;
    overflow: hidden;
  }
  .photo-fallback svg{ width: 46%; height: auto; color: rgba(26,20,40,.85); position: relative; z-index: 2; }
  .hp-1 .photo-fallback{ background: var(--lila); color: #fff; }
  .hp-1 .photo-fallback::before{
    content: ""; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.35) 2px, transparent 2.5px);
    background-size: 22px 22px;
  }
  .hp-2 .photo-fallback{ background: var(--coral); color: #fff; }
  .hp-2 .photo-fallback::before{
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(circle at 25% 30%, rgba(255,255,255,.4) 18px, transparent 19px),
      radial-gradient(circle at 70% 70%, rgba(255,255,255,.4) 14px, transparent 15px),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,.35) 10px, transparent 11px);
  }
  .hp-3 .photo-fallback{ background: var(--amar); color: var(--ink); }
  .hp-3 .photo-fallback::before{
    content: ""; position: absolute; inset: 0;
    background: repeating-linear-gradient(45deg, transparent 0 14px, rgba(26,20,40,.08) 14px 28px);
  }

  /* Hero deco */
  .hero .star-shape{
    position: absolute;
    width: 90px; height: 90px;
    background: var(--lima);
    border: 3px solid var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
  }
  .hero .star-1{
    top: 12%; right: 50%;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: rotate(15deg);
  }
  .hero .star-2{
    width: 70px; height: 70px;
    bottom: 10%; left: 38%;
    background: var(--sky);
    border-radius: 50%;
  }

  /* ===== Ticker ===== */
  .ticker{
    background: var(--ink);
    color: var(--cream);
    overflow: hidden;
    padding: 0;
    border-top: 3px solid var(--ink);
    border-bottom: 3px solid var(--ink);
    transform: rotate(-2deg);
    margin: 2rem -3rem;
  }
  .ticker-track{
    display: flex; gap: 3rem;
    padding: 1.4rem 0;
    width: max-content;
    animation: tick 35s linear infinite;
  }
  .ticker-item{
    display: inline-flex; align-items: center; gap: .8rem;
    font-family: var(--display);
    font-weight: 800;
    font-size: 1.6rem;
    letter-spacing: -.02em;
    color: var(--cream);
    white-space: nowrap;
  }
  .ticker-item:nth-child(3n){ color: var(--amar); }
  .ticker-item:nth-child(3n+1){ color: var(--coral); }
  .ticker-item:nth-child(3n+2){ color: var(--lima); }
  .ticker-item svg{ width: 26px; height: 26px; color: var(--cream); }
  @keyframes tick{ to { transform: translateX(-50%); } }

  /* ===== Services ===== */
  .services-grid{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.4rem;
  }
  .service{
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: var(--r-lg);
    padding: 1.8rem;
    box-shadow: 6px 6px 0 var(--ink);
    transition: transform .45s var(--ease-spring), box-shadow .25s var(--ease-soft);
    position: relative;
  }
  .service:hover{
    transform: translate(-3px,-5px) rotate(-1.5deg) scale(1.02);
    box-shadow: 9px 9px 0 var(--ink);
  }
  .service:nth-child(6n+1){ background: var(--lila-soft); }
  .service:nth-child(6n+2){ background: var(--lima-soft); }
  .service:nth-child(6n+3){ background: var(--coral-soft); }
  .service:nth-child(6n+4){ background: var(--amar-soft); }
  .service:nth-child(6n+5){ background: var(--sky-soft); }
  .service:nth-child(6n+6){ background: var(--paper); }
  .service:nth-child(2n){ transform: rotate(.8deg); }
  .service:nth-child(2n):hover{ transform: translate(-3px,-5px) rotate(-1deg) scale(1.02); }
  .service-icon{
    width: 60px; height: 60px;
    border: 3px solid var(--ink);
    border-radius: 18px;
    display: grid; place-items: center;
    background: var(--paper);
    box-shadow: 3px 3px 0 var(--ink);
    margin-bottom: 1.2rem;
    transition: transform .4s var(--ease-spring);
  }
  .service:hover .service-icon{ transform: rotate(-10deg) scale(1.08); }
  .service:nth-child(6n+1) .service-icon{ background: var(--lila); color: #fff; }
  .service:nth-child(6n+2) .service-icon{ background: var(--lima); color: var(--ink); }
  .service:nth-child(6n+3) .service-icon{ background: var(--coral); color: #fff; }
  .service:nth-child(6n+4) .service-icon{ background: var(--amar); color: var(--ink); }
  .service:nth-child(6n+5) .service-icon{ background: var(--sky); color: var(--ink); }
  .service:nth-child(6n+6) .service-icon{ background: var(--ink); color: var(--cream); }
  .service h3{ font-size: 1.4rem; }
  .service p{ margin-top: .5rem; opacity: .8; }
  .service .price{
    display: flex; justify-content: space-between; align-items: baseline;
    margin-top: 1.3rem;
    padding-top: 1rem;
    border-top: 2px dashed rgba(26,20,40,.3);
  }
  .service .price strong{
    font-family: var(--display);
    font-weight: 800;
    font-size: 1.7rem;
  }
  .service .price small{
    font-family: var(--display-2);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-size: .75rem;
    opacity: .65;
  }

  /* ===== About ===== */
  .about-grid{
    display: grid;
    grid-template-columns: .85fr 1.15fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
  }
  .about-photo{
    aspect-ratio: 4/5;
    border: 3px solid var(--ink);
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 8px 8px 0 var(--ink);
    transform: rotate(-3deg);
    position: relative;
  }
  .about-photo .photo-fallback{
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background: var(--lila);
    color: #fff;
  }
  .about-photo .photo-fallback::before{
    content: ""; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.3) 2px, transparent 3px);
    background-size: 26px 26px;
  }
  .about-photo .photo-fallback svg{ width: 38%; }
  .about-name{
    margin-top: 1rem;
    font-family: var(--display);
    font-weight: 800;
    font-size: 1.2rem;
  }
  .about-role{
    font-family: var(--display-2);
    font-weight: 600;
    opacity: .65;
  }
  .about p{ font-size: 1.1rem; margin-top: 1.2rem; opacity: .8; }
  .about-stats{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 2.2rem;
  }
  .about-stat{
    border: 3px solid var(--ink);
    border-radius: var(--r);
    padding: 1.1rem;
    box-shadow: 4px 4px 0 var(--ink);
    transition: transform .4s var(--ease-spring);
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .about-stat:hover{ transform: rotate(-2deg) scale(1.04); }
  .about-stat:nth-child(1){ background: var(--lila); color: #fff; }
  .about-stat:nth-child(2){ background: var(--amar); color: var(--ink); }
  .about-stat .n{
    font-family: var(--display);
    font-weight: 800;
    font-size: clamp(1rem, 2.4vw, 1.45rem);
    line-height: 1.2;
    word-break: break-word;
  }
  .about-stat .l{
    font-family: var(--display-2);
    font-weight: 600;
    font-size: .9rem;
    margin-top: .35rem;
    opacity: .9;
  }

  /* "Pop" animation for nums */
  .pop{ display: inline-block; opacity: 0; transform: scale(.3); }
  .pop.in{
    animation: pop .7s var(--ease-spring) forwards;
  }
  @keyframes pop{
    0%{ opacity: 0; transform: scale(.3) rotate(-15deg); }
    60%{ opacity: 1; transform: scale(1.15) rotate(4deg); }
    100%{ opacity: 1; transform: scale(1) rotate(0deg); }
  }

  /* ===== Gallery ===== */
  .gallery{
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 120px;
    gap: 14px;
  }
  .g-item{
    border: 3px solid var(--ink);
    overflow: hidden;
    background: var(--paper);
    box-shadow: 5px 5px 0 var(--ink);
    transition: transform .45s var(--ease-spring), box-shadow .25s var(--ease-soft);
    position: relative;
    min-height: 0;
    display: block;
  }
  .g-item:hover{
    transform: rotate(-2deg) scale(1.04);
    box-shadow: 8px 8px 0 var(--ink);
    z-index: 5;
  }
  .g-item:nth-child(1){ grid-column: span 5; grid-row: span 3; border-radius: 60% 40% 50% 40% / 50% 50% 40% 50%; }
  .g-item:nth-child(2){ grid-column: span 4; grid-row: span 2; border-radius: var(--r-lg); transform: rotate(2deg); }
  .g-item:nth-child(3){ grid-column: span 3; grid-row: span 2; border-radius: 50%; transform: rotate(-3deg); }
  .g-item:nth-child(4){ grid-column: span 4; grid-row: span 2; border-radius: var(--r); }
  .g-item:nth-child(5){ grid-column: span 3; grid-row: span 2; border-radius: var(--r-lg); transform: rotate(1.5deg); }
  .g-item:nth-child(6){ grid-column: span 4; grid-row: span 2; border-radius: 40% 60% 60% 40% / 50% 50% 50% 50%; transform: rotate(-2deg); }
  .g-item:nth-child(7){ grid-column: span 5; grid-row: span 2; border-radius: var(--r-lg); }
  .g-item:nth-child(1) .photo-fallback{ background-color: var(--lila); color: #fff; }
  .g-item:nth-child(2) .photo-fallback{ background-color: var(--amar); color: var(--ink); }
  .g-item:nth-child(3) .photo-fallback{ background-color: var(--coral); color: #fff; }
  .g-item:nth-child(4) .photo-fallback{ background-color: var(--lima); color: var(--ink); }
  .g-item:nth-child(5) .photo-fallback{ background-color: var(--sky); color: var(--ink); }
  .g-item:nth-child(6) .photo-fallback{ background-color: var(--lila); color: #fff; }
  .g-item:nth-child(7) .photo-fallback{ background-color: var(--coral); color: #fff; }
  .g-item .photo-fallback{
    width: 100%; height: 100%;
    display: grid; place-items: center;
    position: relative;
    overflow: hidden;
  }
  .g-item .g-photo{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .g-item.has-photo .photo-fallback{
    display: block;
    background-color: var(--paper);
  }
  .g-item.has-photo .photo-fallback::before{ display: none; }
  .g-item .photo-fallback:not(:has(.g-photo))::before{
    content: ""; position: absolute; inset: 0;
    background-image: radial-gradient(currentColor 2px, transparent 2.5px);
    background-size: 24px 24px;
    opacity: .15;
  }
  .g-item .photo-fallback svg{ width: 40%; position: relative; z-index: 2; }

  /* ===== Schedule ===== */
  .schedule-wrap{
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: clamp(2rem, 5vw, 3rem);
    align-items: start;
  }
  .schedule{
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: 6px 6px 0 var(--ink);
  }
  .schedule-row{
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.05rem 1.5rem;
    border-bottom: 2px solid var(--ink);
    font-family: var(--display-2);
    font-weight: 600;
  }
  .schedule-row:last-child{ border-bottom: 0; }
  .schedule-row.is-today{ background: var(--amar); }
  .schedule-row.is-today .day::before{
    content: "👉 ";
  }
  .schedule-row .day{ font-weight: 700; }
  .schedule-row .hours{ opacity: .8; }
  .schedule-row.is-closed .hours{ font-style: italic; opacity: .55; }

  .schedule-side{
    background: var(--ink);
    color: var(--cream);
    border: 3px solid var(--ink);
    border-radius: var(--r-lg);
    padding: 1.8rem;
    box-shadow: 6px 6px 0 var(--lima);
  }
  .schedule-side .pill{ background: rgba(255,255,255,.06); border-color: var(--cream); color: var(--cream); box-shadow: 3px 3px 0 var(--lima); }
  .schedule-side h3{ color: var(--cream); margin-top: 1.2rem; font-size: 1.6rem; }
  .schedule-side p{ color: rgba(255,248,236,.75); margin-top: .6rem; }
  .schedule-side .btn{ margin-top: 1.5rem; }

  /* ===== Contact ===== */
  .contact-grid{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.4rem;
  }
  .contact-card{
    border: 3px solid var(--ink);
    border-radius: var(--r-lg);
    padding: 1.8rem;
    box-shadow: 6px 6px 0 var(--ink);
    text-decoration: none;
    color: var(--ink);
    transition: transform .45s var(--ease-spring), box-shadow .25s var(--ease-soft);
    display: block;
  }
  .contact-card:hover{ transform: rotate(-2deg) translateY(-4px) scale(1.02); box-shadow: 9px 9px 0 var(--ink); }
  .contact-card:nth-child(1){ background: var(--coral-soft); }
  .contact-card:nth-child(2){ background: var(--lima-soft); }
  .contact-card:nth-child(3){ background: var(--lila-soft); }
  .contact-card .ico{
    width: 56px; height: 56px;
    border: 3px solid var(--ink);
    border-radius: 18px;
    display: grid; place-items: center;
    background: var(--paper);
    box-shadow: 3px 3px 0 var(--ink);
    margin-bottom: 1rem;
    transition: transform .4s var(--ease-spring);
  }
  .contact-card:hover .ico{ transform: rotate(-12deg) scale(1.08); }
  .contact-card:nth-child(1) .ico{ background: var(--coral); color: #fff; }
  .contact-card:nth-child(2) .ico{ background: var(--lima); color: var(--ink); }
  .contact-card:nth-child(3) .ico{ background: var(--lila); color: #fff; }
  .contact-card .label{
    font-family: var(--display-2);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    font-size: .8rem;
    opacity: .7;
  }
  .contact-card .value{
    font-family: var(--display);
    font-weight: 800;
    font-size: 1.5rem;
    margin-top: .3rem;
    line-height: 1.1;
  }

  /* ===== Map ===== */
  #map{
    height: 440px;
    min-height: 440px;
    border: 3px solid var(--ink);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: 6px 6px 0 var(--ink);
    background: var(--paper);
    position: relative;
    z-index: 1;
  }
  #map.leaflet-container{
    width: 100%;
    height: 100%;
    font: inherit;
  }
  .map-directions{
    margin-top: 1.35rem;
    text-align: center;
  }
  .map-directions[hidden]{ display: none !important; }

  /* ===== Reviews ===== */
  .reviews{
    background: var(--amar);
    border: 3px solid var(--ink);
    border-radius: var(--r-xl);
    padding: clamp(2.5rem, 6vw, 4.5rem);
    text-align: center;
    box-shadow: 10px 10px 0 var(--ink);
    position: relative;
    overflow: hidden;
    transform: rotate(-1deg);
  }
  .reviews::before{
    content: "";
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(26,20,40,.07) 2px, transparent 3px);
    background-size: 26px 26px;
    pointer-events: none;
  }
  .reviews .stars{
    font-size: 3rem;
    letter-spacing: .1em;
    color: var(--ink);
  }
  .reviews h2{ margin-top: 1rem; }
  .reviews p{ max-width: 560px; margin: 1.2rem auto 2rem; font-size: 1.1rem; }

  /* ===== VCard ===== */
  .vcard{
    background: var(--lila);
    color: #fff;
    border: 3px solid var(--ink);
    border-radius: var(--r-xl);
    padding: clamp(1.8rem, 4vw, 2.8rem);
    display: flex; align-items: center; gap: 2rem;
    flex-wrap: wrap;
    box-shadow: 8px 8px 0 var(--ink);
    position: relative;
    overflow: hidden;
  }
  .vcard::before{
    content: ""; position: absolute; inset: 0;
    background:
      radial-gradient(circle at 15% 30%, var(--amar) 60px, transparent 62px),
      radial-gradient(circle at 85% 70%, var(--coral) 80px, transparent 82px);
    opacity: .35;
  }
  .vcard > *{ position: relative; z-index: 2; }
  .vcard .ic{
    width: 72px; height: 72px;
    border: 3px solid var(--ink);
    border-radius: 22px;
    background: var(--amar);
    color: var(--ink);
    display: grid; place-items: center;
    box-shadow: 4px 4px 0 var(--ink);
  }
  .vcard h3{ color: #fff; font-size: 1.6rem; }
  .vcard p{ color: rgba(255,255,255,.85); margin-top: .3rem; }
  .vcard .btn{ margin-left: auto; }

  /* ===== Final CTA ===== */
  .final-cta{
    background: var(--coral);
    border: 3px solid var(--ink);
    border-radius: var(--r-xl);
    padding: clamp(2.5rem, 6vw, 5rem);
    display: grid;
    grid-template-columns: 1.1fr .9fr;
    gap: clamp(2rem, 5vw, 3rem);
    align-items: center;
    box-shadow: 12px 12px 0 var(--ink);
    position: relative;
    overflow: hidden;
  }
  .final-cta::before{
    content: "";
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.35) 3px, transparent 4px);
    background-size: 38px 38px;
    pointer-events: none;
  }
  .final-cta > *{ position: relative; z-index: 2; }
  .final-cta h2{ color: #fff; font-size: clamp(2.2rem, 5vw, 3.5rem); }
  .final-cta p{ color: rgba(255,255,255,.95); margin-top: 1rem; font-size: 1.15rem; }
  .final-cta .ctas{ display: flex; gap: .8rem; margin-top: 1.8rem; flex-wrap: wrap; }
  .final-cta-photo{
    aspect-ratio: 1/1;
    border: 3px solid var(--ink);
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 8px 8px 0 var(--ink);
    transform: rotate(4deg);
  }
  .final-cta-photo .photo-fallback{
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--lila);
    color: #fff;
  }
  .final-cta-photo .photo-fallback::before{
    content: ""; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.35) 3px, transparent 4px);
    background-size: 30px 30px;
  }
  .final-cta-photo .photo-fallback svg{ width: 42%; }

  /* ===== Footer ===== */
  footer{
    background: var(--ink);
    color: var(--cream);
    padding: 4rem 0 2rem;
    margin-top: 4rem;
    border-top: 3px solid var(--ink);
  }
  .footer-grid{
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 2rem;
  }
  footer h4{
    color: var(--cream);
    font-family: var(--display);
    font-size: 1.05rem;
    margin-bottom: 1rem;
  }
  footer .brand{ color: var(--cream); font-size: 1.4rem; }
  footer ul{ list-style: none; padding: 0; margin: 0; display: grid; gap: .55rem; }
  footer a{
    color: rgba(255,248,236,.75);
    text-decoration: none;
    font-family: var(--display-2);
    font-weight: 600;
    transition: color .2s var(--ease-soft);
  }
  footer a:hover{ color: var(--amar); }
  .footer-bottom{
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255,248,236,.15);
    display: flex; justify-content: space-between; gap: 1rem;
    flex-wrap: wrap;
    font-size: .9rem;
    color: rgba(255,248,236,.6);
  }

  /* ===== SCALE & ROTATE reveal ===== */
  .sr{
    opacity: 0;
    transform: scale(.55) rotate(var(--sr-rot, -8deg));
    transition: opacity .8s var(--ease-soft), transform .8s var(--ease-spring);
    will-change: transform;
  }
  .sr.in{ opacity: 1; transform: scale(1) rotate(0deg); }
  @keyframes wildSrFallback{
    to{ opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .sr:not(.in){ animation: wildSrFallback 0s ease-out 1.2s forwards; }
  [data-stagger]:not(.in) > *{ animation: wildSrFallback 0s ease-out 1.2s forwards; }
  [data-stagger] > *{
    opacity: 0;
    transform: scale(.6) rotate(-6deg);
    transition: opacity .65s var(--ease-soft), transform .8s var(--ease-spring);
  }
  [data-stagger].in > *{ opacity: 1; transform: scale(1) rotate(0deg); }
  [data-stagger].in > *:nth-child(2n){ transform: scale(1) rotate(.8deg); }
  [data-stagger].in > *:nth-child(1){ transition-delay: 0ms; }
  [data-stagger].in > *:nth-child(2){ transition-delay: 90ms; }
  [data-stagger].in > *:nth-child(3){ transition-delay: 180ms; }
  [data-stagger].in > *:nth-child(4){ transition-delay: 270ms; }
  [data-stagger].in > *:nth-child(5){ transition-delay: 360ms; }
  [data-stagger].in > *:nth-child(6){ transition-delay: 450ms; }
  [data-stagger].in > *:nth-child(7){ transition-delay: 540ms; }

  /* Split-text words */
  .split .w{
    display: inline-block;
    opacity: 0;
    transform: translateY(40%) scale(.6) rotate(-10deg);
    transition: opacity .55s var(--ease-soft), transform .65s var(--ease-spring);
    will-change: transform;
  }
  .split.in .w{ opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  .split.in .w:nth-child(1){ transition-delay: 40ms; }
  .split.in .w:nth-child(2){ transition-delay: 110ms; }
  .split.in .w:nth-child(3){ transition-delay: 180ms; }
  .split.in .w:nth-child(4){ transition-delay: 250ms; }
  .split.in .w:nth-child(5){ transition-delay: 320ms; }
  .split.in .w:nth-child(6){ transition-delay: 390ms; }
  .split.in .w:nth-child(7){ transition-delay: 460ms; }

  /* Reduced motion: kill bouncy stuff */
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .001ms !important;
    }
    body{ transition: none !important; }
    .sr, [data-stagger] > *, .split .w, .pop{ opacity: 1 !important; transform: none !important; }
    .ticker-track{ animation: none !important; }
    .decor{ display: none !important; }
    .hero-photo, .service:nth-child(2n), .about-photo, .reviews, .final-cta-photo, .ticker{ transform: none !important; }
    .sheet, .sheet-inner, .sheet-inner a, .burger span, .burger span::before, .burger span::after{
      transition: none !important;
      animation: none !important;
    }
  }

  /* ===== Responsive ===== */
  @media (max-width: 960px){
    .nav-links{ display: none; }
    .nav-inner{
      gap: .5rem;
      padding: .45rem .55rem .45rem 1rem;
    }
    .brand{
      min-width: 0;
      flex: 1 1 auto;
    }
    #navBrandName{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nav-cta{
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: .65rem;
      flex-shrink: 0;
    }
    .burger{ display: inline-flex; }
    .nav-cta .btn:not(.btn-wa){ display: none; }
    section{
      padding: clamp(2.75rem, 7vw, 4rem) 0;
    }
    .section-head{ margin-bottom: 2rem; }
    .hero{
      padding-top: clamp(5.25rem, 16vw, 6.5rem);
      padding-bottom: clamp(2.5rem, 6vw, 3.5rem);
    }
    .hero-grid{ grid-template-columns: 1fr; }
    .hero-photos{ max-width: min(100%, 380px); }
    .about-grid{ grid-template-columns: 1fr; }
    .about-photo{ max-width: 320px; margin-inline: auto; transform: rotate(-2deg); }
    .gallery{
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: minmax(120px, 26vw);
      gap: 10px;
    }
    .g-item,
    .g-item:nth-child(n){
      grid-column: span 1 !important;
      grid-row: span 1 !important;
      border-radius: var(--r-lg) !important;
      transform: none !important;
    }
    .g-item:nth-child(1){
      grid-column: span 2 !important;
      grid-row: span 2 !important;
    }
    #map{
      height: min(52vh, 300px);
      min-height: min(52vh, 300px);
    }
    .schedule-wrap{ grid-template-columns: 1fr; }
    .contact-grid{ grid-template-columns: 1fr; }
    .final-cta{ grid-template-columns: 1fr; }
    footer{
      margin-top: 2rem;
      padding: 2.5rem 0 1.5rem;
    }
    .footer-grid{
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .footer-bottom{ margin-top: 1.5rem; padding-top: 1.25rem; }
    .vcard{ flex-direction: column; align-items: flex-start; }
    .vcard .btn{ margin-left: 0; }
    .ticker{
      margin: 1rem 0;
      transform: none;
      max-width: 100%;
    }
    .ticker-item{ font-size: 1.15rem; }
    /* Mobile: contenido visible sin depender del scroll-reveal */
    .sr, [data-stagger] > *, .split .w, .pop{
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    [data-stagger] > *{ transition: none; }
    .service:nth-child(2n), .reviews, .final-cta-photo, .about-photo, .hp-1, .hp-2, .hp-3{
      transform: rotate(0deg);
    }
    .hp-1{ transform: rotate(-4deg); }
    .hp-2{ transform: rotate(4deg); }
    .hp-3{ transform: rotate(-6deg); }
    .decor{ display: none; }
  }
  @media (max-width: 540px){
    .container{ width: min(100% - 24px, var(--container)); }
    section{ padding: 2.5rem 0; }
    .footer-grid{ grid-template-columns: 1fr; }
    .about-stats{ grid-template-columns: 1fr; }
    h1{ font-size: clamp(2.2rem, 11vw, 3.4rem); }
    .gallery{ grid-auto-rows: minmax(100px, 22vw); }
    #map{
      height: min(48vh, 260px);
      min-height: min(48vh, 260px);
    }
  }
</style>
@endverbatim

@endpush

@section('content')

<!-- 1. NAV -->
<header class="nav" role="banner">
  <div class="nav-inner">
    <a href="#top" class="brand" id="navBrandWrap" aria-label="Inicio">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span class="brand-mark" id="navBrandMark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg>
      </span>
      <span id="navBrandName">{{ $nombre }}</span>
    </a>
    <nav class="nav-links" aria-label="Principal">
      <a href="#servicios" id="tplNavServicios" style="display:none">Servicios</a>
      <a href="#sobre-nosotros">Nosotros</a>
      <a href="#galeria" id="tplNavGaleria">Galería</a>
      <a href="#horario">Horario</a>
      <a href="#opiniones" id="tplNavOpiniones" style="display:none">Opiniones</a>
      <a href="#contacto">Contacto</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-wa btn-sm" href="https://wa.me/{{ $whatsapp }}" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z"/></svg>
        WhatsApp
      </a>
      <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="sheet">
        <span></span>
      </button>
    </div>
  </div>
</header>

<div class="sheet" id="sheet" role="dialog" aria-label="Menú" aria-modal="true">
  <div class="sheet-inner">
    <button class="sheet-close" aria-label="Cerrar menú" id="sheetClose">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M6 18L18 6"/></svg>
    </button>
    <nav aria-label="Menú móvil">
      <a href="#servicios" id="tplNavServiciosMobile" style="display:none">Servicios</a>
      <a href="#sobre-nosotros">Nosotros</a>
      <a href="#galeria">Galería</a>
      <a href="#horario">Horario</a>
      <a href="#opiniones" id="tplNavOpinionesMobile" style="display:none">Opiniones</a>
      <a href="#contacto">Contacto</a>
    </nav>
  </div>
</div>

<main id="top">

<!-- 2. HERO -->
<section class="hero" id="hero" data-bg="cream" aria-labelledby="hero-title">
  <span class="decor blob" data-parallax="0.3" style="top:18%; left:-3%; width:120px; height:120px; background: var(--lima);" aria-hidden="true"></span>
  <span class="decor dot-pattern" data-parallax="0.2" style="top:60%; right:42%;" aria-hidden="true"></span>
  <span class="decor squig" data-parallax="0.5" style="top:10%; right:8%;" aria-hidden="true"></span>

  <div class="container hero-grid">
    <div>
      <span class="pill is-open sr" style="--sr-rot:-4deg;" id="heroStatus" role="status" aria-live="polite">
        <span class="dot" aria-hidden="true"></span>
        <span id="heroStatusLabel">Abierto ahora</span>
      </span>
      <h1 id="heroTitle" class="split"><span class="w w-1">{{ $nombre ?: 'Tu' }}</span> <span class="w w-2">mascota</span><br><span class="w w-3">lo va</span> <span class="w w-4">a</span> <span class="w w-5">pasar</span> <span class="w w-6">genial.</span></h1>
      <p class="hero-lede sr" id="heroTagline" style="--sr-rot:0deg;">Tagline corto y divertido que explique a quién cuidas y qué hace especial a tu negocio. Con energía y personalidad.</p>
      <div class="hero-cta sr" style="--sr-rot:0deg;">
        <a class="btn btn-primary" href="#contacto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Reservar cita
        </a>
        <a class="btn btn-amar" href="tel:+00000000000">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>
          Llamar ahora
        </a>
      </div>
      <div class="hero-meta sr">
        <span class="stars" aria-hidden="true">★★★★★</span>
        <span>Cuidamos con cariño · Atención cercana</span>
      </div>
    </div>

    <div class="hero-photos">
      <span class="star-shape star-1" aria-hidden="true"></span>
      <span class="star-shape star-2" aria-hidden="true"></span>

      <div class="hero-photo hp-1 sr" id="hp1" style="--sr-rot:-12deg;" aria-label="Foto principal"><div class="photo-fallback" id="hp1Img" role="img" @if($portada) style="background-image:url('{{ $portada }}')" class="has-photo" @endif></div></div>
      <div class="hero-photo hp-2 sr" id="hp2" style="--sr-rot:14deg;" aria-label="Foto secundaria"><div class="photo-fallback" id="hp2Img" role="img" @if($portada_2) style="background-image:url('{{ $portada_2 }}')" class="has-photo" @endif></div></div>
      <div class="hero-photo hp-3 sr" id="hp3" style="--sr-rot:-18deg;" aria-label="Foto secundaria"><div class="photo-fallback" id="hp3Img" role="img" @if($portada_3) style="background-image:url('{{ $portada_3 }}')" class="has-photo" @endif></div></div>
    </div>
  </div>
</section>

<!-- 3. TICKER -->
<section class="ticker" aria-label="Mensajes destacados" style="padding: 0;">
  <div class="ticker-track" id="ticker">
    <span class="ticker-item"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg> Mascotas felices</span>
    <span class="ticker-item">★ Energía positiva</span>
    <span class="ticker-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z"/></svg> Cuidado con cariño</span>
    <span class="ticker-item">★ Diversión asegurada</span>
    <span class="ticker-item">Trato cercano</span>
    <span class="ticker-item">★ Profesionales</span>
  </div>
</section>

<!-- 4. SERVICIOS -->
<section id="servicios" data-bg="lila-soft" aria-labelledby="serv-title" style="display:none;">
  <span class="decor dot-pattern" data-parallax="0.3" style="top:8%; right:5%;" aria-hidden="true"></span>
  <span class="decor blob" data-parallax="0.4" style="bottom:5%; left:-3%; width:160px; height:160px; background: var(--amar); border:3px solid var(--ink);" aria-hidden="true"></span>
  <div class="container">
    <div class="section-head sr">
      <span class="eyebrow">Servicios</span>
      <h2>Lo que hacemos por tu peque</h2>
      <p>Edita esta lista o duplica las tarjetas con los servicios que ofreces. Cada tarjeta admite nombre, descripción y precio.</p>
    </div>
    <div class="services-grid" data-stagger id="tplServicesList">

@foreach($services as $service)
    <article class="service">
      <div class="service-icon" aria-hidden="true">🐾</div>
      <h3>{{ $service['name'] }}</h3>
      @if(!empty($service['description']))<p>{{ $service['description'] }}</p>@endif
      <div class="price">
        <small>Desde</small>
        <strong class="num">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 2, ',', '.') }} €
        @else
        Consultar
        @endif
        </strong>
      </div>
    </article>
@endforeach
    </div>
  </div>
</section>

<!-- 5. ABOUT -->
<section id="sobre-nosotros" data-bg="lima-soft" aria-labelledby="about-title">
  <span class="decor squig" data-parallax="0.4" style="top:12%; right:6%;" aria-hidden="true"></span>
  <span class="decor blob" data-parallax="0.3" style="bottom:8%; left:-4%; width:140px; height:140px; background: var(--coral); border:3px solid var(--ink);" aria-hidden="true"></span>
  <div class="container">
    <div class="about-grid about">
      <div class="about-photo sr @if($foto_equipo) has-photo @endif" id="aboutPhotoWrap" style="--sr-rot:-15deg;">
        <div class="photo-fallback" id="aboutPhotoImg" role="img" aria-label="Foto del equipo" @if($foto_equipo) style="background-image:url('{{ $foto_equipo }}')" class="has-photo" @endif>
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>
        </div>
      </div>
      <div>
        <span class="eyebrow sr">Sobre nosotros</span>
        <h2 class="sr" id="aboutTitle" style="--sr-rot:-2deg;">Personas (un poco locas) que aman a los animales</h2>
        <p class="sr" id="aboutDescripcion">{{ $descripcion }}</p>
        <div class="about-stats num" data-stagger>
          <a class="about-stat" href="#" id="aboutStatWhatsapp" @if(empty($whatsapp) && empty($telefono)) hidden @endif>
            <div class="n num" id="aboutStatPhoneVal">{{ $whatsapp ?: $telefono }}</div>
            <div class="l">WhatsApp</div>
          </a>
          <a class="about-stat" href="@if($correo)mailto:{{ $correo }}@else#@endif" id="aboutStatEmail" @if(empty($correo)) hidden @endif>
            <div class="n" id="aboutStatEmailVal">{{ $correo }}</div>
            <div class="l">Correo</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 6. GALERÍA -->
<section id="galeria" data-bg="coral-soft" aria-labelledby="gal-title">
  <span class="decor dot-pattern" data-parallax="0.25" style="top:6%; left:-2%;" aria-hidden="true"></span>
  <span class="decor squig" data-parallax="0.45" style="bottom:8%; right:5%;" aria-hidden="true"></span>
  <div class="container">
    <div class="section-head sr">
      <span class="eyebrow">Galería</span>
      <h2>Caras felices en cada foto</h2>
    </div>
        <div class="gallery" data-stagger id="galleryLive">
@php
  $wildDemoGallery = [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=700&q=75',
  ];
@endphp
@forelse(($galeria ?? []) as $imgUrl)
    <div class="g-item has-photo"><img class="g-photo" src="{{ $imgUrl }}" alt="" loading="lazy" decoding="async"></div>
@empty
@foreach($wildDemoGallery as $imgUrl)
    <div class="g-item has-photo"><img class="g-photo" src="{{ $imgUrl }}" alt="" loading="lazy" decoding="async"></div>
@endforeach
@endforelse
    </div>
  </div>
</section>

<!-- 7. HORARIO -->
<section id="horario" data-bg="amar-soft" aria-labelledby="sched-title">
  <span class="decor blob" data-parallax="0.35" style="top:5%; right:-3%; width:140px; height:140px; background: var(--sky); border:3px solid var(--ink);" aria-hidden="true"></span>
  <div class="container">
    <div class="section-head sr">
      <span class="eyebrow">Horario</span>
      <h2>Cuándo puedes pasarte</h2>
    </div>
    <div class="schedule-wrap">
      <div class="schedule sr" id="schedule" style="--sr-rot:-1deg;" aria-label="Horario semanal">
@php
  $scheduleDays = [
    ['mon', 'Lunes'],
    ['tue', 'Martes'],
    ['wed', 'Miércoles'],
    ['thu', 'Jueves'],
    ['fri', 'Viernes'],
    ['sat', 'Sábado'],
    ['sun', 'Domingo'],
  ];
  $todayIdx = ((int) now()->dayOfWeek + 6) % 7;
@endphp
@foreach($scheduleDays as $i => [$key, $full])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
@endphp
        <div class="schedule-row{{ $i === $todayIdx ? ' is-today' : '' }}{{ $closed ? ' is-closed' : '' }}">
          <span class="day">{{ $full }}</span>
          <span class="hours num">@if($open){{ $row['open'] }} – {{ $row['close'] }}@else Cerrado @endif</span>
        </div>
@endforeach
      </div>
      <aside class="schedule-side sr" style="--sr-rot:1deg;" aria-label="Estado actual">
        <span class="pill is-open" id="sideStatus">
          <span class="dot" aria-hidden="true"></span>
          <span id="sideStatusLabel">Abierto ahora</span>
        </span>
        <h3 id="sideStatusTitle">Estamos abiertos</h3>
        <p id="sideStatusText">Pasa a vernos o reserva tu cita. Te esperamos con ganas.</p>
        <a class="btn btn-amar" href="#contacto">Reservar ahora</a>
      </aside>
    </div>
  </div>
</section>

<!-- 8. CONTACTO -->
<section id="contacto" data-bg="sky-soft" aria-labelledby="contact-title">
  <span class="decor squig" data-parallax="0.5" style="top:10%; left:5%;" aria-hidden="true"></span>
  <div class="container">
    <div class="section-head sr">
      <span class="eyebrow">Contacto</span>
      <h2>Hablemos pronto</h2>
      <p>Llámanos, escríbenos o pásate sin compromiso. Respondemos rapidísimo.</p>
    </div>
    <div class="contact-grid" data-stagger>
      <a class="contact-card" href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" id="tplContactPhone" data-tel-link @if(empty($telefono) && empty($whatsapp)) style="display:none" @endif>
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="24" height="24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg></div>
        <div class="label">Llámanos</div>
        <div class="value num" id="tplContactPhoneVal" data-phone-display>{{ $telefono }}</div>
      </a>
      <a class="contact-card" href="mailto:" id="tplContactEmail" @if(empty($correo)) style="display:none" @endif>
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="24" height="24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/></svg></div>
        <div class="label">Escríbenos</div>
        <div class="value" id="tplContactEmailVal">{{ $correo }}</div>
      </a>
      <a class="contact-card" href="#" id="tplContactAddress" @if(empty($direccion)) style="display:none" @endif>
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <div class="label">Visítanos</div>
        <div class="value" id="tplContactAddressVal">{{ $direccion }}</div>
      </a>
    </div>
  </div>
</section>

<!-- 9. MAPA -->
<section data-bg="cream" aria-labelledby="map-title">
  <div class="container">
    <div class="section-head sr">
      <span class="eyebrow">Cómo llegar</span>
      <h2>Aquí nos tienes</h2>
    </div>
    <div id="map" role="application" aria-label="Mapa de ubicación"></div>
    <div class="map-directions" id="mapDirectionsRow">
      @php
        $wildMapsUrl = $google_maps_url ?? null;
        if (empty($wildMapsUrl) && is_numeric($map_lat) && is_numeric($map_lon)) {
          $wildMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' . $map_lat . ',' . $map_lon;
        } elseif (empty($wildMapsUrl) && !empty($direccion)) {
          $wildMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($direccion);
        } else {
          $wildMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=40.4168,-3.7038';
        }
      @endphp
      <a href="{{ $wildMapsUrl }}" id="tplMapsExternalLink" class="btn btn-amar" target="_blank" rel="noopener noreferrer">Abrir en Google Maps →</a>
    </div>
  </div>
</section>

<!-- 10. OPINIONES -->
<section id="opiniones" data-bg="cream" aria-labelledby="rev-title" style="display:none;">
  <div class="container">
    <div class="reviews sr" style="--sr-rot:-3deg;">
      <div class="stars" aria-hidden="true">★★★★★</div>
      <span class="eyebrow" style="margin-top:1.2rem; background: var(--paper);">Opiniones</span>
      <h2>La gente habla de nosotros</h2>
      <p>Las opiniones reales viven en Google. Pulsa el botón y lee qué cuentan las familias que ya confían en nosotros.</p>
      <a class="btn btn-primary" href="#" id="tplGbizLink" rel="noopener" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4A10.4 10.4 0 0 0 22 12.2zM12 22a10 10 0 0 0 6.9-2.5l-3.4-2.6a6.2 6.2 0 0 1-9.3-3.3H2.7v2.6A10 10 0 0 0 12 22zM5.7 13.6a6 6 0 0 1 0-3.8V7.2H2.7a10 10 0 0 0 0 9.6l3-2.3v-.9zM12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.9A10 10 0 0 0 2.7 7.2l3 2.3A6 6 0 0 1 12 6z"/></svg>
        Ver opiniones en Google
      </a>
    </div>
  </div>
</section>

<!-- 11. VCARD -->
<section data-bg="cream" aria-labelledby="vcard-title" id="tplVcardWrap" style="display:none;">
  <div class="container">
    <div class="vcard sr" style="--sr-rot:-1deg;">
      <div class="ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="32" height="32"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3h5v18h-5"/></svg>
      </div>
      <div>
        <h3 id="vcard-title">Guarda nuestros datos</h3>
        <p>Descarga la tarjeta de contacto y tenla siempre a mano.</p>
      </div>
      <a class="btn btn-amar" href="#" id="tplVcardLink">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
        Descargar vCard
      </a>
    </div>
  </div>
</section>

<!-- 12. CTA FINAL -->
<section data-bg="cream" aria-labelledby="final-title">
  <span class="decor squig" data-parallax="0.4" style="top:15%; left:5%;" aria-hidden="true"></span>
  <div class="container">
    <div class="final-cta sr" style="--sr-rot:-1deg;">
      <div>
        <span class="eyebrow" style="background:#fff;">Reserva</span>
        <h2>¿Le damos diversión <br>a tu mascota?</h2>
        <p>Reserva tu cita en menos de un minuto. Te confirmamos disponibilidad enseguida.</p>
        <div class="ctas">
          <a class="btn btn-amar" href="https://wa.me/{{ $whatsapp }}" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5z"/></svg>
            Reservar por WhatsApp
          </a>
          <a class="btn" href="tel:+00000000000">Llamar ahora</a>
        </div>
      </div>
      <div class="final-cta-photo @if($foto_equipo) has-photo @endif" id="finalCtaPhotoWrap">
        <div class="photo-fallback" id="finalCtaPhotoImg" role="img" aria-label="Foto del equipo" @if($foto_equipo) style="background-image:url('{{ $foto_equipo }}')" class="has-photo" @endif>
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="11" r="2.4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 4-4s3 1.5 3 3.5"/></svg>
        </div>
      </div>
    </div>
  </div>
</section>

</main>

<!-- 13. FOOTER -->
<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="#top" class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg>
          </span>
          <span id="footBrand">{{ $nombre }}</span>
        </a>
        <p id="footTagline" style="margin-top: 1rem; color: rgba(255,248,236,.75); max-width: 36ch;">{{ $tagline ?: $descripcion }}</p>
      </div>
      <div>
        <h4>Navega</h4>
        <ul>
          <li><a href="#servicios" id="footNavServicios" style="display:none">Servicios</a></li>
          <li><a href="#sobre-nosotros">Nosotros</a></li>
          <li><a href="#galeria">Galería</a></li>
          <li><a href="#horario">Horario</a></li>
          <li><a href="#opiniones" id="footNavOpiniones" style="display:none">Opiniones</a></li>
        </ul>
      </div>
      <div>
        <h4>Contacto</h4>
        <ul>
          <li id="footPhoneRow" @if(empty($telefono) && empty($whatsapp)) hidden @endif><a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><span data-phone-display>{{ $telefono }}</span></a></li>
          <li id="footEmailRow" @if(empty($correo)) hidden @endif><a id="footEmailLink" href="{{ $correo ? 'mailto:'.$correo : '#' }}"><span id="footEmailDisplay">{{ $correo }}</span></a></li>
          <li id="footAddressRow" @if(empty($direccion) && empty($ciudad)) hidden @endif><a href="#" id="footAddressLink"><span id="footAddressText">@if($direccion && $ciudad){{ $direccion }} · {{ $ciudad }}@elseif($direccion){{ $direccion }}@else{{ $ciudad }}@endif</span></a></li>
        </ul>
      </div>
      <div>
        <h4>Síguenos</h4>
        <ul>
          <li id="footSocialInstagramRow" @if(empty($instagram_url)) hidden @endif><a href="{{ $instagram_url ?: '#' }}" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li id="footSocialTiktokRow" @if(empty($tiktok_url)) hidden @endif><a href="{{ $tiktok_url ?: '#' }}" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer">TikTok</a></li>
          <li id="footGbizRow" @if(empty($google_business_url)) hidden @endif><a href="{{ $google_business_url ?: '#' }}" id="footGbizLink" target="_blank" rel="noopener noreferrer">Google Business</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span id="footBottomBrand">© <span id="year"></span> · {{ $nombre }} · Todos los derechos reservados</span>
      <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
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
(function(){
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== Mobile menu ===== */
  const burger = document.getElementById('burger');
  const sheet  = document.getElementById('sheet');
  const sheetClose = document.getElementById('sheetClose');
  const openSheet  = () => {
    sheet.classList.add('open');
    burger.setAttribute('aria-expanded','true');
    burger.setAttribute('aria-label','Cerrar menú');
    document.body.classList.add('nav-sheet-open');
  };
  const closeSheet = () => {
    sheet.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-label','Abrir menú');
    document.body.classList.remove('nav-sheet-open');
  };
  burger.addEventListener('click', () => {
    if (sheet.classList.contains('open')) closeSheet();
    else openSheet();
  });
  sheetClose.addEventListener('click', closeSheet);
  sheet.addEventListener('click', e => { if(e.target === sheet) closeSheet(); });
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeSheet(); });

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wildRevealIO = null;

  function wildObserveNode(el) {
    if (!el) return;
    if (REDUCED || !wildRevealIO) {
      el.classList.add('in');
      el.querySelectorAll('.pop').forEach(function (p) { p.classList.add('in'); });
      return;
    }
    wildRevealIO.observe(el);
  }

  window.wildObserveReveals = function (root) {
    var scope = root || document;
    scope.querySelectorAll('.sr:not(.in), [data-stagger]:not(.in), .split:not(.in), .pop:not(.in)').forEach(wildObserveNode);
  };

  /* ===== Scale & rotate reveal ===== */
  var wildMobile = window.matchMedia('(max-width: 960px)').matches;
  if(!REDUCED && !wildMobile && 'IntersectionObserver' in window){
    wildRevealIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if(en.isIntersecting){
          en.target.classList.add('in');
          en.target.querySelectorAll('.pop').forEach((el,i) => {
            setTimeout(() => el.classList.add('in'), 80 + i*120);
          });
          wildRevealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    window.wildObserveReveals(document);
  } else {
    document.querySelectorAll('.sr, [data-stagger], .split, .pop').forEach(el => el.classList.add('in'));
  }

  window.tvAnimationsRefresh = function () {
    window.wildObserveReveals(document);
  };

  /* ===== Split-text wrap (already split in markup via .w) ===== */
  // (Words already pre-wrapped in HTML; nothing to do here.)

  /* ===== Section background color cinético ===== */
  const SECTION_BGS = {
    'cream':       '#fff8ec',
    'lila-soft':   '#ede4ff',
    'lima-soft':   '#e6f6c8',
    'coral-soft':  '#ffe1e6',
    'amar-soft':   '#fff2c0',
    'sky-soft':    '#d6f0ff'
  };
  const sections = Array.from(document.querySelectorAll('section[data-bg]'));
  if(!REDUCED && sections.length){
    const bgIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if(en.isIntersecting && en.intersectionRatio > 0.3){
          const k = en.target.getAttribute('data-bg');
          if(SECTION_BGS[k]) document.body.style.backgroundColor = SECTION_BGS[k];
        }
      });
    }, { threshold: [0.3, 0.6] });
    sections.forEach(s => bgIO.observe(s));
  }

  /* ===== Parallax bounce for decor (rAF) ===== */
  const decor = Array.from(document.querySelectorAll('[data-parallax]'));
  if(!REDUCED && !wildMobile && decor.length){
    let raf = null;
    let targetY = window.scrollY;
    function tick(){
      const y = window.scrollY;
      decor.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax') || '0.3');
        const r = el.getBoundingClientRect();
        const center = r.top + r.height/2 + y;
        const dist = (y + window.innerHeight/2 - center);
        // bouncy sin offset
        const offset = dist * speed;
        const bounce = Math.sin((y + center) * 0.005) * 6;
        const rot = Math.sin((y * 0.002) + center * 0.001) * 8;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) translateY(${bounce.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
      });
      raf = null;
    }
    window.addEventListener('scroll', () => {
      if(raf == null) raf = requestAnimationFrame(tick);
    }, { passive: true });
    tick();
  }

  /* ===== Ticker duplicate ===== */
  const ticker = document.getElementById('ticker');
  if(ticker) ticker.innerHTML += ticker.innerHTML;
})();
</script>
<script>
/**
 * Aplica teléfono y enlaces WhatsApp en plantillas HTML (iframe público / onboarding).
 * - Actualiza [data-wa-link], cualquier <a href*="wa.me"> y placeholders {{ $whatsapp }}
 * - Abre WhatsApp en nueva pestaña (necesario dentro del iframe del SPA)
 */
(function (global) {
  function digitsFrom(raw, key) {
    if (!raw || raw[key] == null) return '';
    return String(raw[key]).replace(/\D/g, '');
  }

  function resolvePhone(raw) {
    raw = raw || {};
    var phoneRaw = raw.telefono != null ? String(raw.telefono).trim() : '';
    var phoneWa = phoneRaw.replace(/\D/g, '');
    if (!phoneWa) {
      phoneWa = digitsFrom(raw, 'whatsapp');
    }
    return { phoneRaw: phoneRaw, phoneWa: phoneWa };
  }

  function applyContactLinks(raw) {
    var phones = resolvePhone(raw);
    var phoneRaw = phones.phoneRaw;
    var phoneWa = phones.phoneWa;
    var waUrl = phoneWa ? 'https://wa.me/' + phoneWa : 'https://wa.me/';
    var telHref = phoneWa ? 'tel:+' + phoneWa : 'tel:';

    document
      .querySelectorAll('a[data-wa-link], a[href*="wa.me"], a[href*="{{ $whatsapp }}"]')
      .forEach(function (el) {
        if (!(el instanceof HTMLAnchorElement)) return;
        el.href = waUrl;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      });

    document.querySelectorAll('[data-tel-link]').forEach(function (el) {
      if (!(el instanceof HTMLAnchorElement)) return;
      el.href = telHref;
    });

    document.querySelectorAll('[data-phone-display]').forEach(function (el) {
      el.textContent = phoneRaw || 'Tu teléfono';
    });

    bindContactClickTracking();
  }

  function bindContactClickTracking() {
    function bindOnce(el, kind) {
      if (!(el instanceof HTMLAnchorElement)) return;
      if (el.dataset.lwTrackBound === '1') return;
      el.dataset.lwTrackBound = '1';
      el.addEventListener('click', function () {
        try {
          window.parent.postMessage({ type: 'lw:track-click', kind: kind }, '*');
        } catch (_) {
          /* ignore */
        }
      });
    }

    document
      .querySelectorAll('a[data-wa-link], a[href*="wa.me"], a[href*="{{ $whatsapp }}"]')
      .forEach(function (el) {
        bindOnce(el, 'whatsapp_click');
      });

    document.querySelectorAll('[data-tel-link]').forEach(function (el) {
      bindOnce(el, 'phone_click');
    });
  }

  global.lwApplyContactLinks = applyContactLinks;
})(typeof window !== 'undefined' ? window : globalThis);

</script>
<script>
/* ONEZ data bridge for wild-pet.html — preview, onboarding, tenant payload */
(function () {
  'use strict';

  (function initWildPreviewModeClasses() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1' || window.self !== window.top) {
      document.documentElement.classList.add('embed-preview-root');
      document.body.classList.add('embed-preview');
    }
    if (params.get('preview') === '1' || params.get('thumb') === '1') {
      document.body.classList.add('wild-preview');
    }
  })();

  var WILD_SCHEDULE_DEFAULT = [
    { day: 'Lunes', open: '09:00', close: '20:00' },
    { day: 'Martes', open: '09:00', close: '20:00' },
    { day: 'Miércoles', open: '09:00', close: '20:00' },
    { day: 'Jueves', open: '09:00', close: '20:00' },
    { day: 'Viernes', open: '09:00', close: '20:00' },
    { day: 'Sábado', open: '10:00', close: '14:00' },
    { day: 'Domingo', open: null, close: null },
  ];
  var WILD_SCHEDULE = WILD_SCHEDULE_DEFAULT.map(function (r) {
    return { day: r.day, open: r.open, close: r.close };
  });

  var WILD_SERVICE_ICONS = {
    paw: '<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    sparkle:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
    bone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M7 4a2.5 2.5 0 1 0-3 4 2.5 2.5 0 0 0 1 4l9 9a2.5 2.5 0 0 0 4-1 2.5 2.5 0 1 0-4-3l-7-7a2.5 2.5 0 0 0-3-4"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="26" height="26"><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4.5L6 22l1.5-8.5L2 9h7z"/></svg>',
  };
  var WILD_ICON_KEYS = ['paw', 'heart', 'sparkle', 'bone', 'home', 'star'];

  /** Mascotas — muestras Unsplash para onboarding / preview (URLs verificadas, sin repetir entre slots) */
  var WILD_PREVIEW_SAMPLE = {
    portada: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80',
    portada_2: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80',
    portada_3: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=80',
    foto_equipo: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=80',
  };
  var WILD_DEFAULT_GALLERY_URLS = [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=900&q=75',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=700&q=75',
    'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=700&q=75',
  ];
  var WILD_PREVIEW_COPY = {
    tagline: 'Cuidamos a tu mascota con energía, cariño y mucha diversión.',
    descripcion:
      'Somos un equipo apasionado por los animales: peluquería canina, guardería y paseos con trato cercano y profesional.',
    ciudad: 'Madrid',
  };

  var wildPreviewMap = null;
  var wildPreviewMarker = null;
  var WILD_MAP_ZOOM = 15;
  var WILD_DEFAULT_MAP_LAT = 40.4168;
  var WILD_DEFAULT_MAP_LON = -3.7038;

  function resolveWildMapCoords(raw) {
    raw = raw || {};
    var lat = raw.map_lat != null ? raw.map_lat : window.__lwLat;
    var lon = raw.map_lon != null ? raw.map_lon : window.__lwLon;
    var latN = typeof lat === 'number' ? lat : parseFloat(lat);
    var lonN = typeof lon === 'number' ? lon : parseFloat(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN)) {
      latN = WILD_DEFAULT_MAP_LAT;
      lonN = WILD_DEFAULT_MAP_LON;
    }
    return { lat: latN, lon: lonN };
  }

  function whenWildLeafletReady(fn) {
    if (window.__LW_SKIP_LEAFLET) return;
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(fn);
      return;
    }
    if (typeof L !== 'undefined') {
      fn();
      return;
    }
    var tries = 0;
    (function wait() {
      if (typeof L !== 'undefined') {
        fn();
        return;
      }
      if (++tries < 200) setTimeout(wait, 50);
    })();
  }

  function shouldUseWildSampleMedia() {
    return (
      document.body.classList.contains('embed-preview') ||
      document.body.classList.contains('wild-preview')
    );
  }

  function wildResolvePreviewPhotoSrc(userSrc, sampleKey) {
    var src = userSrc ? String(userSrc).trim() : '';
    if (src) return src;
    if (!shouldUseWildSampleMedia()) return '';
    return WILD_PREVIEW_SAMPLE[sampleKey] || '';
  }

  function escapeWildHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeWildAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function formatWildPrice(p) {
    if (p === null || p === undefined || p === '') return 'Consultar';
    var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
    if (!Number.isFinite(n)) return 'Consultar';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  function wildDayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function syncWildScheduleFromPreview(h) {
    if (h == null || typeof h !== 'object') {
      WILD_SCHEDULE = WILD_SCHEDULE_DEFAULT.map(function (r) {
        return { day: r.day, open: r.open, close: r.close };
      });
      return;
    }
    var map = [
      ['mon', 'Lunes'],
      ['tue', 'Martes'],
      ['wed', 'Miércoles'],
      ['thu', 'Jueves'],
      ['fri', 'Viernes'],
      ['sat', 'Sábado'],
      ['sun', 'Domingo'],
    ];
    WILD_SCHEDULE = map.map(function (t) {
      var row = h[t[0]];
      if (!row || row.closed) return { day: t[1], open: null, close: null };
      return { day: t[1], open: row.open || '09:00', close: row.close || '20:00' };
    });
  }

  function renderWildSchedule() {
    var schedEl = document.getElementById('schedule');
    if (!schedEl) return;
    var today = wildDayIndex(new Date().getDay());
    schedEl.innerHTML = WILD_SCHEDULE.map(function (row, i) {
      var closed = !row.open;
      return (
        '<div class="schedule-row ' +
        (i === today ? 'is-today' : '') +
        ' ' +
        (closed ? 'is-closed' : '') +
        '">' +
        '<span class="day">' +
        escapeWildHtml(row.day) +
        '</span>' +
        '<span class="hours num">' +
        (closed ? 'Cerrado' : escapeWildHtml(row.open + ' – ' + row.close)) +
        '</span></div>'
      );
    }).join('');
    applyWildOpenStatus();
  }

  function wildToMin(h) {
    var parts = h.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  function applyWildOpenStatus() {
    var idx = wildDayIndex(new Date().getDay());
    var row = WILD_SCHEDULE[idx];
    var cur = new Date().getHours() * 60 + new Date().getMinutes();
    var open = false;
    var text = 'Cerrado hoy';
    var sub = 'Vuelve mañana o escríbenos.';
    if (row && row.open) {
      var o = wildToMin(row.open);
      var c = wildToMin(row.close);
      if (cur >= o && cur < c) {
        open = true;
        text = 'Abierto · cierra a las ' + row.close;
        sub = 'Pasa a vernos o reserva tu cita.';
      } else if (cur < o) {
        text = 'Abrimos a las ' + row.open;
        sub = 'Te atendemos en cuanto abramos.';
      } else {
        text = 'Cerrado por hoy';
        sub = 'Escríbenos, te atendemos mañana.';
      }
    }
    [['heroStatus', 'heroStatusLabel'], ['sideStatus', 'sideStatusLabel']].forEach(function (pair) {
      var pill = document.getElementById(pair[0]);
      var lbl = document.getElementById(pair[1]);
      if (!pill || !lbl) return;
      pill.classList.toggle('is-open', open);
      pill.classList.toggle('is-closed', !open);
      lbl.textContent = text;
    });
    var t = document.getElementById('sideStatusTitle');
    var x = document.getElementById('sideStatusText');
    if (t) t.textContent = open ? 'Estamos abiertos' : 'Ahora cerrado';
    if (x) x.textContent = sub;
  }

  function setWildPhotoSlot(slotId, imgId, src) {
    var slot = document.getElementById(slotId);
    var img = document.getElementById(imgId);
    if (!slot || !img) return;
    var s = src ? String(src).trim() : '';
    if (s) {
      img.style.backgroundImage = 'url("' + escapeWildAttr(s) + '")';
      slot.classList.add('has-photo');
    } else {
      if (!shouldUseWildSampleMedia() && slot.classList.contains('has-photo')) return;
      img.style.backgroundImage = '';
      slot.classList.remove('has-photo');
    }
  }

  function updateWildHeroPhotos(raw) {
    raw = raw || {};
    var hasP1 = Object.prototype.hasOwnProperty.call(raw, 'portada');
    var hasP2 = Object.prototype.hasOwnProperty.call(raw, 'portada_2');
    var hasP3 = Object.prototype.hasOwnProperty.call(raw, 'portada_3');
    if (!hasP1 && !hasP2 && !hasP3 && !shouldUseWildSampleMedia()) return;
    setWildPhotoSlot(
      'hp1',
      'hp1Img',
      hasP1 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada, 'portada') : '',
    );
    setWildPhotoSlot(
      'hp2',
      'hp2Img',
      hasP2 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada_2, 'portada_2') : '',
    );
    setWildPhotoSlot(
      'hp3',
      'hp3Img',
      hasP3 || shouldUseWildSampleMedia() ? wildResolvePreviewPhotoSrc(raw.portada_3, 'portada_3') : '',
    );
  }

  function setWildTeamPhotoSlot(wrap, img, src) {
    if (!wrap || !img) return;
    var s = src ? String(src).trim() : '';
    if (s) {
      img.style.backgroundImage = 'url("' + escapeWildAttr(s) + '")';
      wrap.classList.add('has-photo');
      img.classList.add('has-photo');
    } else {
      if (!shouldUseWildSampleMedia() && wrap.classList.contains('has-photo')) return;
      img.style.backgroundImage = '';
      wrap.classList.remove('has-photo');
      img.classList.remove('has-photo');
    }
  }

  function updateWildAboutPhoto(raw) {
    raw = raw || {};
    var hasFoto = Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
    var src =
      hasFoto || shouldUseWildSampleMedia()
        ? wildResolvePreviewPhotoSrc(raw.foto_equipo, 'foto_equipo')
        : '';
    setWildTeamPhotoSlot(document.getElementById('aboutPhotoWrap'), document.getElementById('aboutPhotoImg'), src);
    setWildTeamPhotoSlot(
      document.getElementById('finalCtaPhotoWrap'),
      document.getElementById('finalCtaPhotoImg'),
      src,
    );
  }

  function syncWildAboutContact(raw) {
    raw = raw || {};
    var phone = String(
      raw.whatsapp != null && String(raw.whatsapp).trim() !== ''
        ? raw.whatsapp
        : raw.telefono != null
          ? raw.telefono
          : '',
    ).trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var waLink = document.getElementById('aboutStatWhatsapp');
    var phoneVal = document.getElementById('aboutStatPhoneVal');
    if (waLink && phoneVal) {
      if (phone) {
        phoneVal.textContent = phone;
        var digits = phone.replace(/\D/g, '');
        waLink.href =
          raw.whatsapp != null && String(raw.whatsapp).trim() !== ''
            ? 'https://wa.me/' + digits
            : 'tel:+' + digits;
        waLink.hidden = false;
        waLink.removeAttribute('hidden');
      } else {
        waLink.hidden = true;
        phoneVal.textContent = '';
      }
    }
    var emailLink = document.getElementById('aboutStatEmail');
    var emailVal = document.getElementById('aboutStatEmailVal');
    if (emailLink && emailVal) {
      if (email) {
        emailVal.textContent = email;
        emailLink.href = 'mailto:' + email;
        emailLink.hidden = false;
        emailLink.removeAttribute('hidden');
      } else {
        emailLink.hidden = true;
        emailVal.textContent = '';
      }
    }
  }

  function renderWildGallery(urls) {
    var root = document.getElementById('galleryLive');
    var navGal = document.getElementById('tplNavGaleria');
    if (!root) return;
    var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (list.length === 0 && shouldUseWildSampleMedia()) {
      list = WILD_DEFAULT_GALLERY_URLS.slice();
    }
    if (list.length === 0) {
      if (!shouldUseWildSampleMedia() && root.children.length > 0) {
        if (navGal) navGal.style.display = '';
        return;
      }
      root.innerHTML = '';
      if (navGal) navGal.style.display = '';
      return;
    }
    if (navGal) navGal.style.display = '';
    root.innerHTML = list
      .map(function (src, i) {
        return (
          '<div class="g-item has-photo">' +
          '<img class="g-photo" src="' +
          escapeWildAttr(src) +
          '" alt="Foto ' +
          (i + 1) +
          '" loading="lazy" decoding="async">' +
          '</div>'
        );
      })
      .join('');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(root);
    }
  }

  function renderWildServices(services) {
    var sec = document.getElementById('servicios');
    var sg = document.getElementById('tplServicesList');
    var nav = document.getElementById('tplNavServicios');
    var navM = document.getElementById('tplNavServiciosMobile');
    if (!sg) return;
    var list = Array.isArray(services)
      ? services.filter(function (s) {
          return s && String(s.name || '').trim();
        })
      : [];
    if (list.length === 0) {
      if (sec) sec.style.display = 'none';
      sg.innerHTML = '';
      if (nav) nav.style.display = 'none';
      if (navM) navM.style.display = 'none';
      return;
    }
    if (sec) sec.style.display = '';
    if (nav) nav.style.display = '';
    if (navM) navM.style.display = '';
    sg.innerHTML = list
      .map(function (s, i) {
        var icon = WILD_ICON_KEYS[i % WILD_ICON_KEYS.length];
        return (
          '<article class="service">' +
          '<div class="service-icon" aria-hidden="true">' +
          (WILD_SERVICE_ICONS[icon] || WILD_SERVICE_ICONS.paw) +
          '</div>' +
          '<h3>' +
          escapeWildHtml(String(s.name || '')) +
          '</h3>' +
          '<p>' +
          escapeWildHtml(s.description && String(s.description).trim() ? String(s.description) : '') +
          '</p>' +
          '<div class="price"><small>Desde</small><strong class="num">' +
          escapeWildHtml(formatWildPrice(s.price)) +
          '</strong></div></article>'
        );
      })
      .join('');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(sg);
    }
  }

  function renderWildHeroTitle(name) {
    var h1 = document.getElementById('heroTitle');
    if (!h1) return;
    var text = (name || '').trim();
    if (!text) return;
    var words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    h1.innerHTML = words
      .map(function (w, i) {
        return '<span class="w w-' + (i + 1) + '">' + escapeWildHtml(w) + '</span>';
      })
      .join(' ');
    if (typeof window.wildObserveReveals === 'function') {
      window.wildObserveReveals(h1);
    }
  }

  function buildWildDirectionsUrl(raw) {
    raw = raw || {};
    var manual = (raw.google_maps_url || '').trim();
    if (manual) return manual;
    var coords = resolveWildMapCoords(raw);
    return (
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(coords.lat + ',' + coords.lon)
    );
  }

  function destroyWildPreviewMap() {
    if (wildPreviewMap) {
      try {
        wildPreviewMap.remove();
      } catch (e) {}
      wildPreviewMap = null;
      wildPreviewMarker = null;
    }
  }

  function syncWildMapsLink(raw) {
    var row = document.getElementById('mapDirectionsRow');
    var link = document.getElementById('tplMapsExternalLink');
    if (!row || !link) return;
    var url = buildWildDirectionsUrl(raw);
    link.href = url;
    row.hidden = false;
    row.removeAttribute('hidden');
  }

  function updateWildPreviewMap(lat, lon, label) {
    var container = document.getElementById('map');
    if (!container || window.__LW_SKIP_LEAFLET) return;
    var coords = resolveWildMapCoords({ map_lat: lat, map_lon: lon });
    lat = coords.lat;
    lon = coords.lon;

    function applyMap() {
      if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
      if (!wildPreviewMap) {
        wildPreviewMap = L.map(container, { scrollWheelZoom: false }).setView([lat, lon], WILD_MAP_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(wildPreviewMap);
      } else {
        wildPreviewMap.setView([lat, lon], WILD_MAP_ZOOM);
      }
      if (wildPreviewMarker) wildPreviewMap.removeLayer(wildPreviewMarker);
      var icon = L.divIcon({
        className: 'wild-marker',
        html:
          '<div style="width:42px;height:42px;border-radius:50%;background:#8b5cf6;color:#fff;display:grid;place-items:center;box-shadow:4px 4px 0 #1a1428;border:3px solid #1a1428;transform:rotate(-8deg);"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 2.5-6 5.5 0 2 1.5 3.5 3.5 3.5.9 0 1.6-.4 2.5-.4s1.6.4 2.5.4c2 0 3.5-1.5 3.5-3.5 0-3-3-5.5-6-5.5z"/></svg></div>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      wildPreviewMarker = L.marker([lat, lon], { icon: icon, title: label || '' }).addTo(wildPreviewMap);
      wildPreviewMarker.bindPopup('<strong>' + escapeWildHtml(label || 'Tu negocio') + '</strong>');
      [80, 320, 900].forEach(function (ms) {
        setTimeout(function () {
          if (wildPreviewMap) wildPreviewMap.invalidateSize();
        }, ms);
      });
    }
    whenWildLeafletReady(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(applyMap);
      });
    });
  }

  window.updateWildPreviewMap = updateWildPreviewMap;

  function syncWildSocialRow(rowId, linkId, url) {
    var row = document.getElementById(rowId);
    var link = document.getElementById(linkId);
    if (!row || !link) return;
    url = String(url || '').trim();
    if (url) {
      link.href = url;
      row.hidden = false;
    } else {
      link.removeAttribute('href');
      row.hidden = true;
    }
  }

  function syncWildFooter(raw) {
    raw = raw || {};
    var phone = String(raw.telefono != null ? raw.telefono : '').trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var addr = String(raw.direccion || '').trim();
    var ciudad = String(raw.ciudad || '').trim();
    var addrLine = addr;
    if (addr && ciudad) addrLine = addr + ' · ' + ciudad;
    else if (ciudad) addrLine = ciudad;

    var footPhoneRow = document.getElementById('footPhoneRow');
    if (footPhoneRow) footPhoneRow.hidden = !phone;

    var footEmailRow = document.getElementById('footEmailRow');
    var footEmailLink = document.getElementById('footEmailLink');
    var footEmailDisplay = document.getElementById('footEmailDisplay');
    if (footEmailRow && footEmailLink && footEmailDisplay) {
      if (email) {
        footEmailLink.href = 'mailto:' + email;
        footEmailDisplay.textContent = email;
        footEmailRow.hidden = false;
      } else {
        footEmailRow.hidden = true;
      }
    }

    var footAddressRow = document.getElementById('footAddressRow');
    var footAddressLink = document.getElementById('footAddressLink');
    var footAddressText = document.getElementById('footAddressText');
    if (footAddressRow && footAddressLink && footAddressText) {
      if (addrLine) {
        footAddressText.textContent = addrLine;
        var dirUrl = buildWildDirectionsUrl(raw);
        if (dirUrl) {
          footAddressLink.href = dirUrl;
          footAddressLink.target = '_blank';
          footAddressLink.rel = 'noopener noreferrer';
        } else {
          footAddressLink.href = '#';
          footAddressLink.removeAttribute('target');
          footAddressLink.removeAttribute('rel');
        }
        footAddressRow.hidden = false;
      } else {
        footAddressRow.hidden = true;
      }
    }

    syncWildSocialRow('footSocialInstagramRow', 'tplSocialInstagram', raw.instagram_url);
    syncWildSocialRow('footSocialTiktokRow', 'tplSocialTiktok', raw.tiktok_url);
  }

  function syncWildTemplateExtensions(raw) {
    raw = raw || {};
    var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
    var branding = document.getElementById('tpl-platform-branding');
    if (branding) branding.style.display = isPro ? 'none' : '';

    renderWildServices(raw.services);

    var galeria = Array.isArray(raw.galeria) ? raw.galeria.filter(Boolean) : [];
    renderWildGallery(galeria);

    var gUrl = (raw.google_business_url || '').trim();
    var gSec = document.getElementById('opiniones');
    var gLink = document.getElementById('tplGbizLink');
    var footGbiz = document.getElementById('footGbizLink');
    var footGbizRow = document.getElementById('footGbizRow');
    var navOp = document.getElementById('tplNavOpiniones');
    var navOpM = document.getElementById('tplNavOpinionesMobile');
    var footNavOp = document.getElementById('footNavOpiniones');
    if (gSec && gLink) {
      if (gUrl) {
        gSec.style.display = '';
        gLink.href = gUrl;
        if (navOp) navOp.style.display = '';
        if (navOpM) navOpM.style.display = '';
        if (footNavOp) footNavOp.style.display = '';
        if (footGbiz) footGbiz.href = gUrl;
        if (footGbizRow) footGbizRow.hidden = false;
      } else {
        gSec.style.display = 'none';
        gLink.removeAttribute('href');
        if (navOp) navOp.style.display = 'none';
        if (navOpM) navOpM.style.display = 'none';
        if (footNavOp) footNavOp.style.display = 'none';
        if (footGbiz) footGbiz.removeAttribute('href');
        if (footGbizRow) footGbizRow.hidden = true;
      }
    }

    var list = Array.isArray(raw.services)
      ? raw.services.filter(function (s) {
          return s && String(s.name || '').trim();
        })
      : [];
    var hasSvc = list.length > 0;
    ['tplNavServicios', 'tplNavServiciosMobile', 'footNavServicios'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = hasSvc ? '' : 'none';
    });

    var vcEnabled = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
    var vcUrl = (raw.vcard_download_url || '').trim();
    var vcWrap = document.getElementById('tplVcardWrap');
    var vcA = document.getElementById('tplVcardLink');
    if (vcWrap && vcA) {
      if (vcEnabled && vcUrl) {
        vcWrap.style.display = '';
        vcA.href = vcUrl;
      } else {
        vcWrap.style.display = 'none';
        vcA.removeAttribute('href');
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
      var nav = document.querySelector('.nav-inner');
      var offset = nav ? Math.round(nav.getBoundingClientRect().height) + 20 : 20;
      var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(doScroll);
    });
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 280);
  }

  function applyLivePreviewData(raw, opts) {
    opts = opts || {};
    raw = raw || {};

    var name = (raw.nombre || '').trim() || 'Tu negocio';
    var tagline = (raw.tagline || '').trim();
    var descripcion = (raw.descripcion || '').trim();
    var ciudad = (raw.ciudad || '').trim();
    var logoUrl = (raw.logo_url || '').trim();

    if (shouldUseWildSampleMedia()) {
      if (!tagline) tagline = WILD_PREVIEW_COPY.tagline;
      if (!descripcion) descripcion = WILD_PREVIEW_COPY.descripcion;
      if (!ciudad) ciudad = WILD_PREVIEW_COPY.ciudad;
    }

    document.title = name + ' — ONEZ';

    var navWrap = document.getElementById('navBrandWrap');
    var navLogo = document.getElementById('navBrandLogo');
    var navName = document.getElementById('navBrandName');
    var navMark = document.getElementById('navBrandMark');
    if (navWrap && navLogo && navName) {
      if (logoUrl) {
        navLogo.src = logoUrl;
        navLogo.alt = name;
        navLogo.hidden = false;
        navLogo.style.display = 'block';
        navName.style.display = 'none';
        if (navMark) navMark.style.display = 'none';
      } else {
        navLogo.removeAttribute('src');
        navLogo.hidden = true;
        navLogo.style.display = 'none';
        navName.textContent = name;
        navName.style.display = '';
        if (navMark) navMark.style.display = '';
      }
    } else if (navName) {
      navName.textContent = name;
    }

    renderWildHeroTitle(name);

    var heroTag = document.getElementById('heroTagline');
    if (heroTag) heroTag.textContent = tagline;

    var aboutDesc = document.getElementById('aboutDescripcion');
    if (aboutDesc) aboutDesc.textContent = descripcion;

    var footBrand = document.getElementById('footBrand');
    if (footBrand) footBrand.textContent = name;
    var footTag = document.getElementById('footTagline');
    if (footTag) footTag.textContent = tagline || descripcion;
    var footBottom = document.getElementById('footBottomBrand');
    if (footBottom) {
      footBottom.textContent = '© ' + new Date().getFullYear() + ' · ' + name + ' · Todos los derechos reservados';
    }

    updateWildHeroPhotos(raw);
    updateWildAboutPhoto(raw);

    if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);
    syncWildFooter(raw);
    syncWildAboutContact(raw);

    var phone = String(raw.telefono != null ? raw.telefono : '').trim();
    var email = String(raw.correo != null ? raw.correo : '').trim();
    var addr = String(raw.direccion || '').trim();
    var rowPhone = document.getElementById('tplContactPhone');
    var phoneVal = document.getElementById('tplContactPhoneVal');
    if (rowPhone) {
      if (phone) {
        if (phoneVal) phoneVal.textContent = phone;
        rowPhone.style.display = '';
      } else {
        rowPhone.style.display = 'none';
      }
    }
    var rowEmail = document.getElementById('tplContactEmail');
    var emailVal = document.getElementById('tplContactEmailVal');
    if (rowEmail && emailVal) {
      if (email) {
        rowEmail.href = 'mailto:' + email;
        emailVal.textContent = email;
        rowEmail.style.display = '';
      } else {
        rowEmail.style.display = 'none';
      }
    }
    var rowAddr = document.getElementById('tplContactAddress');
    var addrVal = document.getElementById('tplContactAddressVal');
    if (rowAddr && addrVal) {
      if (addr) {
        addrVal.textContent = addr;
        var mapsUrl = buildWildDirectionsUrl(raw);
        rowAddr.href = mapsUrl || '#';
        rowAddr.style.display = '';
      } else {
        rowAddr.style.display = 'none';
      }
    }

    var coords = resolveWildMapCoords(raw);
    updateWildPreviewMap(coords.lat, coords.lon, name);
    syncWildMapsLink(raw);

    syncWildScheduleFromPreview(raw.horario);
    renderWildSchedule();
    syncWildTemplateExtensions(raw);

    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () {
        window.tvAnimationsRefresh();
      });
    }

    if (opts.alignToHash) scrollEmbedPreviewToHash();
  }

  window.applyLivePreviewData = applyLivePreviewData;

  (function initWildPreviewSampleMedia() {
    if (!shouldUseWildSampleMedia()) return;
    function boot() {
      updateWildHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
      updateWildAboutPhoto({ foto_equipo: '' });
      renderWildGallery([]);
      renderWildServices([]);
      syncWildScheduleFromPreview(null);
      renderWildSchedule();
      updateWildPreviewMap(WILD_DEFAULT_MAP_LAT, WILD_DEFAULT_MAP_LON, 'Tu negocio');
      syncWildMapsLink({});
      var heroTag = document.getElementById('heroTagline');
      if (heroTag && !heroTag.textContent.trim()) heroTag.textContent = WILD_PREVIEW_COPY.tagline;
      var aboutDesc = document.getElementById('aboutDescripcion');
      if (aboutDesc && !aboutDesc.textContent.trim()) aboutDesc.textContent = WILD_PREVIEW_COPY.descripcion;
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
      syncWildScheduleFromPreview(null);
      renderWildSchedule();
      if (shouldUseWildSampleMedia()) {
        updateWildHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
        updateWildAboutPhoto({ foto_equipo: '' });
        renderWildGallery([]);
      }
      if (window.location.hash) scrollEmbedPreviewToHash();
      return;
    }
    applyLivePreviewData(
      {
        nombre: params.get('nombre') || '',
        tagline: params.get('tagline') || '',
        telefono: params.get('telefono') || '',
        portada: params.get('portada') || '',
        portada_2: params.get('portada_2') || '',
        portada_3: params.get('portada_3') || '',
        descripcion: params.get('descripcion') || '',
        foto_equipo: params.get('foto_equipo') || '',
        direccion: params.get('direccion') || '',
        correo: params.get('correo') || '',
        ciudad: params.get('ciudad') || '',
      },
      { alignToHash: !!window.location.hash.replace(/^#/, '') },
    );
  })();

  (function initWildEmbedHashScroll() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('embed') !== '1') return;
    if (!window.location.hash) return;
    function boot() {
      scrollEmbedPreviewToHash();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();

  (function initSecureMessageListener() {
    var queryOrigin = new URLSearchParams(location.search).get('parentOrigin') || '';
    var DEV_ORIGINS = [
      'http://localhost',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
    ];
    function isAllowedOrigin(origin) {
      if (queryOrigin) return origin === queryOrigin;
      return DEV_ORIGINS.indexOf(origin) !== -1;
    }
    window.addEventListener('message', function (event) {
      if (!isAllowedOrigin(event.origin)) return;
      var data = event.data;
      if (!data || data.type !== 'lw:onboarding-preview') return;
      applyLivePreviewData(data.payload || {}, { alignToHash: data.alignToHash === true });
    });
  })();

  if (!window.__LW_SKIP_LEAFLET) {
    var ls = document.createElement('script');
    ls.src = 'https://unpkg.com/leaflet@' + '1.9.4/dist/leaflet.js';
    ls.crossOrigin = '';
    document.head.appendChild(ls);
  }

  setInterval(applyWildOpenStatus, 60000);
})();

</script>

@endverbatim

<script>
(function bootWildPetTenantPage() {
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
        ciudad: @json($ciudad),
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
    if (typeof syncWildScheduleFromPreview === 'function') syncWildScheduleFromPreview(@json($horario));
    if (typeof renderWildSchedule === 'function') renderWildSchedule();
    if (typeof updateWildPreviewMap === 'function') {
      updateWildPreviewMap(@json(is_numeric($map_lat) ? $map_lat : null), @json(is_numeric($map_lon) ? $map_lon : null), @json($nombre));
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
