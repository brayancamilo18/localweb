@extends('public.layouts.tenant')

@push('head-extras')
<meta name="description" content="Plantilla profesional de estilo vintage americana / soda fountain para restaurantes, sangüicherías y delis con identidad de marca clásica." />

<style id="lw-responsive-safety">
  html,body{overflow-x:clip;max-width:100%}
  @media (max-width:880px){
    .nav-inner{gap:10px;min-width:0;padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px))}
    .brand{min-width:0;flex:1 1 auto;max-width:calc(100% - 118px)}
    .brand.brand-has-img .nav-brand-img{max-width:min(140px,38vw)!important;max-height:calc(34px * var(--lw-logo-scale,1.35))!important}
    .nav-cta{flex-shrink:0;gap:8px}
    .nav-cta .btn{white-space:nowrap;font-size:clamp(9px,2.8vw,11px);padding:7px 10px}
    .burger{flex-shrink:0}
  }
</style>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=DM+Serif+Display:ital@0;1&family=Oswald:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">

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

@verbatim
<style>
  :root{
    /* ===== Paleta vintage (marca real) ===== */
    --red:       #b8161b;   /* rojo profundo esmaltado — fondo principal */
    --red-deep:  #9a1116;   /* rojo más hondo para tarjetas sobre rojo */
    --burgundy:  #6b0e12;   /* burdeos oscuro — profundidad */
    --cream:     #f5e6c8;   /* crema cálida hueso — texto y elementos */
    --cream-2:   #efdcb4;   /* crema un punto más cálida (hover papel) */
    --paper:     #f7edd6;   /* papel de menú/cartel */
    --gold:      #d4a85a;   /* dorado apagado — acento */
    --gold-soft: #c9a268;
    --black:     #1a0a0a;   /* negro vintage — contrastes puntuales */

    --ink-on-cream: #2a0c0d;   /* texto oscuro sobre papel crema */

    /* tipografía */
    --display: "Alfa Slab One", Georgia, serif;        /* letrero esmaltado monumental */
    --serif:   "DM Serif Display", Georgia, serif;      /* didone editorial para títulos */
    --label:   "Oswald", "Arial Narrow", sans-serif;    /* condensada uppercase, eyebrows */
    --body:    "Lora", Georgia, serif;                  /* cuerpo cálido legible */
    --mono:    "Courier Prime", "Courier New", monospace;/* precios y datos técnicos */

    --container: 1180px;
    --ease: cubic-bezier(0.33, 0.05, 0.2, 1);
    --ease-soft: cubic-bezier(0.4, 0, 0.2, 1);

    --line: rgba(245,230,200,.28);  /* líneas finas sobre rojo */
  }

  *,*::before,*::after{ box-sizing: border-box; }
  html{ scroll-behavior: smooth; }
  body{
    margin: 0;
    font-family: var(--body);
    color: var(--cream);
    background: var(--red);
    line-height: 1.65;
    font-size: 1.06rem;
    font-feature-settings: "onum" 1, "kern" 1;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    position: relative;
  }
  img{ display: block; max-width: 100%; }
  svg{ display: block; }
  a{ color: inherit; }
  button{ font: inherit; cursor: pointer; color: inherit; }
  p{ margin: 0; }

  h1,h2,h3,h4{ margin: 0; font-weight: 400; line-height: 1.06; }
  .num{ font-variant-numeric: lining-nums tabular-nums; }

  /* ===== Grano de papel envejecido (fijo, muy sutil) ===== */
  .grain{
    position: fixed; inset: 0;
    z-index: 999; pointer-events: none;
    opacity: .07;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  :focus-visible{
    outline: 3px solid var(--gold);
    outline-offset: 3px;
    border-radius: 2px;
  }

  .container{
    width: min(100% - 36px, var(--container));
    margin-inline: auto;
    position: relative;
  }
  section{ padding: clamp(70px, 9vw, 120px) 0; position: relative; }

  /* ===== Ornamentos reutilizables ===== */
  .eyebrow{
    display: inline-flex; align-items: center; gap: .65rem;
    font-family: var(--label);
    text-transform: uppercase;
    letter-spacing: .26em;
    font-size: .8rem;
    font-weight: 600;
    color: var(--gold);
  }
  .eyebrow::before,
  .eyebrow.flank::after{
    content: "✦";
    font-size: .7rem;
    color: var(--gold);
    letter-spacing: 0;
  }
  .eyebrow.solo::before{ content: none; }

  /* doble línea separadora con estrella central */
  .rule{
    display: flex; align-items: center; justify-content: center;
    gap: 1rem;
    margin: 1.6rem 0;
    color: var(--gold);
  }
  .rule .seg{
    height: 0; flex: 1; max-width: 220px;
    border-top: 1.5px solid var(--line);
    border-bottom: 1.5px solid var(--line);
    box-sizing: border-box;
    height: 5px;
  }
  .rule .star{ font-size: 1rem; }

  .section-head{ text-align: center; max-width: 720px; margin: 0 auto clamp(2.4rem,5vw,3.6rem); }
  .section-head h2{
    font-family: var(--serif);
    font-size: clamp(2.3rem, 5.2vw, 3.9rem);
    letter-spacing: .005em;
    margin-top: 1rem;
    color: var(--cream);
    text-wrap: balance;
  }
  .section-head .lede{
    margin-top: 1rem;
    color: rgba(245,230,200,.82);
    font-size: 1.12rem;
    max-width: 54ch;
    margin-inline: auto;
    text-wrap: pretty;
  }

  /* ===== Sello circular decorativo (textPath) ===== */
  .seal{ width: 124px; height: 124px; color: var(--gold); }
  .seal text{ font-family: var(--label); font-size: 9.2px; letter-spacing: 2.1px; fill: currentColor; text-transform: uppercase; font-weight: 600; }
  .seal .ring{ fill: none; stroke: currentColor; }
  .seal .star{ fill: currentColor; }

  /* ===== Botones tipo chapa esmaltada (doble borde) ===== */
  .btn{
    position: relative;
    display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
    padding: 1rem 1.8rem;
    font-family: var(--label);
    text-transform: uppercase;
    letter-spacing: .14em;
    font-weight: 600;
    font-size: .92rem;
    text-decoration: none;
    border: 2.5px solid currentColor;
    background: transparent;
    color: var(--cream);
    transition: background-color .3s var(--ease-soft), color .3s var(--ease-soft);
  }
  .btn::before{
    content: "";
    position: absolute; inset: 5px;
    border: 1.5px solid currentColor;
    opacity: .65;
    transition: inset .25s var(--ease), opacity .25s var(--ease-soft);
    pointer-events: none;
  }
  .btn:hover::before{ inset: 7px; opacity: 1; }   /* efecto presión vintage */
  .btn:active::before{ inset: 4px; }
  .btn svg{ width: 17px; height: 17px; }

  .btn-cream{ background: var(--cream); color: var(--burgundy); border-color: var(--burgundy); }
  .btn-cream:hover{ background: var(--cream-2); color: var(--red); }
  .btn-ghost{ background: transparent; color: var(--cream); border-color: var(--cream); }
  .btn-ghost:hover{ background: rgba(245,230,200,.12); color: var(--cream); }
  .btn-gold{ background: var(--gold); color: var(--black); border-color: var(--black); }
  .btn-gold:hover{ background: var(--gold-soft); }
  .btn-sm{ padding: .6rem 1rem; font-size: .8rem; }
  .btn-sm::before{ inset: 4px; }
  .btn-sm:hover::before{ inset: 5px; }

  /* ===== Enlace con doble subrayado vintage ===== */
  .ulink{
    position: relative; text-decoration: none;
    color: var(--cream);
    padding-bottom: 4px;
  }
  .ulink::after{
    content: "";
    position: absolute; left: 0; right: 0; bottom: 0;
    height: 4px;
    border-top: 1.5px solid var(--gold);
    border-bottom: 1.5px solid var(--gold);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform .32s var(--ease);
  }
  .ulink:hover::after{ transform: scaleX(1); }

  /* ===== Pill abierto / cerrado ===== */
  .pill{
    display: inline-flex; align-items: center; gap: .55rem;
    padding: .42rem .95rem;
    font-family: var(--label);
    text-transform: uppercase;
    letter-spacing: .16em;
    font-size: .78rem;
    font-weight: 600;
    border: 1.5px solid var(--gold);
    color: var(--cream);
    background: rgba(26,10,10,.28);
  }
  .pill .dot{ width: 9px; height: 9px; border-radius: 50%; background: var(--gold); }
  .pill.is-open .dot{ background: #6fbf73; box-shadow: 0 0 0 3px rgba(111,191,115,.25); }
  .pill.is-closed .dot{ background: #e8836b; box-shadow: 0 0 0 3px rgba(232,131,107,.25); }

  /* ===== Monograma circular ===== */
  .monogram{
    width: 64px; height: 64px; border-radius: 50%;
    display: grid; place-items: center;
    border: 2px solid var(--gold);
    box-shadow: inset 0 0 0 4px var(--red), inset 0 0 0 5.5px var(--gold);
    font-family: var(--display);
    font-size: 1.5rem;
    color: var(--cream);
    background: var(--burgundy);
    flex: none;
  }

  /* ===== NAV ===== */
  .nav{ position: fixed; inset: 14px 0 auto 0; z-index: 80; pointer-events: none; }
  .nav-inner{
    pointer-events: auto;
    width: min(100% - 28px, var(--container));
    margin-inline: auto;
    display: flex; align-items: center; gap: 1rem;
    background: rgba(122,12,16,.72);
    backdrop-filter: saturate(150%) blur(12px);
    -webkit-backdrop-filter: saturate(150%) blur(12px);
    border: 1.5px solid var(--gold);
    padding: .55rem .6rem .55rem 1.3rem;
  }
  .nav-inner::before{
    content: ""; position: absolute; inset: 4px;
    border: 1px solid rgba(212,168,90,.4);
    pointer-events: none;
  }
  .brand{
    display: flex; align-items: center; gap: .65rem;
    text-decoration: none; color: var(--cream);
    font-family: var(--display);
    font-size: 1.18rem; letter-spacing: .01em;
    position: relative; z-index: 1; white-space: nowrap;
  }
  .brand .bmark{
    width: 34px; height: 34px; border-radius: 50%;
    display: grid; place-items: center;
    border: 1.5px solid var(--gold);
    box-shadow: inset 0 0 0 2.5px var(--burgundy), inset 0 0 0 3.5px var(--gold);
    font-size: .9rem; color: var(--cream); background: var(--red-deep);
  }
  .nav-links{ display: flex; gap: .15rem; margin-left: auto; position: relative; z-index: 1; }
  .nav-links a{
    text-decoration: none; color: var(--cream);
    font-family: var(--label); text-transform: uppercase;
    letter-spacing: .13em; font-weight: 500; font-size: .82rem;
    padding: .55rem .8rem; position: relative;
  }
  .nav-links a::after{
    content: ""; position: absolute; left: .8rem; right: .8rem; bottom: .35rem;
    height: 3px; border-top: 1.5px solid var(--gold); border-bottom: 1.5px solid var(--gold);
    transform: scaleX(0); transform-origin: center; transition: transform .3s var(--ease);
  }
  .nav-links a:hover::after{ transform: scaleX(1); }
  .nav-cta{ display: flex; align-items: center; gap: .5rem; position: relative; z-index: 1; }
  .burger{
    display: none; width: 42px; height: 42px;
    border: 1.5px solid var(--gold); background: transparent;
    align-items: center; justify-content: center;
  }
  .burger span, .burger span::before, .burger span::after{
    display: block; width: 18px; height: 2px; background: var(--cream); position: relative;
  }
  .burger span::before, .burger span::after{ content: ""; position: absolute; left: 0; }
  .burger span::before{ top: -6px; } .burger span::after{ top: 6px; }

  .sheet{ position: fixed; inset: 0; z-index: 90; background: rgba(13,5,5,.6); display: none; }
  .sheet.open{ display: block; }
  .sheet-inner{
    position: absolute; left: 14px; right: 14px; top: 14px;
    background: var(--burgundy); border: 1.5px solid var(--gold); padding: 1.1rem;
  }
  .sheet-inner::before{ content:""; position:absolute; inset:5px; border:1px solid rgba(212,168,90,.4); pointer-events:none; }
  .sheet-inner nav{ display: grid; gap: .2rem; margin-top: .6rem; }
  .sheet-inner a{
    display: block; padding: .85rem .6rem; text-decoration: none; color: var(--cream);
    font-family: var(--label); text-transform: uppercase; letter-spacing: .14em; font-size: 1rem;
    border-bottom: 1px solid var(--line);
  }
  .sheet-inner a:last-child{ border-bottom: 0; }
  .sheet-close{
    width: 38px; height: 38px; border: 1.5px solid var(--gold); background: transparent;
    display: grid; place-items: center; float: right; color: var(--cream); position: relative; z-index:1;
  }

  /* ===== HERO ===== */
  .hero{ padding-top: clamp(130px, 16vw, 180px); padding-bottom: clamp(60px, 8vw, 90px); text-align: center; }
  .hero .container{ display: flex; flex-direction: column; align-items: center; }
  .hero .seal{ margin-bottom: 1.4rem; }
  .hero-eyebrow{ margin-bottom: 1.2rem; }
  .hero h1{
    font-family: var(--display);
    font-size: clamp(3.4rem, 13vw, 9rem);
    line-height: .9;
    color: var(--cream);
    letter-spacing: .005em;
    text-shadow: 3px 3px 0 var(--burgundy), 5px 5px 0 rgba(26,10,10,.35);
    text-wrap: balance;
  }
  .hero h1 .sub{
    display: block;
    font-family: var(--serif);
    font-style: italic;
    font-size: clamp(1.2rem, 3.4vw, 2.1rem);
    color: var(--gold);
    letter-spacing: .02em;
    text-shadow: none;
    margin-top: .5rem;
  }
  .hero-cta{ display: flex; gap: .9rem; flex-wrap: wrap; justify-content: center; margin-top: 2rem; }
  .hero-status{ margin-top: 1.6rem; }

  /* triptico de 3 fotos */
  .hero-photos{
    margin-top: clamp(2.6rem, 6vw, 4rem);
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1.25fr 1fr;
    gap: clamp(.9rem, 2vw, 1.6rem);
    align-items: center;
  }
  .vphoto{
    position: relative; overflow: hidden;
    border: 2.5px solid var(--gold);
    background: var(--burgundy);
    box-shadow: 0 0 0 6px var(--red), 0 0 0 7.5px var(--gold);
    transition: filter .4s var(--ease-soft), transform .4s var(--ease);
  }
  .vphoto::after{   /* marco interior que aparece en hover */
    content: ""; position: absolute; inset: 8px;
    border: 1.5px solid rgba(245,230,200,.0);
    transition: border-color .35s var(--ease-soft);
    pointer-events: none; z-index: 3;
  }
  .vphoto:hover{ filter: brightness(1.07) saturate(1.05); }
  .vphoto:hover::after{ border-color: rgba(245,230,200,.55); }
  .vphoto img{ width: 100%; height: 100%; object-fit: cover; filter: sepia(.18) saturate(.92); }
  .hero-photos .vphoto:nth-child(1){ aspect-ratio: 3/4; }
  .hero-photos .vphoto:nth-child(2){ aspect-ratio: 4/5; }
  .hero-photos .vphoto:nth-child(3){ aspect-ratio: 3/4; }

  /* fallback elegante (sin imagen) */
  .ph{
    position: absolute; inset: 0;
    display: grid; place-items: center; gap: .7rem;
    text-align: center;
    background:
      repeating-linear-gradient(135deg, transparent 0 12px, rgba(26,10,10,.16) 12px 13px),
      radial-gradient(circle at 50% 38%, var(--red-deep), var(--burgundy));
  }
  .ph .ph-orn{ color: var(--gold); font-size: 1.4rem; line-height: 1; }
  .ph .ph-label{
    font-family: var(--mono); font-size: .72rem; letter-spacing: .12em;
    text-transform: uppercase; color: rgba(245,230,200,.7);
    border: 1px solid var(--line); padding: .25rem .55rem;
  }
  .ph svg{ width: 38px; height: 38px; color: var(--gold); opacity: .9; }

  /* ===== TICKER ===== */
  .ticker{
    background: var(--black); color: var(--cream);
    border-top: 2px solid var(--gold); border-bottom: 2px solid var(--gold);
    overflow: hidden; padding: 0;
  }
  .ticker-track{ display: flex; gap: 2.6rem; width: max-content; padding: .95rem 0; animation: tick 32s linear infinite; }
  .ticker-item{
    display: inline-flex; align-items: center; gap: 1.1rem;
    font-family: var(--label); text-transform: uppercase;
    letter-spacing: .2em; font-weight: 500; font-size: 1.02rem;
    white-space: nowrap; color: var(--cream);
  }
  .ticker-item .sep{ color: var(--gold); font-size: .8em; }
  @keyframes tick{ to{ transform: translateX(-50%); } }

  /* ===== CARTA / SERVICIOS ===== */
  .menu-panel{
    background: var(--paper); color: var(--ink-on-cream);
    border: 2px solid var(--gold);
    padding: clamp(1.8rem, 4vw, 3.2rem);
    position: relative;
    box-shadow: 0 24px 60px -30px rgba(26,10,10,.7);
  }
  .menu-panel::before{ content:""; position:absolute; inset:8px; border:1px solid rgba(107,14,18,.35); pointer-events:none; }
  .menu-panel .corner{ position: absolute; width: 22px; height: 22px; border: 2px solid var(--burgundy); }
  .menu-panel .corner.tl{ top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
  .menu-panel .corner.tr{ top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
  .menu-panel .corner.bl{ bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
  .menu-panel .corner.br{ bottom: 14px; right: 14px; border-left: 0; border-top: 0; }
  .menu-head{ text-align: center; margin-bottom: 2rem; position: relative; z-index: 1; }
  .menu-head .eyebrow{ color: var(--burgundy); }
  .menu-head .eyebrow::before, .menu-head .eyebrow.flank::after{ color: var(--burgundy); }
  .menu-head h2{ font-family: var(--serif); font-size: clamp(2rem,4.4vw,3.1rem); color: var(--ink-on-cream); margin-top: .6rem; }
  .menu-head .rule .seg{ border-color: rgba(107,14,18,.3); }
  .menu-head .rule, .menu-head .star{ color: var(--burgundy); }

  .menu-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: .4rem 3rem; position: relative; z-index: 1; font-family: var(--mono); }
  .menu-row{
    padding: .95rem .85rem; position: relative;
    transition: background-color .3s var(--ease-soft), transform .3s var(--ease);
  }
  .menu-row:hover{ background: var(--cream-2); transform: translateX(2px); }
  .menu-line{ display: flex; align-items: baseline; gap: .5rem; }
  .menu-name{ font-family: var(--mono); font-size: 1.12rem; font-weight: 700; letter-spacing: .04em; color: var(--ink-on-cream); white-space: nowrap; }
  .menu-dots{
    flex: 1; align-self: flex-end; height: 0; margin-bottom: .42em;
    border-bottom: 2px dotted rgba(107,14,18,.45);
    transition: border-color .3s var(--ease-soft);
  }
  .menu-row:hover .menu-dots{ border-color: var(--burgundy); }
  .menu-price,
  .menu-line .menu-price.num{
    font-family: var(--mono) !important;
    font-weight: 700;
    font-size: 1.12rem;
    letter-spacing: .05em;
    color: var(--burgundy);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .menu-desc{ margin-top: .25rem; font-family: var(--mono); font-size: .92rem; letter-spacing: .02em; color: rgba(42,12,13,.72); max-width: 44ch; }
  .menu-tag{
    display: inline-block; margin-top: .45rem;
    font-family: var(--mono); text-transform: uppercase; letter-spacing: .12em;
    font-size: .68rem; font-weight: 700; color: var(--burgundy);
    border: 1px solid var(--gold); padding: .12rem .5rem; background: rgba(212,168,90,.16);
  }

  /* ===== ABOUT ===== */
  .about{ background: var(--burgundy); }
  .about-stack{ display: flex; flex-direction: column; gap: clamp(3rem, 8vw, 5.5rem); }
  .about-grid{ display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(2rem, 5vw, 4.5rem); align-items: center; }
  .about-grid--text-first{ grid-template-columns: 1.1fr .9fr; }
  .about-extra{ padding-top: 0; }
  .rep-about-extras{ display:flex; flex-direction:column; gap:clamp(3rem,8vw,5.5rem); width:100%; }
  .rep-about-extra.about-grid--text-first .about-figure{ order:2; }
  .rep-about-extra.about-grid--text-first .about-body{ order:1; }
  .rep-about-extra.about-grid--photo-first .about-figure{ order:1; }
  .rep-about-extra.about-grid--photo-first .about-body{ order:2; }
  .rep-about-extra .about-body h3{
    font-family:var(--serif);
    font-size:clamp(1.75rem,3.6vw,2.75rem);
    color:var(--cream);
    margin-top:.75rem;
    line-height:1.12;
  }
  @media (max-width:920px){
    .rep-about-extra.about-grid--text-first .about-figure{ order:-1; }
    .rep-about-extra.about-grid--photo-first .about-figure{ order:-1; }
  }
  .about-figure{ position: relative; }
  .about-figure .vphoto{ aspect-ratio: 4/5; box-shadow: 0 0 0 6px var(--burgundy), 0 0 0 7.5px var(--gold); }
  .about-figure .seal{ position: absolute; right: -22px; bottom: -22px; background: var(--burgundy); border-radius: 50%; }
  .about-body .eyebrow{ color: var(--gold); }
  .about-body h2{ font-family: var(--serif); font-size: clamp(2.2rem,4.8vw,3.6rem); color: var(--cream); margin-top: .9rem; }
  .about-body .lede{ margin-top: 1.2rem; color: rgba(245,230,200,.84); font-size: 1.1rem; text-wrap: pretty; }
  .about-sign{ display: flex; align-items: center; gap: 1rem; margin-top: 1.8rem; }
  .about-sign .name{ font-family: var(--serif); font-style: italic; font-size: 1.5rem; color: var(--gold); }
  .about-sign .role{ font-family: var(--label); text-transform: uppercase; letter-spacing: .14em; font-size: .78rem; color: rgba(245,230,200,.7); }
  .about-stats{ display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 2.2rem; }
  .about-stat{ border: 1.5px solid var(--gold); padding: 1.1rem 1rem; text-align: center; }
  .about-stat .n{ font-family: var(--display); font-size: 2rem; color: var(--cream); line-height: 1; }
  .about-stat .l{ font-family: var(--label); text-transform: uppercase; letter-spacing: .1em; font-size: .72rem; color: var(--gold); margin-top: .5rem; }

  /* ===== GALERIA ===== */
  .gallery{ display: grid; grid-template-columns: repeat(12,1fr); grid-auto-rows: 130px; gap: clamp(.9rem,1.8vw,1.4rem); }
  .g-item{ position: relative; overflow: hidden; border: 2.5px solid var(--gold); box-shadow: 0 0 0 5px var(--red), 0 0 0 6.5px var(--gold); background: var(--burgundy); transition: filter .4s var(--ease-soft); }
  .g-item::after{ content:""; position:absolute; inset:7px; border:1.5px solid rgba(245,230,200,0); transition: border-color .35s var(--ease-soft); pointer-events:none; z-index:3; }
  .g-item:hover{ filter: brightness(1.08) saturate(1.05); }
  .g-item:hover::after{ border-color: rgba(245,230,200,.5); }
  .g-item img{ width:100%; height:100%; object-fit: contain; object-position: center; filter: sepia(.22) saturate(.9) contrast(.98); }
  .g-item:nth-child(1){ grid-column: span 5; grid-row: span 3; }
  .g-item:nth-child(2){ grid-column: span 4; grid-row: span 2; }
  .g-item:nth-child(3){ grid-column: span 3; grid-row: span 2; }
  .g-item:nth-child(4){ grid-column: span 4; grid-row: span 2; }
  .g-item:nth-child(5){ grid-column: span 3; grid-row: span 2; }
  .g-item:nth-child(6){ grid-column: span 5; grid-row: span 2; }
  .g-item:nth-child(n+7){ grid-column: span 4; grid-row: span 2; }

  /* ===== HORARIO (cartel) ===== */
  .schedule-wrap{ display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(1.6rem,4vw,2.6rem); align-items: stretch; }
  .poster{
    background: var(--paper); color: var(--ink-on-cream);
    border: 2px solid var(--gold); position: relative;
    padding: clamp(1.6rem,3.5vw,2.6rem);
  }
  .poster::before{ content:""; position:absolute; inset:8px; border:1px solid rgba(107,14,18,.35); pointer-events:none; }
  .poster .corner{ position: absolute; width: 20px; height: 20px; border: 2px solid var(--burgundy); }
  .poster .corner.tl{ top:13px; left:13px; border-right:0; border-bottom:0; }
  .poster .corner.tr{ top:13px; right:13px; border-left:0; border-bottom:0; }
  .poster .corner.bl{ bottom:13px; left:13px; border-right:0; border-top:0; }
  .poster .corner.br{ bottom:13px; right:13px; border-left:0; border-top:0; }
  .poster-title{ text-align: center; font-family: var(--display); font-size: clamp(1.6rem,3.4vw,2.3rem); color: var(--burgundy); letter-spacing: .02em; position: relative; z-index:1; }
  .poster-sub{ text-align: center; font-family: var(--label); text-transform: uppercase; letter-spacing: .24em; font-size: .74rem; color: var(--ink-on-cream); opacity: .7; margin-top: .35rem; }
  .schedule{ margin-top: 1.6rem; position: relative; z-index:1; }
  .sched-row{ display: flex; justify-content: space-between; align-items: baseline; gap: .6rem; padding: .7rem .3rem; border-bottom: 1.5px dotted rgba(107,14,18,.32); }
  .sched-row:last-child{ border-bottom: 0; }
  .sched-row .day{ font-family: var(--label); text-transform: uppercase; letter-spacing: .12em; font-size: .92rem; font-weight: 500; }
  .sched-row .hours{ font-family: var(--mono); font-size: .98rem; color: var(--burgundy); }
  .sched-row.is-today{ background: rgba(212,168,90,.2); margin: 0 -.5rem; padding: .7rem .8rem; }
  .sched-row.is-today .day::after{ content: " ◆"; color: var(--gold); }
  .sched-row.is-closed .hours{ font-style: italic; opacity: .55; }

  .sched-side{ border: 1.5px solid var(--gold); padding: clamp(1.6rem,3.5vw,2.4rem); display: flex; flex-direction: column; justify-content: center; gap: 1rem; text-align: center; background: rgba(26,10,10,.18); }
  .sched-side .monogram{ margin: 0 auto; }
  .sched-side h3{ font-family: var(--serif); font-size: 1.9rem; color: var(--cream); }
  .sched-side p{ color: rgba(245,230,200,.8); }
  .sched-side .btn{ align-self: center; }

  /* ===== CONTACTO ===== */
  .contact{ text-align: center; }
  .contact-phone{
    font-family: var(--display);
    font-size: clamp(2.6rem, 8vw, 5.2rem);
    color: var(--cream); letter-spacing: .01em; line-height: 1;
    text-decoration: none; display: inline-block; margin: .5rem 0 .2rem;
    text-shadow: 2px 2px 0 var(--burgundy);
    transition: color .3s var(--ease-soft);
  }
  .contact-phone:hover{ color: var(--gold); }
  .contact-cards{ display: grid; grid-template-columns: repeat(3,1fr); gap: 1.2rem; margin-top: 2.6rem; }
  .ccard{
    border: 1.5px solid var(--gold); padding: 1.8rem 1.4rem; text-decoration: none;
    color: var(--cream); display: grid; gap: .55rem; justify-items: center; text-align: center;
    background: rgba(26,10,10,.16);
    transition: background-color .3s var(--ease-soft), transform .3s var(--ease);
  }
  .ccard:hover{ background: rgba(26,10,10,.3); transform: translateY(-3px); }
  .ccard svg{ width: 28px; height: 28px; color: var(--gold); }
  .ccard .label{ font-family: var(--label); text-transform: uppercase; letter-spacing: .16em; font-size: .74rem; color: var(--gold); }
  .ccard .value{ font-family: var(--serif); font-size: 1.2rem; }

  /* ===== MAPA ===== */
  #map{ height: 440px; border: 2.5px solid var(--gold); box-shadow: 0 0 0 6px var(--red), 0 0 0 7.5px var(--gold); }
  #map .leaflet-tile{ filter: sepia(.5) saturate(.8) brightness(.94) contrast(.92) hue-rotate(-6deg); }
  .leaflet-container{ background: var(--burgundy); }

  /* ===== OPINIONES ===== */
  .reviews{ background: var(--black); border: 2px solid var(--gold); padding: clamp(2.4rem,6vw,4.4rem); text-align: center; position: relative; }
  .reviews::before{ content:""; position:absolute; inset:9px; border:1px solid rgba(212,168,90,.4); pointer-events:none; }
  .reviews .stars{ color: var(--gold); font-size: 1.8rem; letter-spacing: .22em; }
  .reviews h2{ font-family: var(--serif); font-size: clamp(2rem,4.6vw,3.2rem); color: var(--cream); margin-top: .8rem; }
  .reviews p{ color: rgba(245,230,200,.8); max-width: 52ch; margin: 1rem auto 1.8rem; }

  /* ===== VCARD ===== */
  .vcard{
    background: var(--paper); color: var(--ink-on-cream); border: 2px solid var(--gold);
    padding: clamp(1.6rem,3.5vw,2.4rem); display: flex; align-items: center; gap: 1.6rem; flex-wrap: wrap;
    position: relative;
  }
  .vcard::before{ content:""; position:absolute; inset:8px; border:1px solid rgba(107,14,18,.35); pointer-events:none; }
  .vcard .monogram{ background: var(--burgundy); box-shadow: inset 0 0 0 4px var(--paper), inset 0 0 0 5.5px var(--gold); }
  .vcard .vc-text h3{ font-family: var(--serif); font-size: 1.5rem; color: var(--ink-on-cream); }
  .vcard .vc-text p{ color: rgba(42,12,13,.7); margin-top: .2rem; }
  .vcard .vc-meta{ font-family: var(--mono); font-size: .78rem; letter-spacing: .08em; color: var(--burgundy); margin-top: .4rem; text-transform: uppercase; }
  .vcard .btn{ margin-left: auto; position: relative; z-index: 1; }

  /* ===== CTA FINAL ===== */
  .final{ background: var(--black); }
  .final-sign{
    border: 2.5px solid var(--gold); position: relative;
    padding: clamp(2.6rem,6vw,4.6rem); text-align: center;
    background: radial-gradient(circle at 50% 0%, var(--red-deep), var(--black) 80%);
  }
  .final-sign::before{ content:""; position:absolute; inset:9px; border:1.5px solid rgba(212,168,90,.5); pointer-events:none; }
  .final-sign .seal{ margin: 0 auto 1.4rem; }
  .final-sign h2{ font-family: var(--display); font-size: clamp(2.4rem,6.5vw,4.6rem); color: var(--cream); line-height: .95; text-shadow: 3px 3px 0 var(--burgundy); }
  .final-sign p{ color: rgba(245,230,200,.82); max-width: 48ch; margin: 1.2rem auto 2rem; font-size: 1.12rem; }
  .final-sign .ctas{ display: flex; gap: .9rem; justify-content: center; flex-wrap: wrap; }

  /* ===== FOOTER ===== */
  footer{ background: var(--black); color: var(--cream); padding: clamp(3rem,6vw,4.5rem) 0 2rem; border-top: 2px solid var(--gold); }
  .foot-top{ text-align: center; }
  .foot-top .monogram{ margin: 0 auto 1.2rem; width: 78px; height: 78px; font-size: 1.9rem; }
  .foot-name{ font-family: var(--display); font-size: 1.8rem; color: var(--cream); }
  .foot-est{ font-family: var(--label); text-transform: uppercase; letter-spacing: .28em; font-size: .76rem; color: var(--gold); margin-top: .5rem; }
  .foot-links{ display: flex; justify-content: center; flex-wrap: wrap; gap: 1.4rem; margin: 1.8rem 0; }
  .foot-links a{ font-family: var(--label); text-transform: uppercase; letter-spacing: .14em; font-size: .82rem; text-decoration: none; color: rgba(245,230,200,.82); }
  .foot-bottom{ text-align: center; font-family: var(--mono); font-size: .76rem; letter-spacing: .06em; color: rgba(245,230,200,.5); margin-top: 1.4rem; }

  /* ===== Reveal (fade-in clásico) ===== */
  .reveal{ opacity: 0; transform: translateY(22px); transition: opacity .8s var(--ease-soft), transform .8s var(--ease); will-change: transform; }
  .reveal.in{ opacity: 1; transform: none; }
  [data-stagger] > *{ opacity: 0; transform: translateY(20px); transition: opacity .7s var(--ease-soft), transform .7s var(--ease); }
  [data-stagger].in > *{ opacity: 1; transform: none; }
  [data-stagger].in > *:nth-child(1){ transition-delay: 0ms; }
  [data-stagger].in > *:nth-child(2){ transition-delay: 70ms; }
  [data-stagger].in > *:nth-child(3){ transition-delay: 140ms; }
  [data-stagger].in > *:nth-child(4){ transition-delay: 210ms; }
  [data-stagger].in > *:nth-child(5){ transition-delay: 280ms; }
  [data-stagger].in > *:nth-child(6){ transition-delay: 350ms; }
  [data-stagger].in > *:nth-child(7){ transition-delay: 420ms; }
  [data-stagger].in > *:nth-child(8){ transition-delay: 490ms; }

  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{ animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
    .reveal, [data-stagger] > *{ opacity:1 !important; transform:none !important; }
    .ticker-track{ animation: none !important; }
  }

  /* ===== Responsive ===== */
  @media (max-width: 920px){
    .nav-links{ display: none; }
    .burger{ display: inline-flex; margin-left: auto; }
    .menu-grid{ grid-template-columns: 1fr; gap: 0; }
    .about-grid{ grid-template-columns: 1fr; }
    .about-figure .vphoto{ max-width: 420px; margin-inline: auto; }
    .schedule-wrap{ grid-template-columns: 1fr; }
    .contact-cards{ grid-template-columns: 1fr; }
    /* Galería móvil: carrusel horizontal. Fotos grandes, altura fija
       (una sola fila), sin apilar ni alargar la página en vertical. */
    #galeria .container{
      width: 100%;
      max-width: 100%;
      margin-inline: 0;
    }
    #galeria .section-head{
      width: min(100% - 36px, var(--container));
      margin-inline: auto;
      padding-inline: 18px;
    }
    .gallery{
      display: flex;
      flex-wrap: nowrap;
      align-items: stretch;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      gap: .65rem;
      padding: 0 12px .15rem;
      width: 100%;
      max-width: 100%;
      scrollbar-width: none;
    }
    .gallery::-webkit-scrollbar{ display: none; }
    .g-item,
    .g-item:nth-child(1),
    .g-item:nth-child(2),
    .g-item:nth-child(3),
    .g-item:nth-child(4),
    .g-item:nth-child(5),
    .g-item:nth-child(6),
    .g-item:nth-child(n+2),
    .g-item:last-child:nth-child(odd),
    .g-item:only-child{
      flex: 0 0 100%;
      scroll-snap-align: center;
      aspect-ratio: 4 / 5;
      min-width: 0;
      max-width: none;
      width: auto;
      grid-column: unset !important;
      grid-row: unset !important;
      justify-self: unset;
      box-shadow: 0 0 0 3px var(--red), 0 0 0 4px var(--gold);
      border-width: 2px;
    }
    .gallery-dots{
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: .55rem;
      margin-top: .85rem;
      padding-inline: 18px;
    }
    .gallery-dots[hidden]{ display: none !important; }
    .gallery-dot{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1.5px solid var(--gold);
      background: transparent;
      padding: 0;
      cursor: pointer;
      transition: background .25s var(--ease-soft), transform .25s var(--ease-soft);
    }
    .gallery-dot.is-current{
      background: var(--gold);
      transform: scale(1.2);
    }
    .gallery-dot.is-edge{
      width: 5px;
      height: 5px;
      opacity: .5;
    }
    .gallery-dot:focus-visible{
      outline: 2px solid var(--gold);
      outline-offset: 3px;
    }
  }
  @media (max-width: 560px){
    .hero-photos{ grid-template-columns: 1fr 1fr; }
    .hero-photos .vphoto:nth-child(1){ grid-column: span 2; aspect-ratio: 16/10; }
    .menu-name{ white-space: normal; }
    .about-stats{ grid-template-columns: 1fr; }
    .vcard{ flex-direction: column; align-items: flex-start; text-align: left; }
    .vcard .btn{ margin-left: 0; }
  }
</style>
<style id="lw-template-hooks">
  section[id],a[id]{scroll-margin-top:100px}
  html.embed-preview-root,body.embed-preview{overflow:auto!important;height:auto!important;min-height:100%}
  body.embed-preview .nav{position:fixed}
  #servicios.is-hidden,#opiniones.is-hidden,#tplVcardWrap.is-hidden{display:none!important}
  #tpl-platform-branding a{color:var(--gold)}
  .nav{--lw-logo-scale:1}
  .brand.brand-has-img .bmark{display:none!important}
  .brand.brand-has-img #navBrandName{display:none!important}
  .brand.brand-has-img .nav-brand-img{display:block;height:calc(34px * var(--lw-logo-scale,1));width:auto;max-width:calc(200px * var(--lw-logo-scale,1));object-fit:contain}
  body.embed-preview .reveal,
  body.embed-preview [data-stagger],
  body.embed-preview [data-stagger] > *,
  body.republica-preview .reveal,
  body.republica-preview [data-stagger],
  body.republica-preview [data-stagger] > *{opacity:1!important;transform:none!important}
  body.embed-preview #aboutExtraBlocks .reveal,
  body.republica-preview #aboutExtraBlocks .reveal{visibility:visible!important}
  .ccard-wa svg{width:36px;height:36px;color:var(--gold)}
  .vintage-marker.leaflet-div-icon{background:transparent!important;border:none!important}
</style>
<style id="lw-photo-overrides">
  .vphoto.has-photo .ph{display:none!important}
  .vphoto.has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:sepia(.18) saturate(.92)}
  .g-item.has-photo .ph{display:none!important}
  .g-item.has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;filter:sepia(.22) saturate(.9) contrast(.98)}
</style>
<style id="lw-gallery-desktop">
  /* Escritorio: mosaico original, sin solapamiento, marco = foto */
  @media (min-width: 921px){
    .gallery{
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: auto;
      grid-auto-flow: row;
      gap: clamp(.9rem, 1.8vw, 1.4rem);
    }
    .g-item{
      width: 100%;
      height: auto;
      align-self: start;
      line-height: 0;
      overflow: visible;
    }
    .g-item:nth-child(1){ grid-column: span 5; grid-row: span 3; }
    .g-item:nth-child(2){ grid-column: span 4; grid-row: span 2; }
    .g-item:nth-child(3){ grid-column: span 3; grid-row: span 2; }
    .g-item:nth-child(4){ grid-column: span 4; grid-row: span 2; }
    .g-item:nth-child(5){ grid-column: span 3; grid-row: span 2; }
    .g-item:nth-child(6){ grid-column: span 5; grid-row: span 2; }
    .g-item:nth-child(6n+7){ grid-column: span 5; }
    .g-item:nth-child(6n+8){ grid-column: span 4; }
    .g-item:nth-child(6n+9){ grid-column: span 3; }
    .g-item:nth-child(6n+10){ grid-column: span 4; }
    .g-item:nth-child(6n+11){ grid-column: span 3; }
    .g-item:nth-child(6n+12){ grid-column: span 5; }
    .g-item img,
    .g-item.has-photo img{
      position: static !important;
      inset: auto !important;
      display: block;
      width: 100% !important;
      height: auto !important;
      max-width: none;
      max-height: none;
      object-fit: contain;
      object-position: center;
    }
    .g-item .ph{
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 5;
      min-height: 180px;
    }
  }
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')
<div class="grain" aria-hidden="true"></div>

<!-- ====================== 1. NAV ====================== -->
<header class="nav" role="banner">
  <div class="nav-inner">
    <a href="#top" class="brand" id="navBrandWrap" aria-label="Inicio · Tu negocio">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span class="bmark" id="navBrandMark" aria-hidden="true">TN</span>
      <span id="navBrandName">{{ $nombre }}</span>
    </a>
    <nav class="nav-links" aria-label="Principal">
      <a href="#servicios">Servicios</a>
      <a href="#nosotros">Nosotros</a>
      <a href="#galeria">Galería</a>
      <a href="#horario">Horario</a>
      <a href="#opiniones">Opiniones</a>
      <a href="#contacto">Contacto</a>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-cream btn-sm" href="https://wa.me/{{ $whatsapp }}" data-wa-link aria-label="Escríbenos por WhatsApp">
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
    <button class="sheet-close" id="sheetClose" aria-label="Cerrar menú">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
    </button>
    <nav aria-label="Menú móvil">
      <a href="#servicios">Servicios</a>
      <a href="#nosotros">Nosotros</a>
      <a href="#galeria">Galería</a>
      <a href="#horario">Horario</a>
      <a href="#opiniones">Opiniones</a>
      <a href="#contacto">Contacto</a>
    </nav>
  </div>
</div>

<main id="top">

<!-- ====================== 2. HERO ====================== -->
<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <svg class="seal reveal" viewBox="0 0 120 120" aria-hidden="true">
      <defs><path id="sealPath" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>
      <circle class="ring" cx="60" cy="60" r="56" stroke-width="1.5"/>
      <circle class="ring" cx="60" cy="60" r="33" stroke-width="1"/>
      <text><textPath href="#sealPath" startOffset="0">ESPECIALIDAD DE LA CASA ✦ DESDE SIEMPRE ✦ </textPath></text>
      <path class="star" d="M60 46l3.2 6.8 7.4.9-5.5 5 1.5 7.3L60 68.4l-6.6 3.6 1.5-7.3-5.5-5 7.4-.9z"/>
    </svg>


    <h1 id="hero-title" class="reveal">
      <span id="heroTitle">{{ $nombre }}</span>
      <span class="sub" id="heroSub">{{ $tagline }}</span>
    </h1>

    <div class="hero-cta reveal">
      <a class="btn btn-cream" href="#contacto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Reservar mesa
      </a>
      <a class="btn btn-ghost" href="tel:+00000000000" data-tel-link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>
        Llamar ahora
      </a>
    </div>

    <span class="pill is-open hero-status reveal" id="heroStatus" role="status" aria-live="polite">
      <span class="dot" aria-hidden="true"></span>
      <span id="heroStatusLabel">Abierto ahora</span>
    </span>

    <div class="hero-photos" data-stagger aria-label="Fotos del negocio">
      <figure class="vphoto" id="heroPhoto1">
        <div class="ph" role="img" aria-hidden="true"></div>
        @if($portada)
        <img class="rep-photo" src="{{ $portada }}" alt="{{ $nombre }}" loading="lazy" decoding="async"/>
        @endif
      </figure>
      <figure class="vphoto" id="heroPhoto2">
        <div class="ph" role="img" aria-hidden="true"></div>
        @if($portada_2)
        <img class="rep-photo" src="{{ $portada_2 }}" alt="{{ $nombre }}" loading="lazy" decoding="async"/>
        @endif
      </figure>
      <figure class="vphoto" id="heroPhoto3">
        <div class="ph" role="img" aria-hidden="true"></div>
        @if($portada_3)
        <img class="rep-photo" src="{{ $portada_3 }}" alt="{{ $nombre }}" loading="lazy" decoding="async"/>
        @endif
      </figure>
    </div>
  </div>
</section>

<!-- ====================== 3. TICKER ====================== -->
<section class="ticker" aria-label="Mensajes destacados">
  <div class="ticker-track" id="ticker">
    <span class="ticker-item">Producto de mercado <span class="sep">✦</span></span>
    <span class="ticker-item">Recetas de siempre <span class="sep">★</span></span>
    <span class="ticker-item">Pan recién horneado <span class="sep">●</span></span>
    <span class="ticker-item">Café de tueste natural <span class="sep">✦</span></span>
    <span class="ticker-item">Hecho a mano cada día <span class="sep">★</span></span>
    <span class="ticker-item">Trato de barrio <span class="sep">●</span></span>
  </div>
</section>

<!-- ====================== 4. CARTA / SERVICIOS ====================== -->
<section id="servicios"@if(count($services) === 0) class="is-hidden" style="display:none;"@else style=""@endif aria-labelledby="serv-title">
  <div class="container">
    <div class="menu-panel reveal">
      <span class="corner tl" aria-hidden="true"></span>
      <span class="corner tr" aria-hidden="true"></span>
      <span class="corner bl" aria-hidden="true"></span>
      <span class="corner br" aria-hidden="true"></span>
      <div class="menu-head">
        <span class="eyebrow flank">La carta</span>
        <h2 id="serv-title">Especialidad de la casa</h2>
        <div class="rule"><span class="seg"></span><span class="star">✦</span><span class="seg"></span></div>
      </div>
      <div class="menu-grid" data-stagger id="menuGrid">

@foreach($services as $service)
    <article class="menu-row">
      <div class="menu-line">
        <span class="menu-name">{{ $service['name'] }}</span>
        <span class="menu-dots" aria-hidden="true"></span>
        <span class="menu-price num">
        @if($service['price'] !== null)
        {{ number_format($service['price'], 0, ',', '.') }} €
        @else
        Consultar
        @endif
        </span>
      </div>
      @if(!empty($service['description']))<p class="menu-desc">{{ $service['description'] }}</p>@endif
    </article>
@endforeach
      </div>
    </div>
  </div>
</section>

<!-- ====================== 5. ABOUT ====================== -->
<section class="about" id="nosotros" aria-labelledby="about-title">
  <div class="container about-stack">
    <div class="about-grid about-grid--photo-first">
      <figure class="about-figure reveal">
        <div class="vphoto" id="aboutPhotoWrap">
          <div class="ph" role="img" aria-hidden="true"></div>
          @if($foto_equipo)
          <img class="rep-photo" src="{{ $foto_equipo }}" alt="{{ $nombre }}" loading="lazy" decoding="async"/>
          @endif
        </div>
        <svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
          <defs><path id="sealPath2" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>
          <circle class="ring" cx="60" cy="60" r="56" stroke-width="1.5"/>
          <text><textPath href="#sealPath2" startOffset="0">NUESTRA HISTORIA ★ HECHO CON OFICIO ★ </textPath></text>
          <path class="star" d="M60 48l2.8 6 6.5.8-4.8 4.4 1.3 6.4L60 69l-5.8 3.1 1.3-6.4L50.7 61.3l6.5-.8z"/>
        </svg>
      </figure>
      <div class="about-body">
        <span class="eyebrow flank reveal">Nuestra historia</span>
        <h2 id="aboutTitle" class="reveal">{{ $about_title ?: 'Una casa con oficio, abierta desde ' . ($anio_fundacion ?: 'siempre') }}</h2>
        <p class="lede reveal" id="aboutLede">{{ $descripcion }}</p>
      </div>
    </div>
    @include('public.partials.about-extra-blocks-republica')
  </div>
</section>

<!-- ====================== 6. GALERIA ====================== -->
<section id="galeria" aria-labelledby="gal-title">
  <div class="container">
    <div class="section-head reveal">
      <span class="eyebrow flank solo">Galería</span>
      <h2>El género, la casa y la gente</h2>
    </div>
    <div class="gallery" data-stagger id="galleryLive">
@forelse(($galeria ?? []) as $imgUrl)
    <figure class="g-item has-photo"><img class="rep-photo" src="{{ $imgUrl }}" alt="" loading="lazy" decoding="async"></figure>
@empty
    <figure class="g-item"><div class="ph" role="img"><span class="ph-orn">✦</span><span class="ph-label">FOTO · 01</span></div></figure>
    <figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 02</span></div></figure>
    <figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 03</span></div></figure>
    <figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 04</span></div></figure>
    <figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 05</span></div></figure>
    <figure class="g-item"><div class="ph" role="img"><span class="ph-orn">★</span><span class="ph-label">FOTO · 06</span></div></figure>
@endforelse
    </div>
    <div class="gallery-dots" id="galleryDots" role="tablist" aria-label="Navegación de la galería" hidden></div>
  </div>
</section>

<!-- ====================== 7. HORARIO ====================== -->
<section id="horario" aria-labelledby="sched-title">
  <div class="container">
    <div class="section-head reveal">
      <span class="eyebrow flank solo">Horario</span>
      <h2 id="sched-title">Cuándo abrimos</h2>
    </div>
    <div class="schedule-wrap">
      <div class="poster reveal">
        <span class="corner tl" aria-hidden="true"></span>
        <span class="corner tr" aria-hidden="true"></span>
        <span class="corner bl" aria-hidden="true"></span>
        <span class="corner br" aria-hidden="true"></span>
        <div class="poster-title">Horario de atención</div>
        <div class="poster-sub">✦ Todos los días ✦</div>
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
      <aside class="sched-side reveal" aria-label="Estado actual">
        <span class="monogram" aria-hidden="true">TN</span>
        <span class="pill is-open" id="sideStatus" style="align-self:center;">
          <span class="dot" aria-hidden="true"></span>
          <span id="sideStatusLabel">Abierto ahora</span>
        </span>
        <h3 id="sideStatusTitle">Estamos abiertos</h3>
        <p id="sideStatusText">Pásate a vernos o reserva tu mesa. Te esperamos.</p>
        <a class="btn btn-gold btn-sm" href="#contacto">Reservar mesa</a>
      </aside>
    </div>
  </div>
</section>

<!-- ====================== 8. CONTACTO ====================== -->
<section class="about" id="contacto" aria-labelledby="contact-title">
  <div class="container contact">
    <div class="section-head reveal" style="margin-bottom:1.2rem;">
      <span class="eyebrow flank solo">Contacto</span>
      <h2 id="contact-title">Reserva o pásate a vernos</h2>
    </div>
    <a class="contact-phone reveal in num" href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" id="contactPhone" data-tel-link data-phone-display>{{ $telefono ?: ($whatsapp ? '+'.$whatsapp : '+00 000 000 000') }}</a>
    <div class="rule reveal" style="color:var(--gold);"><span class="seg" style="border-color:var(--line);"></span><span class="star">✦</span><span class="seg" style="border-color:var(--line);"></span></div>
    <div class="contact-cards in" data-stagger>
      <a class="ccard ccard-wa" href="https://wa.me/{{ $whatsapp }}" data-wa-link>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span class="label">WhatsApp</span>
        <span class="value num" id="contactWaValue" data-phone-display>{{ $telefono ?: ($whatsapp ? '+'.$whatsapp : '+00 000 000 000') }}</span>
      </a>
      <a class="ccard" href="mailto:hola@ejemplo.com" id="contactEmailCard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 7l9 6 9-6"/></svg>
        <span class="label">Escríbenos</span>
        <span class="value" id="contactEmailValue">{{ $correo ?: 'hola@ejemplo.com' }}</span>
      </a>
      <a class="ccard" href="#mapa" id="contactAddressCard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="label">Visítanos</span>
        <span class="value" id="contactAddressValue">{{ $direccion ?: 'Calle Ejemplo, 00' }}</span>
      </a>
    </div>
  </div>
</section>

<!-- ====================== 9. MAPA ====================== -->
<section id="mapa" aria-labelledby="map-title">
  <div class="container">
    <div class="section-head reveal">
      <span class="eyebrow flank solo">Cómo llegar</span>
      <h2 id="map-title">Aquí nos encontrarás</h2>
    </div>
    <div id="map" class="reveal in" role="application" aria-label="Mapa de ubicación"></div>
  </div>
</section>

<!-- ====================== 10. OPINIONES ====================== -->
<section id="opiniones"@if(!$google_business_url) class="is-hidden" style="display:none;"@else style=""@endif aria-labelledby="rev-title" style="display:none;">
  <div class="container">
    <div class="reviews reveal">
      <div class="stars" aria-hidden="true">★★★★★</div>
      <h2 id="rev-title">Lo que dice la clientela</h2>
      <p>Las opiniones reales viven en Google. Pulsa el botón y lee qué cuenta la gente que ya nos conoce.</p>
      <a class="btn btn-gold" href="https://www.google.com/" id="gbizBtn" rel="noopener" target="_blank">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4A10.4 10.4 0 0 0 22 12.2zM12 22a10 10 0 0 0 6.9-2.5l-3.4-2.6a6.2 6.2 0 0 1-9.3-3.3H2.7v2.6A10 10 0 0 0 12 22zM5.7 13.6a6 6 0 0 1 0-3.8V7.2H2.7a10 10 0 0 0 0 9.6zM12 6a5.4 5.4 0 0 1 3.8 1.5l2.9-2.9A10 10 0 0 0 2.7 7.2l3 2.3A6 6 0 0 1 12 6z"/></svg>
        Ver opiniones en Google
      </a>
    </div>
  </div>
</section>

<!-- ====================== 11. VCARD ====================== -->
<section id="tplVcardWrap"@if(!$vcard_enabled || !$vcard_download_url) class="is-hidden" style="display:none;"@endif aria-labelledby="vcard-title" style="display:none;">
  <div class="container">
    <div class="vcard reveal">
      <span class="monogram" aria-hidden="true">TN</span>
      <div class="vc-text">
        <h3 id="vcard-title">Guarda nuestros datos</h3>
        <p>Descarga la tarjeta de contacto y tennos siempre a mano.</p>
        <div class="vc-meta" id="vcardMeta">{{ $nombre ?: 'Tu negocio' }}</div>
      </div>
      <a class="btn btn-cream" href="#" id="vcardBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
        Guardar contacto
      </a>
    </div>
  </div>
</section>

<!-- ====================== 12. CTA FINAL ====================== -->
<section class="final" aria-labelledby="final-title">
  <div class="container">
    <div class="final-sign reveal">
      <svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
        <defs><path id="sealPath3" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>
        <circle class="ring" cx="60" cy="60" r="56" stroke-width="1.5"/>
        <circle class="ring" cx="60" cy="60" r="33" stroke-width="1"/>
        <text><textPath href="#sealPath3" startOffset="0">TE ESPERAMOS ✦ COMO SIEMPRE ✦ </textPath></text>
        <path class="star" d="M60 46l3.2 6.8 7.4.9-5.5 5 1.5 7.3L60 68.4l-6.6 3.6 1.5-7.3-5.5-5 7.4-.9z"/>
      </svg>
      <h2 id="final-title">Te guardamos<br>una mesa</h2>
      <p>Reserva en menos de un minuto o pásate sin compromiso. Te atendemos como se ha hecho siempre.</p>
      <div class="ctas">
        <a class="btn btn-gold" href="https://wa.me/{{ $whatsapp }}" data-wa-link rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5z"/></svg>
          Reservar por WhatsApp
        </a>
        <a class="btn btn-ghost" href="tel:+00000000000" data-tel-link>Llamar ahora</a>
      </div>
    </div>
  </div>
</section>

</main>

<!-- ====================== 13. FOOTER ====================== -->
<footer>
  <div class="container foot-top">
    <span class="monogram" aria-hidden="true">TN</span>
    <div class="foot-name" id="footName">Tu negocio</div>
    <div class="foot-est" id="footTagline">{{ $tagline ?: 'Tagline corto de la casa' }}</div>
    <div class="rule" style="max-width:340px;margin-inline:auto;"><span class="seg" style="border-color:var(--line);"></span><span class="star">✦</span><span class="seg" style="border-color:var(--line);"></span></div>
    <nav class="foot-links" aria-label="Pie">
      <a class="ulink" href="#servicios">Servicios</a>
      <a class="ulink" href="#nosotros">Nosotros</a>
      <a class="ulink" href="#galeria">Galería</a>
      <a class="ulink" href="#horario">Horario</a>
      <a class="ulink" href="#contacto">Contacto</a>
      <a class="ulink" href="https://www.google.com/" target="_blank" rel="noopener">Google</a>
    </nav>
    <div class="foot-bottom">© <span id="year"></span> <span id="footCopyName">Tu negocio</span> · Todos los derechos reservados · <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span></div>
  </div>
</footer>
@endsection

@push('body-end')
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
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ===== Menú móvil ===== */
  var burger = document.getElementById('burger');
  var sheet = document.getElementById('sheet');
  var sheetClose = document.getElementById('sheetClose');
  function openSheet(){ sheet.classList.add('open'); burger.setAttribute('aria-expanded','true'); }
  function closeSheet(){ sheet.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  burger.addEventListener('click', openSheet);
  sheetClose.addEventListener('click', closeSheet);
  sheet.addEventListener('click', function(e){ if(e.target === sheet) closeSheet(); });
  [].forEach.call(sheet.querySelectorAll('a'), function(a){ a.addEventListener('click', closeSheet); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeSheet(); });

  /* ===== Reveal clásico (chequeo de viewport, robusto) ===== */
  var revealEls = [];
  var revealTicking = false;
  function showInView(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for(var i = revealEls.length - 1; i >= 0; i--){
      var el = revealEls[i];
      if(!el || !el.isConnected || !el.getBoundingClientRect){ revealEls.splice(i, 1); continue; }
      var r = el.getBoundingClientRect();
      if(r.top < vh * 0.92 && r.bottom > 0){
        el.classList.add('in');
        revealEls.splice(i, 1);
      }
    }
    revealTicking = false;
  }
  function onRevealScroll(){ if(!revealTicking){ revealTicking = true; requestAnimationFrame(showInView); } }
  function collectRevealEls(){
    return [].slice.call(document.querySelectorAll('.reveal:not(.in), [data-stagger]:not(.in)'));
  }
  function registerRevealEls(els){
    if(!els || !els.length) return;
    els.forEach(function(el){
      if(revealEls.indexOf(el) < 0) revealEls.push(el);
    });
  }
  function republicaForceAboutExtrasVisible(){
    if(!document.body.classList.contains('embed-preview') && !document.body.classList.contains('republica-preview')) return;
    var root = document.getElementById('aboutExtraBlocks');
    if(!root) return;
    root.querySelectorAll('.reveal:not(.in), [data-stagger]:not(.in)').forEach(function(el){
      el.classList.add('in');
    });
  }
  function republicaRevealRefresh(){
    if(REDUCED){
      document.querySelectorAll('.reveal:not(.in), [data-stagger]:not(.in)').forEach(function(el){
        el.classList.add('in');
      });
      return;
    }
    registerRevealEls(collectRevealEls());
    showInView();
    republicaForceAboutExtrasVisible();
  }
  window.republicaForceAboutExtrasVisible = republicaForceAboutExtrasVisible;
  window.republicaRevealRefresh = republicaRevealRefresh;
  window.tvAnimationsRefresh = republicaRevealRefresh;
  revealEls = collectRevealEls();
  if(REDUCED){
    revealEls.forEach(function(el){ el.classList.add('in'); });
    revealEls = [];
  } else {
    window.addEventListener('scroll', onRevealScroll, { passive: true });
    window.addEventListener('resize', onRevealScroll, { passive: true });
    window.addEventListener('load', showInView);
    showInView();
    setTimeout(showInView, 400);
    setTimeout(function(){
      revealEls.forEach(function(el){ el.classList.add('in'); });
      revealEls = [];
    }, 2500);
  }

  /* ===== Ticker (duplicar para loop) ===== */
  var ticker = document.getElementById('ticker');
  if(ticker) ticker.innerHTML += ticker.innerHTML;

  /* ===== Carta / Servicios (ONEZ: menuGrid) ===== */
  var MENU_SKIP = [
    { name: 'Plato uno',   price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.', tag: 'Recomendación del chef' },
    { name: 'Plato dos',   price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.' },
    { name: 'Plato tres',  price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.' },
    { name: 'Plato cuatro',price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.', tag: 'Especialidad de la casa' },
    { name: 'Plato cinco', price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.' },
    { name: 'Plato seis',  price: '00€', desc: 'Descripción breve del plato: ingredientes principales y por qué es especial.' }
  ];
  var mg = document.getElementById('menuGrid');
  if(mg && false){
    mg.innerHTML = MENU_SKIP.map(function(m){
      return '<article class="menu-row">'
        + '<div class="menu-line"><span class="menu-name">' + m.name + '</span>'
        + '<span class="menu-dots" aria-hidden="true"></span>'
        + '<span class="menu-price num">' + m.price + '</span></div>'
        + '<p class="menu-desc">' + m.desc + '</p>'
        + (m.tag ? '<span class="menu-tag">★ ' + m.tag + '</span>' : '')
        + '</article>';
    }).join('');
  }

  /* ===== Galería móvil: dots (máx. 5, ventana deslizante) ===== */
  var GALLERY_MAX_DOTS = 5;

  window.getRepublicaGallerySlideIndex = function(gallery){
    var slides = gallery.querySelectorAll('.g-item');
    if(!slides.length) return 0;
    var scrollCenter = gallery.scrollLeft + gallery.clientWidth / 2;
    var best = 0;
    var bestDist = Infinity;
    for(var i = 0; i < slides.length; i++){
      var center = slides[i].offsetLeft + slides[i].offsetWidth / 2;
      var dist = Math.abs(center - scrollCenter);
      if(dist < bestDist){ bestDist = dist; best = i; }
    }
    return best;
  };

  window.getRepublicaGalleryDotWindow = function(total, active){
    if(total <= GALLERY_MAX_DOTS){
      return { size: total, start: 0, active: active };
    }
    var half = Math.floor(GALLERY_MAX_DOTS / 2);
    var start = active - half;
    if(start < 0) start = 0;
    if(start + GALLERY_MAX_DOTS > total) start = total - GALLERY_MAX_DOTS;
    return { size: GALLERY_MAX_DOTS, start: start, active: active - start };
  };

  window.updateRepublicaGalleryDot = function(){
    var gallery = document.getElementById('galleryLive');
    var dotsRoot = document.getElementById('galleryDots');
    if(!gallery || !dotsRoot || dotsRoot.hidden) return;
    var total = gallery.querySelectorAll('.g-item').length;
    if(!total) return;
    var slideIndex = window.getRepublicaGallerySlideIndex(gallery);
    var win = window.getRepublicaGalleryDotWindow(total, slideIndex);
    var dots = [].slice.call(dotsRoot.querySelectorAll('.gallery-dot'));
    for(var d = 0; d < dots.length; d++){
      var on = d === win.active;
      var edge = total > GALLERY_MAX_DOTS && (
        (d === 0 && win.start > 0) ||
        (d === dots.length - 1 && win.start + win.size < total)
      );
      dots[d].classList.toggle('is-current', on);
      dots[d].classList.toggle('is-edge', edge && !on);
      dots[d].setAttribute('aria-selected', on ? 'true' : 'false');
      dots[d].setAttribute('aria-label', 'Foto ' + (win.start + d + 1) + ' de ' + total);
      dots[d].setAttribute('data-slide-index', String(win.start + d));
    }
  };

  window.initRepublicaGalleryCarousel = function(){
    var gallery = document.getElementById('galleryLive');
    var dotsRoot = document.getElementById('galleryDots');
    if(!gallery || !dotsRoot) return;

    var items = [].slice.call(gallery.querySelectorAll('.g-item'));
    var isMobile = window.matchMedia('(max-width: 920px)').matches;
    var show = isMobile && items.length > 1;

    if(!show){
      dotsRoot.hidden = true;
      dotsRoot.innerHTML = '';
      return;
    }

    var dotCount = Math.min(items.length, GALLERY_MAX_DOTS);
    dotsRoot.hidden = false;
    dotsRoot.innerHTML = '';
    for(var i = 0; i < dotCount; i++){
      dotsRoot.innerHTML += '<button type="button" class="gallery-dot' + (i === 0 ? ' is-current' : '') + '" role="tab" aria-label="Foto ' + (i + 1) + ' de ' + items.length + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '" data-slide-index="' + i + '"></button>';
    }

    dotsRoot.onclick = function(e){
      var btn = e.target.closest('.gallery-dot');
      if(!btn) return;
      var idx = parseInt(btn.getAttribute('data-slide-index'), 10);
      var item = gallery.querySelectorAll('.g-item')[idx];
      if(!item) return;
      item.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    };

    if(!gallery.dataset.carouselBound){
      var ticking = false;
      function scheduleDotUpdate(){
        if(ticking) return;
        ticking = true;
        requestAnimationFrame(function(){
          window.updateRepublicaGalleryDot();
          ticking = false;
        });
      }
      gallery.addEventListener('scroll', scheduleDotUpdate, { passive: true });
      gallery.addEventListener('scrollend', scheduleDotUpdate, { passive: true });
      gallery.addEventListener('touchend', scheduleDotUpdate, { passive: true });
      window.addEventListener('resize', window.initRepublicaGalleryCarousel);
      window.matchMedia('(max-width: 920px)').addEventListener('change', window.initRepublicaGalleryCarousel);
      gallery.dataset.carouselBound = '1';
    }

    window.updateRepublicaGalleryDot();
  };
  window.initRepublicaGalleryCarousel();

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
(function initRepublicaPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1' || params.get('preview') === '1' || params.get('parentOrigin')) {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
    document.body.classList.add('republica-preview');
  }
})();

/* ONEZ / LocalWeb — la-republica-vintage */
var REPUBLICA_SCHEDULE_DEFAULT = [
  { day: 'Lunes',     open: '09:00', close: '23:00' },
  { day: 'Martes',    open: '09:00', close: '23:00' },
  { day: 'Miércoles', open: '09:00', close: '23:00' },
  { day: 'Jueves',    open: '09:00', close: '23:00' },
  { day: 'Viernes',   open: '09:00', close: '00:30' },
  { day: 'Sábado',    open: '10:00', close: '00:30' },
  { day: 'Domingo',   open: '10:00', close: '17:00' }
];
var SCHEDULE = REPUBLICA_SCHEDULE_DEFAULT.map(function (r) {
  return { day: r.day, open: r.open, close: r.close };
});

var REPUBLICA_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
  portada_2: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  portada_3: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
};

var REPUBLICA_DEFAULT_GALLERY =
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-orn">✦</span><span class="ph-label">FOTO · 01</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 02</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 03</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 04</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-label">FOTO · 05</span></div></figure>' +
  '<figure class="g-item"><div class="ph" role="img"><span class="ph-orn">★</span><span class="ph-label">FOTO · 06</span></div></figure>';

var republicaPreviewMap = null;
var republicaPreviewMarker = null;
var REPUBLICA_MAP_ZOOM = 18;

function shouldUseRepublicaSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('republica-preview');
}

function republicaResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseRepublicaSampleMedia()) return '';
  return REPUBLICA_PREVIEW_SAMPLE[sampleKey] || '';
}

function escapeRepHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRepAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatRepPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function renderRepublicaAboutExtras(sections) {
  var wrap = document.getElementById('aboutExtraBlocks');
  if (!wrap) return;
  wrap.className = 'rep-about-extras';
  var list = Array.isArray(sections) ? sections.filter(function (s) { return s != null; }) : [];
  if (list.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = list
    .map(function (sec, i) {
      var title = escapeRepHtml(String(sec.title || '').trim());
      var desc = escapeRepHtml(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mainTF = typeof lwIsMainAboutTextFirst === 'function' ? lwIsMainAboutTextFirst(wrap) : false;
      var textFirst = typeof lwAboutExtraTextFirst === 'function' ? lwAboutExtraTextFirst(i, mainTF) : i % 2 === 0;
      var gridMod = textFirst ? 'about-grid--text-first' : 'about-grid--photo-first';
      var chapter = String(i + 2).padStart(2, '0');
      var imgTag = img
        ? '<img class="rep-photo" src="' + escapeRepAttr(img) + '" alt="" loading="lazy" decoding="async"/>'
        : '';
      return (
        '<article class="about-grid ' +
        gridMod +
        ' about-extra rep-about-extra">' +
        '<figure class="about-figure reveal">' +
        '<div class="vphoto' +
        (img ? ' has-photo' : '') +
        '">' +
        '<div class="ph" role="img" aria-hidden="true">' +
        '<span class="ph-orn">✦</span>' +
        '<span class="ph-label">FOTO · ' +
        chapter +
        '</span></div>' +
        imgTag +
        '</div></figure>' +
        '<div class="about-body">' +
        '<span class="eyebrow flank reveal">— Capítulo ' +
        chapter +
        ' —</span>' +
        (title ? '<h3 class="reveal">' + title + '</h3>' : '') +
        (desc ? '<p class="lede reveal">' + desc + '</p>' : '') +
        '</div></article>'
      );
    })
    .join('');
  if (typeof window.republicaForceAboutExtrasVisible === 'function') {
    window.republicaForceAboutExtrasVisible();
  } else if (document.body.classList.contains('embed-preview') || document.body.classList.contains('republica-preview')) {
    wrap.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('in');
    });
  }
  if (typeof window.republicaRevealRefresh === 'function') {
    requestAnimationFrame(function () { window.republicaRevealRefresh(); });
  } else if (typeof window.lwRefreshAboutExtrasReveal === 'function') {
    window.lwRefreshAboutExtrasReveal();
  }
}

window.lwRenderAboutExtrasImpl = renderRepublicaAboutExtras;

function republicaSetVphoto(vphoto, src) {
  if (!vphoto) return;
  var s = src ? String(src).trim() : '';
  var ph = vphoto.querySelector('.ph');
  var img = vphoto.querySelector('img.rep-photo');
  if (s) {
    if (!img) {
      img = document.createElement('img');
      img.className = 'rep-photo';
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      vphoto.appendChild(img);
    }
    img.src = s;
    vphoto.classList.add('has-photo');
    if (ph) ph.classList.add('has-photo');
  } else {
    if (img) img.remove();
    vphoto.classList.remove('has-photo');
    if (ph) ph.classList.remove('has-photo');
  }
}

function updateRepublicaHeroPhotos(raw) {
  raw = raw || {};
  var hasAny =
    Object.prototype.hasOwnProperty.call(raw, 'portada') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_2') ||
    Object.prototype.hasOwnProperty.call(raw, 'portada_3');
  if (!hasAny && !shouldUseRepublicaSampleMedia()) return;
  republicaSetVphoto(document.getElementById('heroPhoto1'), republicaResolvePreviewPhotoSrc(raw.portada, 'portada'));
  republicaSetVphoto(document.getElementById('heroPhoto2'), republicaResolvePreviewPhotoSrc(raw.portada_2, 'portada_2'));
  republicaSetVphoto(document.getElementById('heroPhoto3'), republicaResolvePreviewPhotoSrc(raw.portada_3, 'portada_3'));
}

function updateRepublicaAboutPhoto(raw) {
  var wrap = document.getElementById('aboutPhotoWrap');
  if (!wrap) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseRepublicaSampleMedia()) return;
  republicaSetVphoto(wrap, republicaResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo'));
}

function renderRepublicaGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = REPUBLICA_DEFAULT_GALLERY;
    if (window.initRepublicaGalleryCarousel) window.initRepublicaGalleryCarousel();
    return;
  }
  root.innerHTML = list
    .map(function (src) {
      var esc = escapeRepAttr(src);
      return (
        '<figure class="g-item has-photo"><img class="rep-photo" src="' + esc + '" alt="" loading="lazy" decoding="async"></figure>'
      );
    })
    .join('');
  if (window.initRepublicaGalleryCarousel) window.initRepublicaGalleryCarousel();
}

