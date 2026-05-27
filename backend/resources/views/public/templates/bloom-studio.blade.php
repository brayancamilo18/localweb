@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=DM+Sans:wght@400;500;700&display=swap"/>
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
  /* ─── TOKENS ──────────────────────────────────────── */
  :root{
    --bg:#FAFAF8; --dark:#1A1A2E; --dark-2:#13132a;
    --coral:#E8572A; --peach:color-mix(in srgb, var(--coral) 35%, #ffffff); --blush:color-mix(in srgb, var(--coral) 75%, #ffffff);
    --ink:#1C1C1C; --light:#F5F0E8;
    --serif:"Playfair Display", serif;
    --sans:"DM Sans", ui-sans-serif, system-ui, sans-serif;
  }
  *{ box-sizing:border-box; margin:0; padding:0; }
  html{ scroll-behavior:smooth; }
  body{
    background:var(--bg); color:var(--ink);
    font-family:var(--sans); line-height:1.6;
    overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
  }
  ::selection{ background:var(--coral); color:#fff; }
  a{ color:inherit; text-decoration:none; }
  img{ display:block; max-width:100%; }

  .wrap{ max-width:1240px; margin:0 auto; padding:0 32px; }

  /* ─── REVEAL (alterna izquierda/derecha) ────────────── */
  .r-left, .r-right, .r-up{
    opacity:0; transition:opacity .9s ease, transform .9s cubic-bezier(.2,.7,.2,1);
  }
  .r-left{ transform:translateX(-40px); }
  .r-right{ transform:translateX(40px); }
  .r-up{ transform:translateY(28px); }
  .reveal .r-left, .reveal .r-right, .reveal .r-up{ opacity:1; transform:none; }
  .d-1{ transition-delay:.1s; } .d-2{ transition-delay:.22s; }
  .d-3{ transition-delay:.34s; } .d-4{ transition-delay:.46s; }

  /* ─── NAV ─────────────────────────────────────────── */
  nav.top{
    position:fixed; inset:0 0 auto 0; z-index:9000;
    background:rgba(250,250,248,.86);
    backdrop-filter:saturate(180%) blur(14px);
    -webkit-backdrop-filter:saturate(180%) blur(14px);
    border-bottom:1px solid rgba(28,28,28,.06);
    padding:14px 0;
    transition:padding .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1);
  }
  nav.top.bumped{ animation:bump .55s cubic-bezier(.34,1.56,.64,1); }
  @keyframes bump{
    0%  { transform:scale(.95); }
    60% { transform:scale(1.02); }
    100%{ transform:scale(1); }
  }
  nav.top .row{ display:flex; align-items:center; justify-content:space-between; gap:24px; }
  .logo{ font-family:var(--serif); font-weight:600; font-size:22px; display:flex; align-items:center; gap:10px; letter-spacing:-.01em; }
  nav.top{ --lw-logo-scale:1; }
  nav.top .logo.brand-has-img .nav-brand-img{
    display:block;
    height:calc(40px * var(--lw-logo-scale, 1));
    width:auto;
    max-width:calc(180px * var(--lw-logo-scale, 1));
    object-fit:contain;
    image-rendering:auto;
  }
  nav.top .logo.brand-has-img .nav-brand-dot{ display:none !important; }
  nav.top .logo.brand-has-img #brandLogo{ display:none !important; }
  .logo .dot{ width:10px; height:10px; border-radius:999px; background:var(--coral); display:inline-block; }
  .links{ display:flex; gap:30px; }
  .links a{ font-size:14px; font-weight:500; color:var(--ink); position:relative; }
  .links a::after{
    content:""; position:absolute; left:0; right:0; bottom:-4px;
    height:2px; background:var(--coral); border-radius:2px;
    transform:scaleX(0); transform-origin:left; transition:transform .4s cubic-bezier(.2,.7,.2,1);
  }
  .links a:hover::after{ transform:scaleX(1); }

  /* Buttons (liquid fill) */
  .btn{
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 24px; border-radius:99px; font-weight:500; font-size:15px;
    border:none; cursor:pointer; position:relative; overflow:hidden; isolation:isolate; z-index:0;
    transition:color .3s ease, transform .25s ease, box-shadow .3s ease;
    background:var(--ink); color:#fff;
  }
  .btn svg{ width:15px; height:15px; }
  .btn::before{
    content:""; position:absolute; inset:0; background:var(--coral);
    transform:translateY(101%); transition:transform .5s cubic-bezier(.6,.05,.4,1);
    z-index:-1;
  }
  .btn:hover::before{ transform:translateY(0); }
  .btn:active{ transform:scale(.97); }

  .btn.coral{ background:var(--coral); color:#fff; }
  .btn.coral::before{ background:var(--ink); }
  .btn.cream{ background:#fff; color:var(--coral); }
  .btn.cream::before{ background:var(--coral); }
  .btn.cream:hover{ color:#fff; }
  .btn.outline{ background:transparent; color:var(--ink); border:1.5px solid var(--ink); }
  .btn.outline.light{ color:#fff; border-color:rgba(255,255,255,.7); }
  .btn.outline::before{ background:var(--ink); }
  .btn.outline:hover{ color:var(--coral); }
  .btn.outline.light::before{ background:#fff; }
  .btn.outline.light:hover{ color:var(--coral); }
  .btn.sm{ padding:10px 18px; font-size:14px; }

  /* Burger */
  .burger{
    display:none; width:38px; height:38px; position:relative; cursor:pointer;
    background:rgba(26,26,46,.72);
    border:1px solid rgba(244,162,97,.45);
    border-radius:8px;
    padding:0;
  }
  .burger span{ position:absolute; left:8px; right:8px; height:2px; background:var(--peach); border-radius:2px; transition:transform .35s, top .35s, opacity .25s; }
  .burger span:nth-child(1){ top:13px; }
  .burger span:nth-child(2){ top:20px; }
  body.menu-open .burger span:nth-child(1){ top:17px; transform:rotate(45deg); }
  body.menu-open .burger span:nth-child(2){ top:17px; transform:rotate(-45deg); }
  .sheet{
    position:fixed; inset:0; background:var(--bg); z-index:8999;
    display:flex; align-items:center; justify-content:center;
    opacity:0; pointer-events:none; transition:opacity .35s ease;
  }
  body.menu-open .sheet{ opacity:1; pointer-events:auto; }
  .sheet ul{ list-style:none; text-align:center; display:flex; flex-direction:column; gap:24px; }
  .sheet a{ font-family:var(--serif); font-size:32px; font-weight:600; }
  .sheet a em{ color:var(--coral); }

  /* ─── HERO ────────────────────────────────────────── */
  header.hero{ position:relative; height:100vh; min-height:680px; overflow:hidden; isolation:isolate; padding-top:64px; }
  .hero-photo{
    position:absolute; inset:0; z-index:-3;
    background:url("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80") center/cover;
  }
  .hero-grad{
    position:absolute; inset:0; z-index:-2;
    background:linear-gradient(120deg, var(--coral), var(--peach), var(--blush), var(--coral));
    background-size:300% 300%;
    mix-blend-mode:overlay;
    animation:gradShift 14s ease-in-out infinite;
  }
  .hero-darken{
    position:absolute; inset:0; z-index:-1;
    background:linear-gradient(180deg, rgba(26,26,46,.15) 0%, rgba(26,26,46,.5) 100%);
  }
  @keyframes gradShift{
    0%,100%{ background-position:0% 50%; }
    50%   { background-position:100% 50%; }
  }
  /* Floating shapes */
  .shape{ position:absolute; border:1.5px solid; border-radius:999px; opacity:.28; pointer-events:none; }
  .shape.s1{ width:280px; height:280px; left:6%; top:18%; border-color:var(--blush); animation:float1 7s ease-in-out infinite; }
  .shape.s2{ width:160px; height:160px; right:8%; top:24%; border-color:var(--peach); animation:float2 8s ease-in-out infinite -1s; opacity:.45; }
  .shape.s3{ width:380px; height:200px; right:14%; bottom:6%; border-color:var(--blush); border-radius:50%; transform:rotate(-12deg); animation:float1 9s ease-in-out infinite -2s; }
  .shape.s4{ width:90px; height:90px; left:18%; bottom:18%; border-color:var(--coral); animation:float2 6s ease-in-out infinite -3s; opacity:.5; }
  .shape.s5{ width:60px; height:60px; right:30%; top:42%; border-color:#fff; border-width:1px; animation:float1 7s ease-in-out infinite -1.5s; }
  @keyframes float1{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-22px); } }
  @keyframes float2{ 0%,100%{ transform:translateY(0) rotate(0); } 50%{ transform:translateY(18px) rotate(8deg); } }
  .hero-inner{
    position:relative; height:calc(100% - 64px); display:flex; flex-direction:column;
    justify-content:center; gap:24px; padding:0 32px;
    color:#fff; max-width:1240px; margin:0 auto;
  }
  .hero-eyebrow{
    display:inline-flex; align-items:center; gap:10px; align-self:flex-start;
    padding:8px 16px; border-radius:99px;
    background:rgba(255,255,255,.18); backdrop-filter:blur(10px);
    -webkit-backdrop-filter:blur(10px);
    font-size:13px; font-weight:500;
  }
  .hero-eyebrow .pill-dot{ width:8px; height:8px; border-radius:999px; background:#7CD992; box-shadow:0 0 0 0 rgba(124,217,146,.6); animation:pulse 2.4s infinite; }
  @keyframes pulse{
    0%{ box-shadow:0 0 0 0 rgba(124,217,146,.6); }
    70%{ box-shadow:0 0 0 10px rgba(124,217,146,0); }
    100%{ box-shadow:0 0 0 0 rgba(124,217,146,0); }
  }
  .hero-title{
    font-family:var(--serif); font-weight:600;
    font-size:clamp(48px, 8.5vw, 96px); line-height:.96;
    letter-spacing:-.02em; max-width:960px;
  }
  .hero-title em{ font-style:italic; color:var(--blush); font-weight:500; }
  .hero-tagline{ font-size:17px; opacity:.92; max-width:540px; line-height:1.6; }
  .hero-actions{ display:flex; gap:12px; flex-wrap:wrap; }
  .hero-meta{
    position:absolute; left:32px; right:32px; bottom:32px;
    display:flex; justify-content:space-between; align-items:flex-end; gap:24px;
    color:rgba(255,255,255,.85); font-size:13px;
  }
  .hero-meta .item{ display:flex; flex-direction:column; gap:2px; }
  .hero-meta .num{ font-family:var(--serif); font-size:38px; line-height:1; color:#fff; }
  .hero-meta .num em{ color:var(--blush); font-style:italic; }

  /* ─── SECTIONS ─────────────────────────────────────── */
  section{ padding:140px 0; position:relative; }
  .eyebrow-coral{
    display:inline-flex; align-items:center; gap:8px;
    color:var(--coral); font-size:13px; font-weight:500; letter-spacing:.04em; margin-bottom:14px;
    text-transform:uppercase;
  }
  .eyebrow-coral::before{ content:""; display:inline-block; width:24px; height:2px; background:var(--coral); border-radius:2px; }

  /* About */
  #sobre-nosotros{ background:var(--bg); }
  .about{
    display:grid; grid-template-columns:1fr 1.05fr; gap:80px; align-items:center;
  }
  .about-photo{
    aspect-ratio:4/5; position:relative;
    background:url("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80") center/cover;
    border-radius:8px;
    clip-path:polygon(0 0, 96% 0, 100% 8%, 100% 100%, 4% 100%, 0 92%);
  }
  .about-photo .badge{
    position:absolute; left:-22px; bottom:30px;
    background:var(--coral); color:#fff;
    padding:14px 22px; border-radius:99px;
    font-weight:500; font-size:14px; box-shadow:0 14px 40px color-mix(in srgb, var(--coral) 35%, transparent);
    display:flex; align-items:center; gap:10px;
  }
  .about-photo .badge .star{ color:#FFCD66; }
  .about-text h2{
    font-family:var(--serif); font-weight:600;
    font-size:clamp(36px, 4.4vw, 56px); line-height:1.05; letter-spacing:-.02em;
    margin-bottom:22px;
  }
  .about-text h2 em{ color:var(--coral); font-style:italic; font-weight:500; }
  .about-text p{ font-size:16px; line-height:1.85; color:rgba(28,28,28,.78); margin-bottom:14px; max-width:48ch; }
  .about-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:30px; }
  .pill-tel{
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 22px; border-radius:99px; background:var(--coral); color:#fff;
    font-weight:500; font-size:15px; box-shadow:0 12px 30px color-mix(in srgb, var(--coral) 25%, transparent);
    transition:transform .25s ease, box-shadow .3s ease;
  }
  .pill-tel:hover{ transform:translateY(-2px); box-shadow:0 18px 40px color-mix(in srgb, var(--coral) 35%, transparent); }
  .pill-tel svg{ width:16px; height:16px; }

  /* Services strip (replaces nothing — adds personality, optional) */

  /* Galería oscura */
  #galeria{ background:var(--dark); color:var(--light); }
  .gallery-head{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:20px; margin-bottom:48px; }
  .gallery-head h2{
    font-family:var(--serif); font-weight:600;
    font-size:clamp(40px, 5vw, 64px); letter-spacing:-.02em; line-height:1;
    max-width:14ch;
  }
  .gallery-head h2 em{ color:var(--coral); font-style:italic; }
  .gallery-head .right{ max-width:340px; color:rgba(245,240,232,.7); font-size:15px; line-height:1.7; }
  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
    gap:18px;
  }
  .grid .photo{
    aspect-ratio:4/5; border-radius:16px; overflow:hidden; position:relative;
    transform:translateY(20px); opacity:0;
    transition:opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease;
  }
  .reveal .grid .photo{ opacity:1; transform:translateY(0); }
  .grid .photo img{ width:100%; height:100%; object-fit:cover; transition:transform .55s cubic-bezier(.2,.7,.2,1); }
  .grid .photo:hover{ box-shadow:0 24px 60px color-mix(in srgb, var(--coral) 35%, transparent); }
  .grid .photo:hover img{ transform:scale(1.05); }
  .grid .photo.tall{ grid-row:span 2; aspect-ratio:auto; }
  .grid .photo .tag{
    position:absolute; left:14px; bottom:14px;
    background:rgba(255,255,255,.92); color:var(--ink);
    padding:6px 12px; border-radius:99px;
    font-size:12px; font-weight:500;
  }

  /* Galería slider (modo Pro) */
  .grid.gallery-slider{
    position:relative;
    display:block;
    min-height:360px;
  }
  .grid.gallery-slider .photo{
    display:none;
    aspect-ratio:auto;
    transform:none;
    opacity:1;
    border-radius:16px;
  }
  .grid.gallery-slider .photo.is-active{
    display:block;
  }
  .grid.gallery-slider .photo img{
    width:100%;
    height:clamp(300px, 52vw, 560px);
    object-fit:cover;
  }
  .bloom-gallery-nav-btn{
    position:absolute;
    top:50%;
    transform:translateY(-50%);
    width:40px;
    height:40px;
    border-radius:999px;
    border:1px solid rgba(245,240,232,.35);
    background:rgba(20,17,14,.55);
    color:#fff;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:3;
  }
  .bloom-gallery-nav-btn.prev{ left:10px; }
  .bloom-gallery-nav-btn.next{ right:10px; }

  /* Horario */
  #horario{ background:var(--bg); }
  .sched-head{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; margin-bottom:44px; }
  .sched-head h2{ font-family:var(--serif); font-weight:600; font-size:clamp(36px, 4.4vw, 56px); letter-spacing:-.02em; }
  .sched-head h2 em{ color:var(--coral); font-style:italic; }
  .status{
    display:inline-flex; align-items:center; gap:10px;
    padding:8px 16px; border-radius:99px;
    background:rgba(28,28,28,.06); color:rgba(28,28,28,.7);
    font-size:13px; font-weight:500;
  }
  .status.open{ background:rgba(124,193,139,.15); color:#3F8C57; }
  .status .pulse{ width:8px; height:8px; border-radius:999px; background:currentColor; box-shadow:0 0 0 0 currentColor; }
  .status.open .pulse{ animation:pulse 2.4s infinite; }
  .days{
    display:grid; grid-template-columns:repeat(7, 1fr); gap:14px;
  }
  @media (max-width:980px){
    .days{ display:flex; gap:12px; overflow-x:auto; padding-bottom:14px; scroll-snap-type:x mandatory; margin:0 -16px; padding:0 16px 14px; }
    .days .card{ min-width:160px; scroll-snap-align:start; }
  }
  .days .card{
    background:#fff; border:1px solid rgba(28,28,28,.06);
    border-bottom:3px solid var(--coral);
    border-radius:16px; padding:18px 16px;
    display:flex; flex-direction:column; gap:8px;
    transition:transform .3s ease, box-shadow .3s ease;
  }
  .days .card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(28,28,28,.08); }
  .days .card .dname{ font-size:13px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--ink); }
  .days .card .dhours{ font-family:var(--serif); font-size:18px; font-weight:500; }
  .days .card .dlabel{ font-size:11px; color:rgba(28,28,28,.5); margin-top:auto; }
  .days .card.today{
    background:var(--coral); color:#fff; border-color:var(--coral);
    box-shadow:0 18px 40px color-mix(in srgb, var(--coral) 30%, transparent);
    animation:todayPulse 2.6s ease-in-out infinite;
  }
  .days .card.today .dname,
  .days .card.today .dhours{ color:#fff; }
  .days .card.today .dlabel{ color:rgba(255,255,255,.85); }
  @keyframes todayPulse{
    0%,100%{ transform:scale(1); }
    50%   { transform:scale(1.02); }
  }
  .days .card.closed .dhours{ color:rgba(28,28,28,.4); font-style:italic; }

  /* Footer */
  footer{ background:var(--dark); color:var(--light); padding:80px 0 28px; position:relative; overflow:hidden; }
  footer::before{
    content:""; position:absolute; left:0; right:0; top:0; height:3px;
    background:linear-gradient(90deg, var(--coral), var(--peach), var(--coral));
  }
  .foot{
    display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:48px;
    padding-bottom:40px; border-bottom:1px solid rgba(245,240,232,.12);
  }
  .foot-h{ font-size:13px; letter-spacing:.04em; color:var(--peach); margin-bottom:14px; font-weight:500; text-transform:uppercase; }
  .foot p, .foot li{ color:rgba(245,240,232,.78); font-size:14px; line-height:1.8; }
  .foot ul{ list-style:none; display:flex; flex-direction:column; gap:8px; }
  .foot .logo{ color:var(--light); margin-bottom:14px; }
  .foot .logo .dot{ background:var(--coral); }
  .social{ display:flex; gap:10px; margin-top:14px; }
  .social a{
    width:38px; height:38px; border-radius:999px;
    border:1px solid rgba(245,240,232,.2);
    display:inline-flex; align-items:center; justify-content:center;
    color:var(--light);
    transition:background .3s, color .3s, border-color .3s, transform .3s;
  }
  .social a:hover{ background:var(--coral); color:#fff; border-color:var(--coral); transform:translateY(-2px); }
  .foot-bottom{
    display:flex; justify-content:space-between; align-items:center;
    padding-top:24px; color:rgba(245,240,232,.45); font-size:13px;
  }
  .foot-bottom a{ color:rgba(245,240,232,.7); }

  .bloom-map-block{ padding-bottom:44px; margin-bottom:8px; border-bottom:1px solid rgba(245,240,232,.12); }
  .bloom-map-eyebrow{ font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--peach); text-align:center; display:block; margin-bottom:12px; }
  .bloom-map-sub{ text-align:center; color:rgba(245,240,232,.65); font-size:14px; max-width:640px; margin:0 auto 20px; line-height:1.55; }
  .bloom-map-shell{
    position:relative;
    border-radius:14px; overflow:hidden; border:1px solid rgba(245,240,232,.18); max-width:920px; margin:0 auto;
  }
  .bloom-map-directions-row{
    display:none;
    justify-content:center;
    align-items:center;
    margin:18px auto 0;
    max-width:920px;
  }
  .bloom-map-leaflet{
    height:min(300px,48vh);
    min-height:220px;
    width:100%;
    border-radius:14px;
    background:var(--dark-2);
  }
  .bloom-map-shell .leaflet-container{
    font-family:var(--sans);
    background:var(--dark-2);
    border-radius:14px;
  }
  .bloom-map-shell .leaflet-control-zoom a{
    display:flex;
    align-items:center;
    justify-content:center;
    width:36px;
    height:36px;
    padding:0;
    line-height:1;
    font-size:22px;
    text-align:center;
    text-decoration:none;
    background:rgba(26,26,46,.95);
    color:var(--peach);
    border-color:rgba(245,240,232,.2);
  }
  .bloom-map-shell .leaflet-control-zoom a:hover{
    background:color-mix(in srgb, var(--coral) 25%, transparent);
    color:var(--light);
  }
  .bloom-map-shell .leaflet-bar{ border-color:rgba(245,240,232,.2); }
  .bloom-map-shell .leaflet-control-attribution{
    background:rgba(19,19,42,.88) !important;
    color:rgba(245,240,232,.45) !important;
    font-size:10px !important;
    max-width:100%;
  }
  .bloom-map-shell .leaflet-control-attribution a{ color:var(--peach) !important; }
  .bloom-leaflet-divicon{
    background:transparent !important;
    border:none !important;
  }
  .bloom-map-pin-wrap{
    position:relative;
    width:56px;height:56px;
    display:flex;align-items:center;justify-content:center;
    pointer-events:none;
  }
  .bloom-map-core{
    width:14px;height:14px;border-radius:50%;
    background:var(--coral);
    border:2px solid #fff;
    box-shadow:0 0 0 1px color-mix(in srgb, var(--coral) 40%, transparent), 0 4px 16px rgba(0,0,0,.45);
    position:relative;z-index:2;
  }
  .bloom-map-radar-ring{
    position:absolute;
    left:50%;top:50%;
    width:46px;height:46px;margin:-23px 0 0 -23px;
    border-radius:50%;
    border:1px solid rgba(244,162,97,.55);
    box-shadow:0 0 14px color-mix(in srgb, var(--coral) 15%, transparent);
    animation:bloomMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;
    pointer-events:none;
  }
  .bloom-map-radar-ring.d2{ animation-delay:1.25s; }
  @keyframes bloomMapRadar{
    0%{ transform:scale(0.4); opacity:0.95; }
    65%{ opacity:0.2; }
    100%{ transform:scale(2.15); opacity:0; }
  }
  .bloom-map-placeholder{ text-align:center; color:rgba(245,240,232,.5); font-size:13px; padding:32px 20px; border:1px dashed rgba(245,240,232,.2); border-radius:14px; max-width:640px; margin:0 auto; line-height:1.6; }

  /* ─── Extras Pro (servicios, enlaces, vCard) ─────────── */
  #servicios{ background:var(--light); padding:120px 0; }
  .bloom-services-grid{
    display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:18px;
    max-width:1000px; margin:0 auto;
  }
  .bloom-svc-card{
    background:#fff; border:1px solid rgba(28,28,28,.08);
    border-radius:16px; padding:22px 20px;
    border-bottom:3px solid var(--coral);
    box-shadow:0 8px 24px rgba(28,28,28,.04);
    transition:transform .3s ease, box-shadow .3s ease;
  }
  .bloom-svc-card:hover{ transform:translateY(-3px); box-shadow:0 16px 36px color-mix(in srgb, var(--coral) 12%, transparent); }
  .bloom-svc-name{ font-family:var(--serif); font-size:22px; font-weight:600; letter-spacing:-.02em; margin:0 0 8px; color:var(--ink); }
  .bloom-svc-price{ color:var(--coral); font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; margin-bottom:8px; }
  .bloom-svc-desc{ color:rgba(28,28,28,.72); font-size:15px; line-height:1.75; margin:0; }
  .bloom-reviews-sub{ max-width:640px; margin:16px auto 0; text-align:center; color:rgba(245,240,232,.72); font-size:16px; line-height:1.75; font-weight:400; }
  #opiniones.bloom-reviews-section{ background:var(--dark-2); color:var(--light); }
  #opiniones .sched-head h2{ color:var(--light); }

  /* Easter egg: hover the dot in the logo and a rosette blooms */
  .logo .dot{ position:relative; cursor:pointer; transition:transform .4s cubic-bezier(.34,1.56,.64,1); }
  .logo .dot::before, .logo .dot::after{
    content:""; position:absolute; inset:-4px; border-radius:999px;
    border:1.5px solid var(--coral); opacity:0; transform:scale(.5);
    transition:opacity .35s ease, transform .55s cubic-bezier(.34,1.56,.64,1);
  }
  .logo .dot::after{ inset:-9px; border-color:var(--peach); transition-delay:.07s; }
  .logo:hover .dot{ transform:rotate(180deg); }
  .logo:hover .dot::before, .logo:hover .dot::after{ opacity:.9; transform:scale(1); }

  /* Responsive */
  @media (max-width:980px){
    .links, .desk-cta{ display:none; }
    .burger{ display:block; }
    .about{ grid-template-columns:1fr; gap:48px; }
    .foot{ grid-template-columns:1fr; gap:32px; }
    .hero-meta{ display:none; }
    section{ padding:96px 0; }
  }
  html.embed-preview-root{ scroll-behavior:auto !important; }
  body.embed-preview #horario{ scroll-margin-top:88px; }
  @media (max-width:560px){
    .grid{ grid-template-columns:1fr; }
    .hero-actions{ flex-direction:column; align-items:stretch; }
    .btn{ justify-content:center; }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion:reduce){
    *, *::before, *::after{
      animation-duration:.01ms !important; animation-iteration-count:1 !important;
      transition-duration:.01ms !important; scroll-behavior:auto !important;
    }
    .r-left, .r-right, .r-up{ opacity:1 !important; transform:none !important; }
    .grid .photo{ opacity:1 !important; transform:none !important; }
  }
  /* LW · lightbox galería */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;font-family:system-ui,sans-serif}
  @media (max-width:640px){ .lw-gallery-lightbox-close{top:8px;right:8px} }
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')

<!-- ═══ NAV ════════════════════════════════════════════ -->
<nav class="top" id="nav">
  <div class="wrap row">
    <a href="#portada" class="logo" id="bloomNavBrandWrap">
      <span class="dot nav-brand-dot" aria-hidden="true"></span>
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span id="brandLogo">Salón Margarita</span>
    </a>
    <div class="links">
      <!-- Orden = orden visual de las secciones del HTML (portada → sobre-nosotros
           → servicios → galeria → opiniones → horario → contacto/footer). -->
      <a href="#portada">Inicio</a>
      <a href="#sobre-nosotros">Estudio</a>
      <a href="#servicios" id="tplNavServicios" style="display:none;">Servicios</a>
      <a href="#galeria">Trabajos</a>
      <a href="#opiniones" id="tplNavOpiniones" style="display:none;">Opiniones</a>
      <a href="#horario">Horario</a>
      <a href="#contacto">Contacto</a>
    </div>
    <a href="https://wa.me/{{ $whatsapp }}" class="btn coral sm desk-cta" aria-label="WhatsApp" data-wa-link>
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.2c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
      <span>Reservar</span>
    </a>
    <button class="burger" aria-label="Menú" id="burger"><span></span><span></span></button>
  </div>
</nav>

<div class="sheet" id="sheet">
  <ul>
    <!-- Mismo orden que el navbar de escritorio (orden visual del HTML). -->
    <li><a href="#portada">Inicio</a></li>
    <li><a href="#sobre-nosotros">El <em>estudio</em></a></li>
    <li id="tplNavServiciosSheetLi" style="display:none;"><a href="#servicios">Servicios</a></li>
    <li><a href="#galeria">Trabajos</a></li>
    <li id="tplNavOpinionesSheetLi" style="display:none;"><a href="#opiniones">Opiniones</a></li>
    <li><a href="#horario">Horario</a></li>
    <li><a href="#contacto">Contacto</a></li>
  </ul>
</div>

<!-- ═══ 1. PORTADA ═════════════════════════════════════ -->
<header class="hero" id="portada">
  <div class="hero-photo" id="heroBg"></div>
  <div class="hero-grad"></div>
  <div class="hero-darken"></div>
  <span class="shape s1"></span>
  <span class="shape s2"></span>
  <span class="shape s3"></span>
  <span class="shape s4"></span>
  <span class="shape s5"></span>

  <div class="hero-inner" id="heroInner">
    <span class="hero-eyebrow"><span class="pill-dot"></span> Abierto · Lavapiés, Madrid</span>
    <h1 class="hero-title" id="heroTitle">Salón Margarita</h1>
    <p class="hero-tagline" id="heroTagline">{{ $tagline }}</p>
    <div class="hero-actions">
      <span id="tplBookingWrap" style="display:none;">
        <a href="#" id="tplBookingLink" class="btn cream" target="_blank" rel="noopener noreferrer"><span>Reservar cita</span></a>
      </span>
      <a href="https://wa.me/{{ $whatsapp }}" class="btn cream" data-wa-link>
        <span>Reservar por WhatsApp</span>
      </a>
      <a href="#galeria" class="btn outline light"><span>Ver trabajos</span></a>
    </div>
  </div>

  <div class="hero-meta">
    <div class="item"><span class="num">12<em>·</em>11</span><span>Años en el barrio</span></div>
    <div class="item"><span class="num">5</span><span>Peluqueros del equipo</span></div>
  </div>
</header>

<!-- ═══ 2. SOBRE NOSOTROS ═════════════════════════════ -->
<section id="sobre-nosotros">
  <div class="wrap" id="aboutSec">
    <div class="about">
      <div class="about-photo r-left" id="aboutPhotoBg">
      </div>
      <div class="about-text r-right d-1">
        <span class="eyebrow-coral">Sobre nosotros</span>
        <h2>Cinco peluqueros, un <em>café</em> y mucha calle.</h2>
        <p id="aboutDescripcion">{{ $descripcion }}</p>
        <p id="aboutExtra" hidden></p>

        <div class="about-actions">
          <a href="tel:{{ $telefono }}" class="pill-tel" data-tel-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
            <span data-phone-display>{{ $telefono ?: '+34 911 234 567' }}</span>
          </a>
          <a href="https://wa.me/{{ $whatsapp }}" class="btn coral" data-wa-link>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.2c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
            <span>WhatsApp</span>
          </a>
          <span id="tplVcardWrap" style="display:none;">
            <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn outline" download>Guardar contacto</a>
          </span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ 2b. SERVICIOS (payload.services) ═════════════════ -->
<section id="servicios" style="display:none;">
  <div class="wrap" id="servicesSec">
    <div class="sched-head" style="margin-bottom:36px;">
      <span class="eyebrow-coral r-up">Servicios</span>
      <h2 class="r-up d-1">Precios <em>claros</em>.</h2>
    </div>
    <div class="bloom-services-grid r-up d-2" id="tplServicesList">

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

<!-- ═══ 3. GALERÍA ═════════════════════════════════════ -->
<section id="galeria">
  <div class="wrap" id="gallerySec">
    <div class="gallery-head">
      <h2 class="r-left">Trabajos <em>recientes</em>.</h2>
      <p class="right r-right d-1" id="gallerySub"></p>
    </div>
    <div class="grid" id="galleryLiveBloom"></div>
  </div>
</section>

<!-- ═══ 3b. OPINIONES / GOOGLE (enlace Pro) ═══════════════ -->
<section id="opiniones" class="bloom-reviews-section" style="display:none;">
  <div class="wrap" id="reviewsSec">
    <div class="sched-head" style="margin-bottom:28px;">
      <span class="eyebrow-coral r-up">Opiniones</span>
      <h2 class="r-up d-1">Lo que dicen quienes nos <em>eligen</em></h2>
      <p class="bloom-reviews-sub r-up d-2">
        Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google: ayuda a otros a descubrirnos.
      </p>
    </div>
    <div class="r-up d-2" style="text-align:center;">
      <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn outline light sm" target="_blank" rel="noopener noreferrer">Ver y escribir reseñas en Google</a>
    </div>
  </div>
</section>

<!-- ═══ 4. HORARIO ═════════════════════════════════════ -->
<section id="horario">
  <div class="wrap" id="schedSec">
    <div class="sched-head">
      <span class="eyebrow-coral r-up">Horario</span>
      <h2 class="r-up d-1">Cuándo nos <em>encuentras</em>.</h2>
      <span class="status r-up d-2" id="statusPill">
        <span class="pulse"></span>
        <span id="statusText">Comprobando…</span>
      </span>
    </div>
    <div class="days r-up d-1" id="days"></div>
  </div>
</section>

<!-- ═══ 5. FOOTER ══════════════════════════════════════ -->
<footer id="contacto">
  <div class="wrap">
    <div class="bloom-map-block">
      <span class="bloom-map-eyebrow">Cómo llegar</span>
      <p class="bloom-map-sub" id="bloomMapAddressLine" hidden></p>
      <div id="bloomMapShell" class="bloom-map-shell" hidden>
        <div id="bloomMapLeafletContainer" class="bloom-map-leaflet" role="img" aria-label="Mapa del negocio"></div>
      </div>
      <p id="bloomMapPlaceholder" class="bloom-map-placeholder"@if(is_numeric($map_lat) && is_numeric($map_lon)) hidden @endif>En el asistente, escribe tu dirección y pulsa «Buscar» para ver el mapa aquí.</p>
      <div id="tplMapsDirectionsRow" class="bloom-map-directions-row" style="display:none;">
        <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn outline light sm" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a>
      </div>
    </div>
    <div class="foot">
      <div>
        <div class="logo"><span class="dot"></span> <span id="footBrand">Salón Margarita</span></div>
        <p id="footTagline">{{ $tagline }}</p>
        <div class="social">
          <a href="#" href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
          <a href="#" href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3a5 5 0 0 0 4 4v3a8 8 0 0 1-4-1.2v6.7a5.5 5.5 0 1 1-5.5-5.5v3a2.5 2.5 0 1 0 2.5 2.5V3z"/></svg></a>
          <a href="#" href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
        </div>
      </div>
      <div>
        <div class="foot-h">Contacto</div>
        <ul>
          <li id="footAddrLineBloom"><span id="footAddressBloom">Calle del Olmo 23 · 28012 Madrid · Lavapiés</span></li>
          <li><a href="tel:{{ $telefono }}" data-tel-link data-phone-display>+34 911 234 567</a></li>
          <li id="footEmailRowBloom" hidden><a id="footEmailLinkBloom" href="#"><span id="footEmailDisplayBloom"></span></a></li>
        </ul>
      </div>
      <div>
        <div class="foot-h">Servicios</div>
        <ul>
          <li>Corte y peinado</li>
          <li>Color y mechas</li>
          <li>Tratamientos capilares</li>
          <li>Recogidos para eventos</li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 · Salón Margarita</span>
      <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">LocalWeb</a></span>
    </div>
  </div>
</footer>
@endsection

@push('body-end')

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
if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.documentElement.classList.add('embed-preview-root');
  document.body.classList.add('embed-preview');
}

/* ───── GALERÍA · vista previa onboarding ───────────────── */
function escapeBloomGalleryAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function updateBloomHeroSlider(raw) {
  var heroBg = document.getElementById('heroBg');
  if (!heroBg) return;
  var hasPortada = raw && Object.prototype.hasOwnProperty.call(raw, 'portada');
  if (!hasPortada) return;
  var heroCover = (raw && raw.portada ? String(raw.portada).trim() : '');
  var withCacheBust = '';
  if (heroCover) {
    /** Cache-bust solo para URLs HTTP(S) servidas (R2/storage). En `data:` el `?lwts=` rompe el URL
     * (ERR_INVALID_URL) y en `blob:` invalida el lookup del object URL (hero queda en negro). */
    if (/^https?:\/\//i.test(heroCover)) {
      var sep = heroCover.indexOf('?') >= 0 ? '&' : '?';
      withCacheBust = heroCover + sep + 'lwts=' + Date.now();
    } else {
      withCacheBust = heroCover;
    }
  }
  var cssUrl = withCacheBust ? withCacheBust.replace(/"/g, '\\"') : '';
  heroBg.style.opacity = '1';
  heroBg.style.transform = '';
  heroBg.style.transition = '';
  heroBg.style.backgroundImage = cssUrl ? 'url("' + cssUrl + '")' : '';
}

var bloomGallerySliderTimer = null;
var bloomGallerySliderIndex = 0;

function clearBloomGallerySlider() {
  if (bloomGallerySliderTimer != null) {
    clearInterval(bloomGallerySliderTimer);
    bloomGallerySliderTimer = null;
  }
}

function updateBloomGallerySlider(isPro) {
  var root = document.getElementById('galleryLiveBloom');
  if (!root) return;
  clearBloomGallerySlider();

  root.classList.remove('gallery-slider');
  root.querySelectorAll('.bloom-gallery-nav-btn').forEach(function (btn) { btn.remove(); });
  root.querySelectorAll('.photo').forEach(function (el) { el.classList.remove('is-active'); });

  var photos = Array.prototype.slice.call(root.querySelectorAll('.photo'));
  if (!isPro || photos.length <= 1) return;

  root.classList.add('gallery-slider');
  bloomGallerySliderIndex = 0;

  function paint() {
    photos.forEach(function (photo, i) {
      photo.classList.toggle('is-active', i === bloomGallerySliderIndex);
    });
  }
  function go(delta) {
    bloomGallerySliderIndex = (bloomGallerySliderIndex + delta + photos.length) % photos.length;
    paint();
  }

  var prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'bloom-gallery-nav-btn prev';
  prev.setAttribute('aria-label', 'Foto anterior');
  prev.textContent = '‹';
  prev.addEventListener('click', function () { go(-1); });

  var next = document.createElement('button');
  next.type = 'button';
  next.className = 'bloom-gallery-nav-btn next';
  next.setAttribute('aria-label', 'Foto siguiente');
  next.textContent = '›';
  next.addEventListener('click', function () { go(1); });

  root.appendChild(prev);
  root.appendChild(next);
  paint();
  bloomGallerySliderTimer = setInterval(function () { go(1); }, 3200);
}

function renderBloomGallery(urls) {
  var root = document.getElementById('galleryLiveBloom');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML =
      '<div class="photo"><img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Color</span></div>' +
      '<div class="photo tall"><img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Mechas balayage</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Corte recto</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Recogido</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Studio</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Bob</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1595944100050-5d9ec0a82c4f?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Detalle</span></div>' +
      '<div class="photo"><img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=70" alt=""/><span class="tag">Pelirrojo</span></div>';
    return;
  }
  root.innerHTML = list
    .map(function (src, i) {
      var tall = list.length > 1 && i === 1 ? ' tall' : '';
      return (
        '<div class="photo' +
        tall +
        '"><img src="' +
        escapeBloomGalleryAttr(src) +
        '" alt=""/><span class="tag">Tu galería</span></div>'
      );
    })
    .join('');
}

/* ───── DATA: horario (plantilla + vista previa onboarding) ──────── */
const BLOOM_SCHEDULE_DEFAULT = [
  { name:"Lun", full:"Lunes",     idx:1, open:"10:00", close:"20:00" },
  { name:"Mar", full:"Martes",    idx:2, open:"10:00", close:"20:00" },
  { name:"Mié", full:"Miércoles", idx:3, open:"10:00", close:"20:00" },
  { name:"Jue", full:"Jueves",    idx:4, open:"10:00", close:"20:00" },
  { name:"Vie", full:"Viernes",   idx:5, open:"10:00", close:"21:00" },
  { name:"Sáb", full:"Sábado",    idx:6, open:"10:00", close:"14:00" },
  { name:"Dom", full:"Domingo",   idx:0, open:null,    close:null    },
];
let SCHEDULE = BLOOM_SCHEDULE_DEFAULT.map(function (d) {
  return { name: d.name, full: d.full, idx: d.idx, open: d.open, close: d.close };
});

function syncBloomScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = BLOOM_SCHEDULE_DEFAULT.map(function (d) {
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

function scrollEmbedPreviewToHash() {
  if (new URLSearchParams(window.location.search).get('embed') !== '1') return;
  var id = (window.location.hash || '').replace(/^#/, '');
  if (!id) return;
  function doScroll() {
    var el = document.getElementById(id);
    if (!el) return;
    var nav = document.querySelector('nav.top');
    var offset = nav ? Math.round(nav.getBoundingClientRect().height) + 10 : 10;
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(doScroll);
  });
  setTimeout(doScroll, 80);
  setTimeout(doScroll, 280);
}

var bloomPreviewMap = null;
var bloomPreviewMarker = null;
var BLOOM_MAP_ZOOM = 18;

function destroyBloomPreviewMap() {
  if (bloomPreviewMap) {
    try {
      bloomPreviewMap.remove();
    } catch (e) {}
    bloomPreviewMap = null;
    bloomPreviewMarker = null;
  }
}

function bloomRadarIcon() {
  if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return null;
  var html =
    '<div class="bloom-map-pin-wrap">' +
    '<span class="bloom-map-radar-ring"></span>' +
    '<span class="bloom-map-radar-ring d2"></span>' +
    '<span class="bloom-map-core"></span></div>';
  return L.divIcon({
    className: 'bloom-leaflet-divicon',
    html: html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

function updateBloomPreviewMap(lat, lon, addressLine) {
  var shell = document.getElementById('bloomMapShell');
  var container = document.getElementById('bloomMapLeafletContainer');
  var ph = document.getElementById('bloomMapPlaceholder');
  var line = document.getElementById('bloomMapAddressLine');
  if (line) {
    if (addressLine) {
      line.textContent = addressLine;
      line.hidden = false;
    } else {
      line.textContent = '';
      line.hidden = true;
    }
  }
  if (!shell || !container) return;
  var ok = typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon);
  if (!ok) {
    destroyBloomPreviewMap();
    shell.hidden = true;
    if (ph) ph.hidden = false;
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  if (typeof L === 'undefined') {
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(function () { updateBloomPreviewMap(lat, lon, addressLine); });
    }
    return;
  }

  shell.hidden = false;
  if (ph) ph.hidden = true;

  function applyMap() {
    if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
    if (!bloomPreviewMap) {
      bloomPreviewMap = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        /** Solo zoom desde los botones +/-: ver `urban-bold.html` para el detalle. */
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([lat, lon], BLOOM_MAP_ZOOM);
      L.control.attribution({ prefix: false }).addTo(bloomPreviewMap);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(bloomPreviewMap);
    } else {
      bloomPreviewMap.setView([lat, lon], BLOOM_MAP_ZOOM);
    }
    if (bloomPreviewMarker) {
      bloomPreviewMap.removeLayer(bloomPreviewMarker);
    }
    bloomPreviewMarker = L.marker([lat, lon], { icon: bloomRadarIcon() }).addTo(bloomPreviewMap);
    setTimeout(function () {
      if (bloomPreviewMap) bloomPreviewMap.invalidateSize();
    }, 80);
    setTimeout(function () {
      if (bloomPreviewMap) bloomPreviewMap.invalidateSize();
    }, 320);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(applyMap);
  });
}

/* ───── LIVE PREVIEW (query + postMessage, igual que noir-elite) ─── */
function escapeHtmlTextBloom(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBloomPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function buildDirectionsUrlFromRawBloom(raw) {
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

function syncBloomTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;

  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services)
    ? raw.services.filter(function (s) {
        return s && String(s.name || '').trim();
      })
    : [];
  var sec = document.getElementById('servicios');
  var list = document.getElementById('tplServicesList');
  var navSvc = document.getElementById('tplNavServicios');
  var navSheetLi = document.getElementById('tplNavServiciosSheetLi');
  if (sec && list) {
    if (services.length === 0) {
      sec.style.display = 'none';
      list.innerHTML = '';
      if (navSvc) navSvc.style.display = 'none';
      if (navSheetLi) navSheetLi.style.display = 'none';
    } else {
      sec.style.display = 'block';
      if (navSvc) navSvc.style.display = '';
      if (navSheetLi) navSheetLi.style.display = '';
      list.innerHTML = services
        .map(function (s) {
          var nm = escapeHtmlTextBloom(String(s.name || ''));
          var pr = escapeHtmlTextBloom(formatBloomPrice(s.price));
          var dc = s.description && String(s.description).trim();
          var descHtml = dc
            ? '<p class="bloom-svc-desc">' + escapeHtmlTextBloom(String(s.description)) + '</p>'
            : '';
          return (
            '<article class="bloom-svc-card"><h3 class="bloom-svc-name">' +
            nm +
            '</h3><div class="bloom-svc-price">' +
            pr +
            '</div>' +
            descHtml +
            '</article>'
          );
        })
        .join('');
    }
  }

  var mapsUrl = buildDirectionsUrlFromRawBloom(raw);
  var mapsRow = document.getElementById('tplMapsDirectionsRow');
  var mapsA = document.getElementById('tplMapsExternalLink');
  if (mapsRow && mapsA) {
    if (mapsUrl) {
      mapsRow.style.display = 'flex';
      mapsA.href = mapsUrl;
    } else {
      mapsRow.style.display = 'none';
      mapsA.removeAttribute('href');
    }
  }

  var gUrl = (raw.google_business_url || '').trim();
  var gSection = document.getElementById('opiniones');
  var gLink = document.getElementById('tplGbizLink');
  var navOp = document.getElementById('tplNavOpiniones');
  var navOpSheetLi = document.getElementById('tplNavOpinionesSheetLi');
  if (gSection && gLink) {
    if (gUrl) {
      gSection.style.display = 'block';
      gLink.href = gUrl;
      if (navOp) navOp.style.display = '';
      if (navOpSheetLi) navOpSheetLi.style.display = '';
      var rs = document.getElementById('reviewsSec');
      if (rs) rs.classList.add('reveal');
    } else {
      gSection.style.display = 'none';
      gLink.removeAttribute('href');
      if (navOp) navOp.style.display = 'none';
      if (navOpSheetLi) navOpSheetLi.style.display = 'none';
    }
  }

  var bWrap = document.getElementById('tplBookingWrap');
  var bLink = document.getElementById('tplBookingLink');
  if (bWrap && bLink) {
    bWrap.style.display = 'none';
    bLink.removeAttribute('href');
  }

  var vcEnabled = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
  var vcUrl = (raw.vcard_download_url || '').trim();
  var vcWrap = document.getElementById('tplVcardWrap');
  var vcA = document.getElementById('tplVcardLink');
  if (vcWrap && vcA) {
    if (vcEnabled && vcUrl) {
      vcWrap.style.display = 'inline-flex';
      vcA.href = vcUrl;
    } else {
      vcWrap.style.display = 'none';
      vcA.removeAttribute('href');
    }
  }

  var LW_DEFAULT_SOCIAL_BLOOM = {
    instagram: 'https://www.instagram.com/localweb.es',
    tiktok: 'https://www.tiktok.com/@localweb',
    facebook: 'https://www.facebook.com/localweb'
  };
  function bloomResolveSocialHref(raw, key, fallback) {
    var u = (raw[key] || '').trim();
    if (u) return u;
    return fallback || '#';
  }
  var igElB = document.getElementById('tplSocialInstagram');
  var ttElB = document.getElementById('tplSocialTiktok');
  var fbElB = document.getElementById('tplSocialFacebook');
  if (igElB) igElB.href = bloomResolveSocialHref(raw, 'instagram_url', LW_DEFAULT_SOCIAL_BLOOM.instagram);
  if (ttElB) ttElB.href = bloomResolveSocialHref(raw, 'tiktok_url', LW_DEFAULT_SOCIAL_BLOOM.tiktok);
  if (fbElB) fbElB.href = bloomResolveSocialHref(raw, 'facebook_url', LW_DEFAULT_SOCIAL_BLOOM.facebook);
}

function applyLivePreviewData(raw, opts) {
  opts = opts || {};
  const defaults = {
    name: 'Salón Margarita',
    tagline: 'Cinco peluqueros, productos cuidados y conversaciones tranquilas. Cita previa.',
    phoneWa: '34911234567',
    footRest: '',
  };

  const name = (raw?.nombre || '').trim() || defaults.name;
  const tagline = (raw?.tagline || '').trim() || defaults.tagline;
  const phoneRaw = (raw?.telefono || '').trim();
  const phoneWa = phoneRaw.replace(/\D/g, '') || defaults.phoneWa;
  const heroCover = (raw?.portada || '').trim();
  const descripcion = (raw?.descripcion || '').trim();
  const fotoEquipo = (raw?.foto_equipo || '').trim();
  const direccion = (raw?.direccion || '').trim();
  const correo = (raw?.correo || '').trim();
  const aboutDefault =
    'Margarita abrió el estudio en 2014 y desde entonces somos cinco peluqueros enamorados del oficio. Trabajamos con cita previa, productos cuidados y conversaciones tranquilas.';

  document.title = `${name} — LocalWeb`;

  const logoUrlBloom = (raw?.logo_url || '').trim();
  var navTopBloom = document.querySelector('nav.top');
  if (navTopBloom) {
    if (logoUrlBloom) {
      var lscB = typeof raw?.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : 1;
      if (lscB < 0.45) lscB = 0.45;
      if (lscB > 1.5) lscB = 1.5;
      navTopBloom.style.setProperty('--lw-logo-scale', String(lscB));
    } else {
      navTopBloom.style.removeProperty('--lw-logo-scale');
    }
  }
  const bloomNavWrap = document.getElementById('bloomNavBrandWrap');
  const bloomNavImg = document.getElementById('navBrandLogo');
  const brandLogo = document.getElementById('brandLogo');
  if (bloomNavWrap && bloomNavImg && brandLogo) {
    if (logoUrlBloom) {
      bloomNavImg.src = logoUrlBloom;
      bloomNavImg.alt = name ? `${name} · logo` : 'Logo';
      bloomNavImg.hidden = false;
      bloomNavImg.style.display = 'block';
      brandLogo.textContent = name;
      brandLogo.style.display = 'none';
      bloomNavWrap.classList.add('brand-has-img');
    } else {
      bloomNavImg.removeAttribute('src');
      bloomNavImg.hidden = true;
      bloomNavImg.style.display = 'none';
      brandLogo.style.display = '';
      bloomNavWrap.classList.remove('brand-has-img');
    }
  }
  if (brandLogo) brandLogo.textContent = name;

  const footBrand = document.getElementById('footBrand');
  if (footBrand) footBrand.textContent = name;

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = name;

  const heroTagline = document.getElementById('heroTagline');
  if (heroTagline) heroTagline.textContent = tagline;

  const footTagline = document.getElementById('footTagline');
  if (footTagline) footTagline.textContent = tagline || '';

  const footAddressBloom = document.getElementById('footAddressBloom');
  if (footAddressBloom) {
    footAddressBloom.textContent = direccion || 'Calle del Olmo 23 · 28012 Madrid · Lavapiés';
  }

  var bLat = raw?.map_lat;
  var bLon = raw?.map_lon;
  var latB = typeof bLat === 'number' ? bLat : parseFloat(bLat);
  var lonB = typeof bLon === 'number' ? bLon : parseFloat(bLon);
  function bootBloomMapFromPreview() {
    if (Number.isFinite(latB) && Number.isFinite(lonB)) {
      updateBloomPreviewMap(latB, lonB, direccion || '');
    } else {
      updateBloomPreviewMap(NaN, NaN, direccion || '');
    }
  }
  if (typeof lwWhenLeafletReady === 'function') {
    lwWhenLeafletReady(bootBloomMapFromPreview);
  } else {
    bootBloomMapFromPreview();
  }

  const aboutDescripcion = document.getElementById('aboutDescripcion');
  if (aboutDescripcion) aboutDescripcion.textContent = descripcion || aboutDefault;

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  const footEmailRowBloom = document.getElementById('footEmailRowBloom');
  const footEmailLinkBloom = document.getElementById('footEmailLinkBloom');
  const footEmailDisplayBloom = document.getElementById('footEmailDisplayBloom');
  if (footEmailRowBloom && footEmailLinkBloom && footEmailDisplayBloom) {
    if (correo) {
      footEmailLinkBloom.href = 'mailto:' + correo;
      footEmailDisplayBloom.textContent = correo;
      footEmailRowBloom.hidden = false;
    } else {
      footEmailDisplayBloom.textContent = '';
      footEmailRowBloom.hidden = true;
    }
  }

  updateBloomHeroSlider(raw || {});

  const aboutPhotoBg = document.getElementById('aboutPhotoBg');
  if (aboutPhotoBg) aboutPhotoBg.style.backgroundImage = fotoEquipo ? `url("${fotoEquipo}")` : '';

  const galeria = Array.isArray(raw?.galeria) ? raw.galeria.filter(Boolean) : [];
  renderBloomGallery(galeria);
  syncBloomScheduleFromPreview(raw.horario);
  render();
  syncBloomTemplateExtensions(raw);
  if (opts.alignToHash) scrollEmbedPreviewToHash();
}

(function initLivePreviewFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('preview')) return;
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

/* ───── NAV: bump on first scroll change ─────────────── */
const nav = document.getElementById('nav');
let lastBumped = false;
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 30;
  if (scrolled && !lastBumped){
    nav.classList.add('bumped');
    setTimeout(() => nav.classList.remove('bumped'), 600);
    lastBumped = true;
  } else if (!scrolled){
    lastBumped = false;
  }
}, { passive:true });

/* ───── Burger ───────────────────────────────────────── */
const burger = document.getElementById('burger');
const sheet = document.getElementById('sheet');
burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

/* ───── IO reveal (embed: escalonado + fotos) ─────────── */
(function initSectionRevealsBloom(){
  var ids = ['heroInner','aboutSec','servicesSec','gallerySec','reviewsSec','schedSec'];
  function staggerPhotos(root){
    root.querySelectorAll('.grid .photo').forEach(function(p, i){
      p.style.transitionDelay = (i * 80) + 'ms';
    });
  }
  if (document.body.classList.contains('embed-preview')) {
    ids.forEach(function(id, i){
      var el = document.getElementById(id);
      if (!el) return;
      setTimeout(function(){
        el.classList.add('reveal');
        staggerPhotos(el);
      }, 60 + i * 160);
    });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        e.target.classList.add('reveal');
        staggerPhotos(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold:.16 });
  ids.forEach(function(id){
    var el = document.getElementById(id); if (el) io.observe(el);
  });
})();

/* ───── HORARIO render (estado por día) ───────────────── */
function render(){
  const now = new Date();
  const today = now.getDay();

  const wrap = document.getElementById('days');
  wrap.innerHTML = '';
  SCHEDULE.forEach(d => {
    const isToday = d.idx === today;
    const closed = !d.open;
    const card = document.createElement('div');
    card.className = `card${isToday ? ' today' : ''}${closed ? ' closed' : ''}`;
    card.innerHTML = `
      <div class="dname">${d.name}</div>
      <div class="dhours">${closed ? 'Cerrado' : d.open + ' – ' + d.close}</div>
      <div class="dlabel">${closed ? 'Descanso semanal' : isToday ? 'Hoy' : d.full}</div>
    `;
    wrap.appendChild(card);
  });

  const todayD = SCHEDULE.find(d => d.idx === today);
  const pill = document.getElementById('statusPill');
  const txt = document.getElementById('statusText');
  const openToday = Boolean(todayD && todayD.open);
  pill.classList.toggle('open', openToday);
  txt.textContent = openToday ? 'Abierto hoy' : 'Cerrado hoy';
}
render();
setInterval(render, 60_000);
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
      var g=document.getElementById('galeria');
      if(t&&g&&g.contains(t)){
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
(function bootBloomStudioTenantPage() {
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
    if (typeof lwWhenLeafletReady === 'function' && typeof lwBootTenantMap === 'function') {
      lwWhenLeafletReady(function () { lwBootTenantMap(@json($direccion)); });
    } else if (typeof window.__lwLat === 'number' && typeof window.__lwLon === 'number' && typeof updateBloomPreviewMap === 'function') {
      updateBloomPreviewMap(window.__lwLat, window.__lwLon, @json($direccion));
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