function renderRepublicaServices(services) {
  var mg = document.getElementById('menuGrid');
  var sec = document.getElementById('servicios');
  if (!mg || !sec) return;
  var list = Array.isArray(services)
    ? services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  if (list.length === 0) {
    sec.classList.add('is-hidden');
    sec.style.display = 'none';
    mg.innerHTML = '';
    document.querySelectorAll('a[href="#servicios"]').forEach(function (a) {
      a.style.display = 'none';
    });
    return;
  }
  sec.classList.remove('is-hidden');
  sec.style.display = '';
  document.querySelectorAll('a[href="#servicios"]').forEach(function (a) {
    a.style.display = '';
  });
  mg.innerHTML = list
    .map(function (m) {
      var tag = m.tag || (m.highlight ? 'Especialidad de la casa' : '');
      return (
        '<article class="menu-row">' +
        '<div class="menu-line"><span class="menu-name">' + escapeRepHtml(String(m.name || '')) + '</span>' +
        '<span class="menu-dots" aria-hidden="true"></span>' +
        '<span class="menu-price num">' + escapeRepHtml(formatRepPrice(m.price)) + '</span></div>' +
        (m.description ? '<p class="menu-desc">' + escapeRepHtml(String(m.description)) + '</p>' : '') +
        (tag ? '<span class="menu-tag">★ ' + escapeRepHtml(String(tag)) + '</span>' : '') +
        '</article>'
      );
    })
    .join('');
}

function syncRepublicaScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = REPUBLICA_SCHEDULE_DEFAULT.map(function (r) {
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
  SCHEDULE = map.map(function (t) {
    var row = h[t[0]];
    if (!row || row.closed) return { day: t[1], open: null, close: null };
    return { day: t[1], open: row.open || '10:00', close: row.close || '20:00' };
  });
}

function dayIndex(js) {
  return (js + 6) % 7;
}

function renderRepublicaSchedule() {
  var schedEl = document.getElementById('schedule');
  if (!schedEl) return;
  var today = dayIndex(new Date().getDay());
  schedEl.innerHTML = SCHEDULE.map(function (row, i) {
    var closed = !row.open;
    var hours = closed ? 'Cerrado' : row.open + ' – ' + row.close;
    return (
      '<div class="sched-row ' +
      (i === today ? 'is-today ' : '') +
      (closed ? 'is-closed' : '') +
      '"><span class="day">' +
      escapeRepHtml(row.day) +
      '</span><span class="hours num">' +
      escapeRepHtml(hours) +
      '</span></div>'
    );
  }).join('');
}

function toMin(h) {
  var p = h.split(':');
  return +p[0] * 60 + +p[1];
}

function republicaStatus(now) {
  var idx = dayIndex(now.getDay());
  var row = SCHEDULE[idx];
  var cur = now.getHours() * 60 + now.getMinutes();
  if (!row || !row.open) return { open: false, text: 'Cerrado hoy', sub: 'Vuelve mañana o escríbenos.' };
  var o = toMin(row.open);
  var c = toMin(row.close);
  if (c <= o) c += 1440;
  if (cur >= o && cur < c) {
    return { open: true, text: 'Abierto · cierra a las ' + row.close, sub: 'Pásate a vernos o reserva tu mesa.' };
  }
  if (cur < o) return { open: false, text: 'Abrimos a las ' + row.open, sub: 'Te atendemos en cuanto abramos.' };
  return { open: false, text: 'Cerrado por hoy', sub: 'Escríbenos, te atendemos mañana.' };
}

function applyRepublicaStatus() {
  var s = republicaStatus(new Date());
  [['heroStatus', 'heroStatusLabel'], ['sideStatus', 'sideStatusLabel']].forEach(function (pair) {
    var pill = document.getElementById(pair[0]);
    var lbl = document.getElementById(pair[1]);
    if (!pill || !lbl) return;
    pill.classList.toggle('is-open', s.open);
    pill.classList.toggle('is-closed', !s.open);
    lbl.textContent = s.text;
  });
  var t = document.getElementById('sideStatusTitle');
  var x = document.getElementById('sideStatusText');
  if (t) t.textContent = s.open ? 'Estamos abiertos' : 'Ahora cerrado';
  if (x) x.textContent = s.sub;
}

function buildRepublicaDirectionsUrl(raw) {
  raw = raw || {};
  var manual = (raw.google_maps_url || '').trim();
  if (manual) return manual;
  var la = parseFloat(raw.map_lat);
  var lo = parseFloat(raw.map_lon);
  if (Number.isFinite(la) && Number.isFinite(lo)) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(la + ',' + lo);
  }
  var addr = (raw.direccion || '').trim();
  if (addr) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr);
  return '';
}

function destroyRepublicaPreviewMap() {
  if (republicaPreviewMap) {
    try {
      republicaPreviewMap.remove();
    } catch (e) {}
    republicaPreviewMap = null;
    republicaPreviewMarker = null;
  }
}

function lwWhenLeafletReady(cb) {
  if (window.__LW_SKIP_LEAFLET) return;
  var n = 0;
  function tick() {
    if (typeof L !== 'undefined') {
      cb();
      return;
    }
    if (++n < 80) setTimeout(tick, 50);
  }
  tick();
}

function republicaVintageIcon() {
  if (typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'vintage-marker',
    html:
      '<div style="width:40px;height:40px;border-radius:50%;background:#b8161b;color:#f5e6c8;display:grid;place-items:center;border:2px solid #d4a85a;box-shadow:0 0 0 4px #f5e6c8;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function updateRepublicaPreviewMap(lat, lon, label) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    lat = window.__lwLat;
    lon = window.__lwLon;
  }
  var container = document.getElementById('map');
  if (!container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyRepublicaPreviewMap();
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  function bootMap() {
    if (typeof L === 'undefined') return;
    container.classList.add('in');
    if (!republicaPreviewMap) {
      republicaPreviewMap = L.map(container, {
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([lat, lon], REPUBLICA_MAP_ZOOM);
      L.control.attribution({ prefix: false }).addTo(republicaPreviewMap);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(republicaPreviewMap);
    } else {
      republicaPreviewMap.setView([lat, lon], REPUBLICA_MAP_ZOOM);
    }
    if (republicaPreviewMarker) republicaPreviewMap.removeLayer(republicaPreviewMarker);
    var icon = republicaVintageIcon();
    republicaPreviewMarker = L.marker([lat, lon], { icon: icon, title: label || '' }).addTo(republicaPreviewMap);
    setTimeout(function () {
      if (republicaPreviewMap) republicaPreviewMap.invalidateSize();
    }, 120);
    setTimeout(function () {
      if (republicaPreviewMap) republicaPreviewMap.invalidateSize();
    }, 500);
  }
  lwWhenLeafletReady(bootMap);
}

function syncRepublicaTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services) ? raw.services : null;
  if (services) renderRepublicaServices(services);

  var gUrl = (raw.google_business_url || '').trim();
  var opSec = document.getElementById('opiniones');
  var gBtn = document.getElementById('gbizBtn');
  if (opSec) {
    if (gUrl) {
      opSec.classList.remove('is-hidden');
      opSec.style.display = '';
      if (gBtn) gBtn.href = gUrl;
      document.querySelectorAll('a[href="#opiniones"]').forEach(function (a) {
        a.style.display = '';
      });
    } else {
      opSec.classList.add('is-hidden');
      opSec.style.display = 'none';
      if (gBtn) gBtn.removeAttribute('href');
      document.querySelectorAll('a[href="#opiniones"]').forEach(function (a) {
        a.style.display = 'none';
      });
    }
  }

  var vcOn = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
  var vcUrl = (raw.vcard_download_url || '').trim();
  var vcSec = document.getElementById('tplVcardWrap');
  var vcA = document.getElementById('vcardBtn');
  if (vcSec) {
    if (vcOn && vcUrl) {
      vcSec.classList.remove('is-hidden');
      vcSec.style.display = '';
      if (vcA) vcA.href = vcUrl;
    } else {
      vcSec.classList.add('is-hidden');
      vcSec.style.display = 'none';
      if (vcA) vcA.removeAttribute('href');
    }
  }
}

function applyLivePreviewData(raw, opts) {
  opts = opts || {};
  raw = raw || {};
  var name = (raw.nombre || '').trim() || 'Tu negocio';
  var tagline = (raw.tagline || '').trim() || 'Tagline corto de la casa';
  var descripcion = (raw.descripcion || '').trim();
  var direccion = (raw.direccion || '').trim();
  var correo = (raw.correo || '').trim();
  var ciudad = (raw.ciudad || '').trim();
  var year = (raw.anio_fundacion || '').trim() || String(new Date().getFullYear());
  var initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) {
      return w.charAt(0).toUpperCase();
    })
    .join('') || 'TN';

  document.title = name + ' — Vintage';

  var nav = document.querySelector('.nav');
  if (nav) {
    if ((raw.logo_url || '').trim()) {
      var lsc =
        typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : 1.35;
      lsc = Math.min(1.5, Math.max(0.45, lsc));
      nav.style.setProperty('--lw-logo-scale', String(lsc));
    } else {
      nav.style.removeProperty('--lw-logo-scale');
    }
  }

  var navBrandWrap = document.getElementById('navBrandWrap');
  var navBrandLogo = document.getElementById('navBrandLogo');
  var navBrandName = document.getElementById('navBrandName');
  var logoUrl = (raw.logo_url || '').trim();
  if (navBrandWrap && navBrandLogo && navBrandName) {
    if (logoUrl) {
      navBrandLogo.src = logoUrl;
      navBrandLogo.alt = name;
      navBrandLogo.hidden = false;
      navBrandName.style.display = 'none';
      navBrandWrap.classList.add('brand-has-img');
    } else {
      navBrandLogo.removeAttribute('src');
      navBrandLogo.hidden = true;
      navBrandName.style.display = '';
      navBrandName.textContent = name;
      navBrandWrap.classList.remove('brand-has-img');
    }
  }

  var heroTitle = document.getElementById('heroTitle');
  var heroSub = document.getElementById('heroSub');
  if (heroTitle) heroTitle.textContent = name;
  if (heroSub) heroSub.textContent = tagline;

  var aboutTitle = document.getElementById('aboutTitle');
  var aboutLede = document.getElementById('aboutLede');
  if (aboutTitle) {
    var customAboutTitle = (raw.about_title || '').trim();
    aboutTitle.textContent = customAboutTitle
      ? customAboutTitle
      : 'Una casa con oficio, abierta desde ' + (year || 'siempre');
  }
  if (aboutLede && descripcion) aboutLede.textContent = descripcion;

  document.querySelectorAll('.monogram, .bmark').forEach(function (el) {
    if (el.id === 'navBrandLogo') return;
    el.textContent = initials;
  });
  var footName = document.getElementById('footName');
  if (footName) footName.textContent = name;
  var footTagline = document.getElementById('footTagline');
  if (footTagline) footTagline.textContent = tagline;

  var vcardMeta = document.getElementById('vcardMeta');
  if (vcardMeta) vcardMeta.textContent = name;

  var contactAddr = document.getElementById('contactAddressValue');
  if (contactAddr) contactAddr.textContent = direccion || ciudad || 'Calle Ejemplo, 00';

  var mapsUrl = buildRepublicaDirectionsUrl(raw);
  var addrCard = document.getElementById('contactAddressCard');
  if (addrCard) {
    if (mapsUrl) addrCard.href = mapsUrl;
    else addrCard.href = '#mapa';
  }

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var phoneRaw = (raw.telefono || '').trim();
  if (!phoneRaw && raw.whatsapp) {
    var waDigits = String(raw.whatsapp).replace(/\D/g, '');
    if (waDigits) phoneRaw = '+' + waDigits;
  }
  if (!phoneRaw && shouldUseRepublicaSampleMedia()) phoneRaw = '+34 915 12 34 56';
  var contactPhone = document.getElementById('contactPhone');
  if (contactPhone) contactPhone.textContent = phoneRaw || '+00 000 000 000';
  var contactWaValue = document.getElementById('contactWaValue');
  if (contactWaValue) contactWaValue.textContent = phoneRaw || '+00 000 000 000';

  var emailVal = document.getElementById('contactEmailValue');
  var emailCard = document.getElementById('contactEmailCard');
  if (emailVal) emailVal.textContent = correo || 'correo@ejemplo.com';
  if (emailCard && correo) emailCard.href = 'mailto:' + correo;

  updateRepublicaHeroPhotos(raw);
  updateRepublicaAboutPhoto(raw);
  if (Object.prototype.hasOwnProperty.call(raw, 'galeria')) {
    renderRepublicaGallery(raw.galeria);
  }
  syncRepublicaScheduleFromPreview(raw.horario);
  renderRepublicaSchedule();
  applyRepublicaStatus();
  syncRepublicaTemplateExtensions(raw);

  var lat = parseFloat(raw.map_lat);
  var lon = parseFloat(raw.map_lon);
  if ((!Number.isFinite(lat) || !Number.isFinite(lon)) && (shouldUseRepublicaSampleMedia() || document.body.classList.contains('embed-preview') || document.body.classList.contains('republica-preview'))) {
    lat = 40.4168;
    lon = -3.7038;
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    updateRepublicaPreviewMap(lat, lon, name);
  } else {
    destroyRepublicaPreviewMap();
  }
}

(function initLivePreviewFromQuery() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('landingDemo') === '1') return;
  if (!params.has('preview')) {
    syncRepublicaScheduleFromPreview(null);
    renderRepublicaSchedule();
    applyRepublicaStatus();
    setInterval(applyRepublicaStatus, 60000);
    syncRepublicaTemplateExtensions({});
    var ticker = document.getElementById('ticker');
    if (ticker && !ticker.dataset.lwDuped) {
      ticker.innerHTML += ticker.innerHTML;
      ticker.dataset.lwDuped = '1';
    }
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
      pais: params.get('pais') || '',
    },
    { alignToHash: !!window.location.hash.replace(/^#/, '') }
  );
})();

</script>
<script src="/templates/lw-about-extras.js?v=2"></script>
<script src="/templates/lw-landing-demo.js?v=2"></script>

<!--
LW-CONTRACT-VERSION: 1
Public: applyLivePreviewData, initLivePreviewFromQuery, initSecureMessageListener
-->

@endverbatim

<script>
(function bootLaRepublicaVintageTenantPage() {
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
        anio_fundacion: @json($anio_fundacion),
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
    if (typeof syncRepublicaScheduleFromPreview === 'function') syncRepublicaScheduleFromPreview(@json($horario));
    if (typeof renderRepublicaSchedule === 'function') renderRepublicaSchedule();
    if (typeof applyRepublicaStatus === 'function') applyRepublicaStatus();
    if (typeof updateRepublicaPreviewMap === 'function') {
      updateRepublicaPreviewMap(
        typeof window.__lwLat === 'number' ? window.__lwLat : @json(is_numeric($map_lat) ? $map_lat : null),
        typeof window.__lwLon === 'number' ? window.__lwLon : @json(is_numeric($map_lon) ? $map_lon : null),
        @json($nombre)
      );
    }
    if (typeof window.republicaRevealRefresh === 'function') {
      requestAnimationFrame(function () { window.republicaRevealRefresh(); });
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
