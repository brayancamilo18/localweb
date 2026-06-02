@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap"/>
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
  /* ───── TOKENS ──────────────────────────────────────── */
  :root{
    --bg:#0A0A0A; --bg-2:#111111; --bg-3:#050505;
    --gold:#C9A84C; --gold-soft:color-mix(in srgb, var(--gold) 15%, transparent);
    --gold-line:color-mix(in srgb, var(--gold) 30%, transparent);
    --text:#F0ECE4; --muted:#8A8680;
    --hairline:rgba(255,255,255,.06);
    --serif:"Cormorant Garamond", serif;
    --sans:"Inter", ui-sans-serif, system-ui, sans-serif;
  }
  *{ box-sizing:border-box; margin:0; padding:0; }
  html{ scroll-behavior:smooth; }
  body{
    background:var(--bg); color:var(--text);
    font-family:var(--sans); font-weight:300; line-height:1.6;
    overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
  }
  ::selection{ background:var(--gold); color:var(--gold-on,#000); }
  a{ color:inherit; text-decoration:none; }
  img{ display:block; max-width:100%; }

  /* ───── UTILITIES ───────────────────────────────────── */
  .wrap{ max-width:1280px; margin:0 auto; padding:0 46px; }
  .eyebrow{
    color:var(--gold); font-size:11px; font-weight:400;
    letter-spacing:.25em; text-transform:uppercase;
  }
  .h-line{
    height:1px; background:var(--gold);
    width:0; transition:width .8s cubic-bezier(.2,.7,.2,1);
  }
  .reveal .h-line.short{ width:48px; }
  .reveal .h-line.full{ width:100%; }
  .h-line.short{ width:0; }
  .h-line.full{ width:0; }

  /* Reveal */
  .reveal-up{ opacity:0; transform:translateY(30px); transition:opacity 1s ease, transform 1s cubic-bezier(.2,.7,.2,1); }
  .reveal .reveal-up{ opacity:1; transform:translateY(0); }
  .delay-1{ transition-delay:.12s; }
  .delay-2{ transition-delay:.24s; }
  .delay-3{ transition-delay:.36s; }
  .delay-4{ transition-delay:.48s; }

  /* ───── CURSOR ──────────────────────────────────────── */
  .cursor{
    position:fixed; top:0; left:0; width:18px; height:18px;
    border:1px solid color-mix(in srgb, var(--gold) 70%, transparent); border-radius:999px;
    transform:translate(-50%,-50%); pointer-events:none; z-index:1000;
    transition:transform .18s ease-out, width .25s ease, height .25s ease, border-color .25s ease, background .25s ease;
    mix-blend-mode:difference;
  }
  .cursor.large{ width:48px; height:48px; background:color-mix(in srgb, var(--gold) 10%, transparent); border-color:var(--gold); }
  @media (hover:none),(pointer:coarse){ .cursor{ display:none; } }

  /* ───── NAV ─────────────────────────────────────────── */
  nav.top{
    position:fixed; inset:0 0 auto 0; z-index:9000;
    padding:22px 0; transition:background .35s ease, backdrop-filter .35s ease, padding .35s ease, border-color .35s;
    border-bottom:1px solid transparent;
  }
  nav.top.scrolled{
    background:rgba(10,10,10,.78);
    backdrop-filter:saturate(160%) blur(18px);
    -webkit-backdrop-filter:saturate(160%) blur(18px);
    padding:14px 0;
    border-bottom-color:var(--hairline);
  }
  nav.top .row{ display:flex; align-items:center; justify-content:space-between; gap:24px; }
  nav.top{ --lw-logo-scale:1; }
  nav.top .logo.brand-has-img .nav-brand-img{
    display:block;
    height:calc(52px * var(--lw-logo-scale, 1));
    width:auto;
    max-width:calc(230px * var(--lw-logo-scale, 1));
    object-fit:contain;
    image-rendering:auto;
    -webkit-font-smoothing:antialiased;
  }
  nav.top .logo.brand-has-img #navBrandName{ display:none !important; }
  .logo{
    font-family:var(--serif); font-weight:300; font-size:22px;
    letter-spacing:.32em; text-transform:uppercase;
  }
  .logo small{
    display:block; font-family:var(--sans); font-size:9px;
    letter-spacing:.4em; color:var(--gold); margin-top:-2px;
  }
  .links{ display:flex; gap:50px; }
  .links a{
    font-size:11px; letter-spacing:.18em; text-transform:uppercase;
    color:var(--text); opacity:.8;
    position:relative; padding:6px 0;
  }
  .links a::after{
    content:""; position:absolute; left:0; right:0; bottom:0;
    height:1px; background:var(--gold); transform:scaleX(0); transform-origin:left;
    transition:transform .4s cubic-bezier(.2,.7,.2,1);
  }
  .links a:hover{ opacity:1; }
  .links a:hover::after{ transform:scaleX(1); }

  /* Buttons */
  .btn{
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 26px; font-size:11px; letter-spacing:.22em;
    text-transform:uppercase; font-weight:400;
    border:1px solid var(--gold); color:var(--gold); background:transparent;
    cursor:pointer; position:relative; overflow:hidden; isolation:isolate; z-index:0;
    transition:color .35s ease, background .35s ease;
  }
  .btn::before{
    content:""; position:absolute; inset:0;
    background:linear-gradient(120deg, transparent 30%, color-mix(in srgb, var(--gold) 55%, transparent) 50%, transparent 70%);
    transform:translateX(-120%); transition:transform .9s cubic-bezier(.2,.7,.2,1);
    z-index:-1;
  }
  .btn:hover::before{ transform:translateX(120%); }
  .btn.primary{ background:var(--gold); color:var(--gold-on,#000); }
  .btn.primary:hover{ background:var(--gold-hover); }
  .btn.outline:hover{ background:var(--gold-soft); color:var(--text); }
  .btn.sm{ padding:10px 18px; font-size:10px; }
  .btn svg{ width:13px; height:13px; }

  /* ───── HERO ────────────────────────────────────────── */
  header.hero{
    position:relative; height:100vh; min-height:680px;
    overflow:hidden; isolation:isolate;
  }
  .hero-bg{
    position:absolute; inset:-10% -2% -2% -2%;
    background-image:url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80");
    background-size:cover; background-position:center;
    will-change:transform;
    z-index:-2;
  }
  .hero-bg::after{
    content:""; position:absolute; inset:0;
    background:
      radial-gradient(ellipse at center, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.95) 100%),
      linear-gradient(180deg, rgba(10,10,10,.6) 0%, rgba(10,10,10,.2) 30%, rgba(10,10,10,.85) 100%);
  }
  canvas#particles{ position:absolute; inset:0; z-index:-1; pointer-events:none; }
  .hero-inner{
    position:relative; height:100%;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    text-align:center; padding:0 24px;
  }
  .hero-inner .h-line{ background:var(--gold); }
  .hero-inner .eyebrow{ margin:0 0 22px; }
  .hero-title{
    font-family:var(--serif); font-weight:300;
    font-size:clamp(44px, 8vw, 84px);
    letter-spacing:.06em; text-transform:uppercase;
    line-height:1; margin:14px 0 6px;
  }
  .hero-title em{ font-style:italic; color:var(--gold); font-weight:300; }
  .hero-tagline{
    color:var(--muted); font-size:14px; letter-spacing:.05em;
    max-width:554px; margin:18px auto 0; line-height:1.7;
  }
  .hero-actions{ display:flex; gap:14px; margin-top:52px; flex-wrap:wrap; justify-content:center; }
  .scroll-cue{
    position:absolute; left:50%; bottom:30px; transform:translateX(-50%);
    font-size:10px; letter-spacing:.3em; color:var(--muted); text-transform:uppercase;
    display:flex; flex-direction:column; align-items:center; gap:14px;
  }
  .scroll-cue::after{
    content:""; width:1px; height:42px; background:var(--gold);
    animation:cueDrop 2.4s ease-in-out infinite;
    transform-origin:top;
  }
  @keyframes cueDrop{
    0%{ transform:scaleY(0); opacity:0; }
    40%{ transform:scaleY(1); opacity:1; }
    100%{ transform:scaleY(1) translateY(54px); opacity:0; }
  }

  /* ───── SECTIONS ────────────────────────────────────── */
  section{ padding:154px 0; position:relative; }
  .section-head{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:16px; margin-bottom:64px; }
  .section-head .h-line{ width:0; }
  .section-title{
    font-family:var(--serif); font-weight:300;
    font-size:clamp(46px, 4.5vw, 50px);
    letter-spacing:.06em; text-transform:uppercase;
  }
  .section-title em{ color:var(--gold); font-style:italic; }
  .section-sub{ color:var(--muted); font-size:14px; max-width:520px; line-height:1.8; }

  /* About */
  #sobre-nosotros{ background:var(--bg-2); }
  .about-grid{
    display:grid; grid-template-columns:1.05fr 1fr; gap:80px; align-items:center;
  }
  .about-text .eyebrow{ display:inline-block; margin-bottom:22px; }
  .about-text h2{
    font-family:var(--serif); font-weight:300;
    font-size:clamp(30px, 3.4vw, 44px); letter-spacing:.04em; line-height:1.15;
    text-transform:uppercase;
  }
  .about-text h2 em{ color:var(--gold); font-style:italic; }
  .about-text .h-line.short{ margin:24px 0 28px; height:1px; background:var(--gold); }
  .about-text p{
    color:var(--muted); font-size:15px; line-height:1.95; font-weight:300;
    max-width:50ch; margin-bottom:18px;
  }
  .about-meta{
    display:flex; gap:48px; margin-top:46px; padding-top:28px;
    border-top:1px solid var(--hairline);
  }
  .about-meta div{ font-size:12px; letter-spacing:.05em; }
  .about-meta strong{
    display:block; font-family:var(--serif); font-weight:400;
    font-size:30px; color:var(--gold); letter-spacing:0;
    margin-bottom:4px;
    font-variant-numeric:tabular-nums;
  }
  .about-photo{
    position:relative; aspect-ratio:3/4;
    background-image:url("https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80");
    background-size:cover; background-position:center;
    outline:1px solid var(--gold-line); outline-offset:12px;
  }
  .about-photo::before{
    content:""; position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,.5) 100%);
  }
  .about-photo .badge{
    position:absolute; left:-12px; top:-12px;
    padding:10px 16px; background:var(--bg); color:var(--gold);
    border:1px solid var(--gold-line); font-size:10px; letter-spacing:.25em; text-transform:uppercase;
  }
  .noir-about-extras{
    display:flex;flex-direction:column;gap:clamp(56px,8vw,80px);
    margin-top:clamp(56px,8vw,80px);padding-top:clamp(40px,6vw,56px);
    border-top:1px solid var(--hairline);
  }
  .noir-about-extra.about-grid{gap:clamp(48px,6vw,80px)}
  .noir-about-extra--text-first .noir-about-extra__text{order:1}
  .noir-about-extra--text-first .noir-about-extra__photo{order:2}
  .noir-about-extra--photo-first .noir-about-extra__photo{order:1}
  .noir-about-extra--photo-first .noir-about-extra__text{order:2}
  .noir-about-extra__title{
    font-family:var(--serif);font-weight:300;
    font-size:clamp(26px,3vw,38px);letter-spacing:.04em;line-height:1.15;
    text-transform:uppercase;margin:0 0 18px;
  }
  .noir-about-extra__desc{
    color:var(--muted);font-size:15px;line-height:1.95;font-weight:300;
    max-width:50ch;margin:0;
  }
  .noir-about-extra__photo:not(.has-photo){
    background:linear-gradient(160deg,#1a1a1a 0%,#0d0d0d 100%);
  }

  /* Galería masonry */
  .gallery{
    column-count:3; column-gap:14px;
  }
  .gallery .photo{
    break-inside:avoid; margin-bottom:14px;
    position:relative; overflow:hidden;
    cursor:zoom-in;
  }
  .gallery .photo img{
    width:100%; height:auto;
    transition:transform .6s cubic-bezier(.2,.7,.2,1);
    filter:saturate(.85) brightness(.92);
  }
  .gallery .photo::after{
    content:""; position:absolute; inset:0;
    background:rgba(0,0,0,0); transition:background .4s ease;
    pointer-events:none;
  }
  .gallery .photo .glass{
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .35s ease;
  }
  .gallery .photo .glass span{
    width:54px; height:54px; border:1px solid var(--gold);
    border-radius:999px; display:inline-flex; align-items:center; justify-content:center;
    color:var(--gold); background:rgba(10,10,10,.4);
    backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  }
  .gallery .photo:hover img{ transform:scale(1.06); }
  .gallery .photo:hover::after{ background:rgba(0,0,0,.55); }
  .gallery .photo:hover .glass{ opacity:1; }

  /* Galería slider (modo Pro) */
  .gallery.gallery-slider{
    position:relative;
    column-count:unset;
    column-gap:0;
    min-height:354px;
  }
  .gallery.gallery-slider .photo{
    display:none;
    margin-bottom:0;
    break-inside:auto;
    height:100%;
  }
  .gallery.gallery-slider .photo.is-active{
    display:block;
  }
  .gallery.gallery-slider .photo img{
    width:100%;
    height:clamp(280px, 52vw, 520px);
    object-fit:cover;
  }
  .gallery-nav-btn{
    position:absolute;
    top:50%;
    transform:translateY(-50%);
    width:54px;
    height:54px;
    border-radius:999px;
    border:1px solid var(--gold-line);
    background:rgba(10,10,10,.52);
    color:var(--gold);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:3;
  }
  .gallery-nav-btn.prev{ left:10px; }
  .gallery-nav-btn.next{ right:10px; }

  /* Horario */
  #horario{ background:var(--bg-2); }
  .schedule-wrap{
    max-width:760px; margin:0 auto;
  }
  .status-pill{
    display:inline-flex; align-items:center; gap:10px;
    padding:8px 16px; border:1px solid var(--hairline);
    background:rgba(255,255,255,.02);
    font-size:11px; letter-spacing:.22em; text-transform:uppercase;
    margin-bottom:24px;
  }
  .status-pill .dot{
    width:7px; height:7px; border-radius:999px; background:var(--muted);
    box-shadow:0 0 0 0 currentColor;
  }
  .status-pill.open{ color:#7CC18B; border-color:rgba(124,193,139,.3); }
  .status-pill.open .dot{ background:#7CC18B; animation:pulse 2.4s infinite; }
  @keyframes pulse{
    0%{ box-shadow:0 0 0 0 rgba(124,193,139,.55); }
    70%{ box-shadow:0 0 0 8px rgba(124,193,139,0); }
    100%{ box-shadow:0 0 0 0 rgba(124,193,139,0); }
  }
  .schedule{
    border-top:1px solid var(--hairline);
  }
  .schedule .row{
    display:grid; grid-template-columns:1.4fr 1fr 1fr;
    align-items:center; padding:22px 16px;
    border-bottom:1px solid var(--hairline);
    font-size:14px; letter-spacing:.04em;
    transition:background .35s ease, color .35s ease;
  }
  .schedule .row.today{ background:color-mix(in srgb, var(--gold) 10%, transparent); color:var(--gold); }
  .schedule .row .day{ text-transform:uppercase; letter-spacing:.18em; font-size:12px; }
  .schedule .row .hours{ font-family:var(--serif); font-size:22px; font-weight:300; font-variant-numeric:tabular-nums; text-align:right; letter-spacing:.06em; }
  .schedule .row .label{ text-align:right; color:var(--muted); font-size:11px; letter-spacing:.22em; text-transform:uppercase; }
  .schedule .row.today .label{ color:var(--gold); }
  .schedule .row.closed .hours{ color:var(--muted); font-style:italic; }

  /* Footer */
  footer{
    background:var(--bg-3); padding:80px 0 46px; margin-top:0;
  }
  .foot-grid{
    display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:48px;
    padding-bottom:48px; border-bottom:1px solid var(--gold-line);
  }
  .foot-logo{
    font-family:var(--serif); font-weight:300;
    font-size:24px; letter-spacing:.32em; text-transform:uppercase; margin-bottom:16px;
  }
  .foot-tag{ color:var(--muted); font-size:13px; max-width:320px; line-height:1.8; }
  .foot-h{
    font-size:11px; letter-spacing:.22em; text-transform:uppercase;
    color:var(--gold); margin-bottom:18px;
  }
  .foot-list{ list-style:none; display:flex; flex-direction:column; gap:10px; }
  .foot-list li{ font-size:13px; color:var(--muted); }
  .foot-list a:hover{ color:var(--text); }
  .social{ display:flex; gap:12px; margin-top:8px; }
  .social a{
    width:50px; height:50px; border:1px solid var(--gold-line); border-radius:999px;
    display:inline-flex; align-items:center; justify-content:center;
    color:var(--gold); transition:background .3s ease, color .3s ease;
  }
  .social a:hover{ background:var(--gold); color:var(--gold-on,#000); }
  .foot-bottom{
    display:flex; justify-content:space-between; align-items:center;
    padding-top:28px; font-size:11px; color:rgba(255,255,255,.25);
    letter-spacing:.18em; text-transform:uppercase;
  }
  .foot-bottom a{ color:rgba(255,255,255,.4); }

  .foot-map-block{
    padding-bottom:44px; margin-bottom:12px;
    border-bottom:1px solid var(--hairline);
  }
  .foot-map-block .foot-map-eyebrow{ margin-bottom:14px; display:block; text-align:center; }
  .foot-map-sub{
    text-align:center; color:var(--muted); font-size:14px; max-width:654px; margin:0 auto 22px;
    line-height:1.55;
  }
  .foot-map-shell{
    position:relative;
    border-radius:12px; overflow:hidden;
    border:1px solid var(--gold-line);
    background:var(--bg-2);
    max-width:920px; margin:0 auto;
  }
  .foot-map-directions-row{
    display:none;
    justify-content:center;
    align-items:center;
    margin:18px auto 0;
    max-width:920px;
  }
  .foot-map-leaflet{
    height:min(300px, 48vh);
    min-height:220px;
    width:100%;
    border-radius:12px;
    background:var(--bg-2);
  }
  .foot-map-shell .leaflet-container{
    font-family:var(--sans);
    background:var(--bg-2);
    border-radius:12px;
  }
  .foot-map-shell .leaflet-control-zoom a{
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
    background:rgba(17,17,17,.92);
    color:var(--gold);
    border-color:var(--gold-line);
  }
  .foot-map-shell .leaflet-control-zoom a:hover{
    background:var(--gold-soft);
    color:var(--text);
  }
  .foot-map-shell .leaflet-bar{ border-color:var(--gold-line); }
  .foot-map-shell .leaflet-control-attribution{
    background:rgba(10,10,10,.82) !important;
    color:rgba(240,236,228,.45) !important;
    font-size:10px !important;
    max-width:100%;
  }
  .foot-map-shell .leaflet-control-attribution a{ color:var(--gold) !important; }
  .noir-leaflet-divicon{
    background:transparent !important;
    border:none !important;
  }
  .noir-map-pin-wrap{
    position:relative;
    width:56px;height:56px;
    display:flex;align-items:center;justify-content:center;
    pointer-events:none;
  }
  .noir-map-core{
    width:14px;height:14px;border-radius:50%;
    background:var(--gold);
    border:2px solid #fff;
    box-shadow:0 0 0 1px color-mix(in srgb, var(--gold) 45%, transparent), 0 4px 16px rgba(0,0,0,.55);
    position:relative;z-index:2;
  }
  .noir-map-radar-ring{
    position:absolute;
    left:50%;top:50%;
    width:46px;height:46px;margin:-23px 0 0 -23px;
    border-radius:50%;
    border:1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    box-shadow:0 0 14px color-mix(in srgb, var(--gold) 12%, transparent);
    transform-origin:center center;animation:noirMapRadar 2.5s cubic-bezier(.2,.7,.2,1) infinite;
    pointer-events:none;
  }
  .noir-map-radar-ring.d2{ animation-delay:1.25s; }
  @keyframes noirMapRadar{
    0%{ transform:scale(0.4); opacity:0.95; }
    65%{ opacity:0.2; }
    100%{ transform:scale(2.15); opacity:0; }
  }
  .foot-map-placeholder{
    text-align:center; color:var(--muted); font-size:13px; padding:50px 20px;
    border:1px dashed var(--gold-line); border-radius:12px; max-width:654px; margin:0 auto;
    line-height:1.6;
  }

  /* Easter egg: small constellation that appears at the very bottom */
  .easter{
    position:absolute; right:46px; top:24px; font-size:10px;
    color:color-mix(in srgb, var(--gold) 40%, transparent); letter-spacing:.3em; text-transform:uppercase;
    cursor:default; user-select:none;
  }
  .easter:hover{ color:var(--gold); }
  .easter .stars{
    display:inline-block; margin-left:8px; letter-spacing:0;
    color:var(--gold); transition:transform .6s ease;
  }
  .easter:hover .stars{ transform:rotate(360deg); }

  /* ───── Extras Pro (servicios, enlaces, vCard) ───────── */
  #servicios{ background:var(--bg); }
  .noir-services-grid{
    display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px;
    max-width:1000px; margin:0 auto;
  }
  .noir-svc-card{
    border:1px solid var(--gold-line); padding:24px 22px; background:rgba(255,255,255,.02);
    transition:border-color .3s ease, background .3s ease;
  }
  .noir-svc-card:hover{ border-color:var(--gold-line); background:color-mix(in srgb, var(--text) 8%, transparent); }
  .noir-svc-name{
    font-family:var(--serif); font-size:22px; letter-spacing:.06em; text-transform:uppercase;
    font-weight:300; margin:0 0 10px;
  }
  .noir-svc-price{ color:var(--gold); font-size:18px; font-weight:400; font-variant-numeric:tabular-nums; margin-bottom:8px; }
  .noir-svc-desc{ color:var(--muted); font-size:14px; line-height:1.75; margin:0; }
  #opiniones.noir-reviews-section{
    background:var(--bg-2);
    color:var(--text);
  }
  .noir-reviews-sub{
    text-align:center; color:var(--muted); font-size:15px; line-height:1.75; max-width:654px; margin:16px auto 0;
    font-weight:300;
  }
  .noir-reviews-cta{ display:flex; justify-content:center; margin-top:28px; }
  .tpl-vcard-wrap{ margin-top:14px; }

  /* Burger */
  .burger{
    display:none; width:52px; height:52px; position:relative; cursor:pointer;
    background:rgba(10,10,10,.78);
    border:1px solid var(--gold-line);
    border-radius:8px;
    -webkit-appearance:none;
    appearance:none;
    padding:0;
  }
  .burger span{
    position:absolute; left:8px; right:8px; height:1.5px; background:var(--gold);
    transition:transform .4s ease, opacity .3s ease, top .4s ease;
  }
  .burger span:nth-child(1){ top:14px; }
  .burger span:nth-child(2){ top:21px; }
  body.menu-open .burger span:nth-child(1){ top:18px; transform:rotate(45deg); }
  body.menu-open .burger span:nth-child(2){ top:18px; transform:rotate(-45deg); }

  /* Mobile sheet */
  .sheet{
    position:fixed; inset:0; background:rgba(10,10,10,.96);
    backdrop-filter:blur(20px); z-index:8999;
    display:flex; align-items:center; justify-content:center;
    opacity:0; pointer-events:none; transition:opacity .4s ease;
  }
  body.menu-open .sheet{ opacity:1; pointer-events:auto; }
  .sheet ul{ list-style:none; display:flex; flex-direction:column; gap:28px; text-align:center; }
  .sheet a{
    font-family:var(--serif); font-size:46px; letter-spacing:.1em;
    text-transform:uppercase; font-weight:300;
  }

  /* ───── RESPONSIVE ──────────────────────────────────── */
  @media (max-width:980px){
    .links, .desk-cta{ display:none; }
    .burger{ display:block; }
    .about-grid{ grid-template-columns:1fr; gap:48px; }
    .noir-about-extra.about-grid{grid-template-columns:1fr}
    .noir-about-extra__photo{order:-1!important}
    .gallery{ column-count:2; }
    .schedule .row{ grid-template-columns:1fr 1fr; }
    .schedule .row .label{ display:none; }
    .foot-grid{ grid-template-columns:1fr; gap:46px; }
    section{ padding:96px 0; }
    .easter{ display:none; }
  }
  /* No forzar menú desktop en embed: el ancho del iframe gobierna hamburguesa vs. links. */
  html.embed-preview-root{ scroll-behavior:auto !important; }
  body.embed-preview #horario{ scroll-margin-top:96px; }
  body.embed-preview #aboutExtraBlocks .noir-about-extra.reveal .reveal-up,
  body.embed-preview #aboutExtraBlocks .noir-about-extra.reveal .h-line.short{
    opacity:1 !important;
    transform:translateY(0) !important;
  }
  body.embed-preview #aboutExtraBlocks .noir-about-extra.reveal .h-line.short{
    width:48px;
  }
  @media (max-width:560px){
    .gallery{ column-count:1; }
    .hero-actions{ flex-direction:column; align-items:stretch; }
    .btn{ justify-content:center; }
    .about-meta{ flex-direction:column; gap:16px; }
  }

  /* ───── REDUCED MOTION ─────────────────────────────── */
  @media (prefers-reduced-motion:reduce){
    *, *::before, *::after{
      animation-duration:.01ms !important; animation-iteration-count:1 !important;
      transition-duration:.01ms !important; scroll-behavior:auto !important;
    }
    .reveal-up{ opacity:1 !important; transform:none !important; }
    canvas#particles{ display:none; }
    .scroll-cue::after{ animation:none; height:24px; }
  }
  /* LW · lightbox galería */
  #galeria img{cursor:zoom-in}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:max(12px,3vw);box-sizing:border-box}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);border:0;cursor:pointer;padding:0}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;margin:0;max-width:min(96vw,1600px);max-height:92vh}
  .lw-gallery-lightbox-img{display:block;max-width:min(96vw,1600px);max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 24px 100px rgba(0,0,0,.75)}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:2px solid #fff;background:#0a0a0a;color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;font-family:system-ui,sans-serif}
  @media (max-width:654px){ .lw-gallery-lightbox-close{top:8px;right:8px} }
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')

<div class="cursor" id="cursor" aria-hidden="true"></div>

<!-- ═══ NAV (logo, anchors, CTA WhatsApp) ═══════════════ -->
<nav class="top" id="nav">
  <div class="wrap row">
    <a href="#portada" class="logo" id="navBrandWrap" data-cursor="lg">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span id="navBrandName">{{ $nombre }}</span>
    </a>
    <div class="links" role="menu">
      <!-- Orden = orden visual de las secciones del HTML (portada → sobre-nosotros
           → galeria → servicios → opiniones → horario → contacto/footer). -->
      <a href="#portada">Portada</a>
      <a href="#sobre-nosotros">Sobre nosotros</a>
      <a href="#galeria">Galería</a>
      <a href="#servicios" id="tplNavServicios" style="display:none;">Servicios</a>
      <a href="#opiniones" id="tplNavOpiniones" style="display:none;">Opiniones</a>
      <a href="#horario">Horario</a>
      <a href="#contacto">Contacto</a>
    </div>
    <a href="https://wa.me/{{ $whatsapp }}" class="btn outline sm desk-cta" data-cursor="lg" aria-label="WhatsApp" data-wa-link>
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.2c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.7.7-3.1-.2-.3C3.9 14.7 3.5 13.4 3.5 12 3.5 7.3 7.3 3.5 12 3.5S20.5 7.3 20.5 12 16.7 20 12 20z"/></svg>
      WhatsApp
    </a>
    <button class="burger" aria-label="Menú" id="burger"><span></span><span></span></button>
  </div>
</nav>

<div class="sheet" id="sheet">
  <ul>
    <!-- Mismo orden que el navbar de escritorio (orden visual del HTML). -->
    <li><a href="#portada">Portada</a></li>
    <li><a href="#sobre-nosotros">Sobre nosotros</a></li>
    <li><a href="#galeria">Galería</a></li>
    <li id="tplNavServiciosSheetLi" style="display:none;"><a href="#servicios">Servicios</a></li>
    <li id="tplNavOpinionesSheetLi" style="display:none;"><a href="#opiniones">Opiniones</a></li>
    <li><a href="#horario">Horario</a></li>
    <li><a href="#contacto">Contacto</a></li>
  </ul>
</div>

<!-- ═══ 1. PORTADA (foto + nombre + tagline + CTAs) ═════ -->
<header class="hero" id="portada">
  <div class="hero-bg" id="heroBg"></div>
  <canvas id="particles"></canvas>
  <div class="hero-inner" id="heroInner">
    <div class="h-line short"></div>
    <h1 class="hero-title reveal-up delay-1" id="heroTitle">{{ $nombre }}</h1>
    <p class="hero-tagline reveal-up delay-2" id="heroTagline">
      {{ $tagline }}
    </p>
    <div class="hero-actions reveal-up delay-3">
      <span id="tplBookingWrap" style="display:none;">
        <a href="#" id="tplBookingLink" class="btn primary" target="_blank" rel="noopener noreferrer">Pedir cita</a>
      </span>
      <a href="https://wa.me/{{ $whatsapp }}" class="btn primary" data-cursor="lg" data-wa-link>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.2c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
        WhatsApp
      </a>
    </div>
  </div>
  <div class="scroll-cue">Scroll</div>
</header>

<!-- ═══ 2. SOBRE NOSOTROS ({{ $descripcion }} + foto + tel) ═ -->
<section id="sobre-nosotros">
  <div class="wrap" id="aboutSec">
    <div class="about-grid">
      <div class="about-text">
        <span class="eyebrow reveal-up">— Sobre nosotros</span>
        <div class="h-line short reveal-up delay-2"></div>
        <p class="reveal-up delay-2" id="aboutDescripcion">
          {{ $descripcion }}
        </p>
        <div class="reveal-up delay-4" style="margin-top:46px; display:flex; gap:14px; flex-wrap:wrap;">
          <a href="tel:{{ $telefono }}" class="btn outline" data-cursor="lg" data-tel-link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
            <span data-phone-display>{{ $telefono ?: '+34 911 234 567' }}</span>
          </a>
        </div>
        <div id="tplVcardWrap" class="tpl-vcard-wrap" style="display:none;">
          <a href="{{ $vcard_download_url ?: '#' }}" id="tplVcardLink" class="btn outline sm" data-cursor="lg" download>Guardar contacto</a>
        </div>
      </div>
      <div class="about-photo reveal-up delay-2" id="aboutPhotoBg">
        <span class="badge" id="aboutTeamBadge">Equipo</span>
      </div>
    </div>
    @include('public.partials.about-extra-blocks-noir-elite')
  </div>
</section>

<!-- ═══ 3. GALERÍA ({{ '' }}) ══════════════════════════ -->
<section id="galeria">
  <div class="wrap" id="gallerySec">
    <div class="section-head">
      <div class="h-line short reveal-up"></div>
      <span class="eyebrow reveal-up delay-1">— Galería</span>
    </div>
    <div class="gallery reveal-up delay-2" id="galleryLive"></div>
  </div>
</section>

<!-- ═══ 3b. SERVICIOS (payload.services) ═══════════════════ -->
<section id="servicios" style="display:none;">
  <div class="wrap" id="servicesSec">
    <div class="section-head">
      <div class="h-line short reveal-up"></div>
      <span class="eyebrow reveal-up delay-1">— Servicios</span>
      <h2 class="section-title reveal-up delay-1">Carta y <em>precios</em></h2>
    </div>
    <div class="noir-services-grid reveal-up delay-2" id="tplServicesList">

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

<!-- ═══ 3a. OPINIONES / RESEÑAS GOOGLE (enlace Pro) ═══════ -->
<section id="opiniones" class="noir-reviews-section" style="display:none;">
  <div class="wrap" id="reviewsSec">
    <div class="section-head">
      <div class="h-line short reveal-up"></div>
      <span class="eyebrow reveal-up delay-1">— Opiniones</span>
      <h2 class="section-title reveal-up delay-1">Lo que dicen quienes nos <em>eligen</em></h2>
      <p class="noir-reviews-sub reveal-up delay-2">
        Lee experiencias reales y, si ya nos has visitado, deja tu valoración en Google: ayuda a otros a descubrirnos.
      </p>
    </div>
    <div class="noir-reviews-cta reveal-up delay-2">
      <a href="{{ $google_business_url ?: '#' }}" id="tplGbizLink" class="btn outline" target="_blank" rel="noopener noreferrer">Ver y escribir reseñas en Google</a>
    </div>
  </div>
</section>



{{-- ═══ 4. HORARIO (array $horario + estado abierto/cerrado) ═ --}}
<section id="horario">
  <div class="wrap" id="schedSec">
    <div class="section-head">
      <div class="h-line short reveal-up"></div>
      <span class="eyebrow reveal-up delay-1">— Horario</span>
      <h2 class="section-title reveal-up delay-1">Cuándo nos <em>encuentras</em></h2>
    </div>
    <div class="schedule-wrap">
      <div class="reveal-up" style="text-align:center; margin-bottom:28px;">
        <span class="status-pill" id="statusPill">
          <span class="dot"></span>
          <span id="statusText">Comprobando…</span>
        </span>
      </div>
      <div class="schedule reveal-up delay-1" id="schedule"></div>
      <p class="reveal-up delay-2" style="text-align:center; margin-top:24px; color:var(--muted); font-size:12px; letter-spacing:.2em; text-transform:uppercase;">
        Reserva con 24 h de antelación
      </p>
    </div>
  </div>
</section>

<!-- ═══ 5. FOOTER (datos + redes + ONEZ) ════════════ -->
<footer id="contacto">
  <div class="easter" id="easter"><span id="easterBrand">{{ $nombre }}</span> · est. 2014 <span class="stars">✦</span></div>
  <div class="wrap foot-map-block">
    <span class="eyebrow foot-map-eyebrow">— Cómo llegar</span>
    <p class="foot-map-sub" id="mapAddressLine" hidden></p>
    <div id="mapEmbedShell" class="foot-map-shell" hidden>
      <div id="mapLeafletContainer" class="foot-map-leaflet" role="img" aria-label="Mapa del negocio"></div>
    </div>
    <p id="mapPlaceholder" class="foot-map-placeholder">En el asistente, escribe tu dirección y pulsa «Buscar» para ver aquí el mapa interactivo.</p>
    <div id="tplMapsDirectionsRow" class="foot-map-directions-row" style="display:none;">
      <a href="{{ $google_maps_url ?: '#' }}" id="tplMapsExternalLink" class="btn outline sm" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a>
    </div>
  </div>
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <div class="foot-logo" id="footBrand">{{ $nombre }}</div>
        <p class="foot-tag" id="footTagline">{{ $tagline }}</p>
      </div>
      <div>
        <div class="foot-h">Visítanos</div>
        <ul class="foot-list">
          <li id="footAddressRow" hidden><span id="footAddress">{{ $direccion }}</span></li>
          <li><a href="tel:{{ $telefono }}" data-tel-link><span data-phone-display>{{ $telefono ?: '+34 911 234 567' }}</span></a></li>
          <li id="footEmailRow" hidden><a id="footEmailLink" href="#"><span id="footEmailDisplay"></span></a></li>
        </ul>
      </div>
      <div>
        <div class="foot-h">Síguenos</div>
        <div class="social">
          <a href="#" href="{{ $instagram_url }}" id="tplSocialInstagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
          <a href="#" href="{{ $tiktok_url }}" id="tplSocialTiktok" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3a5 5 0 0 0 4 4v3a8 8 0 0 1-4-1.2v6.7a5.5 5.5 0 1 1-5.5-5.5v3a2.5 2.5 0 1 0 2.5 2.5V3z"/></svg></a>
          <a href="#" href="{{ $facebook_url }}" id="tplSocialFacebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <span id="footBottomBrand">{{ $nombre }}</span>
      <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Creado con <a href="https://onez.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
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
(function () {
  var p = new URLSearchParams(window.location.search);
  if (p.get('embed') === '1' || p.get('preview') === '1' || p.get('parentOrigin')) {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
})();
/* ───── DATA: horario (plantilla + vista previa onboarding) ───────── */
const NOIR_SCHEDULE_DEFAULT = [
  // 0 = Domingo … 6 = Sábado
  { name:"Lunes",     idx:1, open:"13:30", close:"23:30", split:false },
  { name:"Martes",    idx:2, open:"13:30", close:"23:30", split:false },
  { name:"Miércoles", idx:3, open:"13:30", close:"23:30", split:false },
  { name:"Jueves",    idx:4, open:"13:30", close:"00:00", split:false },
  { name:"Viernes",   idx:5, open:"13:30", close:"01:00", split:false },
  { name:"Sábado",    idx:6, open:"13:00", close:"01:00", split:false },
  { name:"Domingo",   idx:0, open:null,    close:null,    split:false },
];
let SCHEDULE = NOIR_SCHEDULE_DEFAULT.map(function (d) {
  return { name: d.name, idx: d.idx, open: d.open, close: d.close, split: d.split };
});

function syncNoirScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = NOIR_SCHEDULE_DEFAULT.map(function (d) {
      return { name: d.name, idx: d.idx, open: d.open, close: d.close, split: d.split };
    });
    return;
  }
  var map = [
    ['mon', 1, 'Lunes'],
    ['tue', 2, 'Martes'],
    ['wed', 3, 'Miércoles'],
    ['thu', 4, 'Jueves'],
    ['fri', 5, 'Viernes'],
    ['sat', 6, 'Sábado'],
    ['sun', 0, 'Domingo'],
  ];
  SCHEDULE = map.map(function (tuple) {
    var key = tuple[0];
    var idx = tuple[1];
    var name = tuple[2];
    var row = h[key];
    if (!row || row.closed) {
      return { name: name, idx: idx, open: null, close: null, split: false };
    }
    return {
      name: name,
      idx: idx,
      open: row.open || '10:00',
      close: row.close || '20:00',
      split: false,
    };
  });
}

/* ───── GALERÍA · vista previa onboarding ───────────────── */
function escapeGalleryAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
var NOIR_DEFAULT_GALLERY_INNER =
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1551218372-a8789b81b253?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70" alt="" style="object-position: top;"/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>' +
  '<a class="photo" data-cursor="lg"><img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=70" alt=""/><div class="glass"><span>+</span></div></a>';

function updateNoirHeroSlider(raw) {
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

var noirGallerySliderTimer = null;
var noirGallerySliderIndex = 0;

function clearNoirGallerySlider() {
  if (noirGallerySliderTimer != null) {
    clearInterval(noirGallerySliderTimer);
    noirGallerySliderTimer = null;
  }
}

function updateNoirGallerySlider(isPro) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  clearNoirGallerySlider();

  root.classList.remove('gallery-slider');
  root.querySelectorAll('.gallery-nav-btn').forEach(function (btn) { btn.remove(); });
  root.querySelectorAll('.photo').forEach(function (el) { el.classList.remove('is-active'); });

  var photos = Array.prototype.slice.call(root.querySelectorAll('.photo'));
  if (!isPro || photos.length <= 1) return;

  root.classList.add('gallery-slider');
  noirGallerySliderIndex = 0;

  function paint() {
    photos.forEach(function (photo, i) {
      photo.classList.toggle('is-active', i === noirGallerySliderIndex);
    });
  }
  function go(delta) {
    noirGallerySliderIndex = (noirGallerySliderIndex + delta + photos.length) % photos.length;
    paint();
  }

  var prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'gallery-nav-btn prev';
  prev.setAttribute('aria-label', 'Foto anterior');
  prev.textContent = '‹';
  prev.addEventListener('click', function () { go(-1); });

  var next = document.createElement('button');
  next.type = 'button';
  next.className = 'gallery-nav-btn next';
  next.setAttribute('aria-label', 'Foto siguiente');
  next.textContent = '›';
  next.addEventListener('click', function () { go(1); });

  root.appendChild(prev);
  root.appendChild(next);
  paint();
  noirGallerySliderTimer = setInterval(function () { go(1); }, 3200);
}

function renderNoirGallery(urls) {
  var root = document.getElementById('galleryLive');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = NOIR_DEFAULT_GALLERY_INNER;
    return;
  }
  root.innerHTML = list
    .map(function (src) {
      return (
        '<a class="photo" data-cursor="lg"><img src="' +
        escapeGalleryAttr(src) +
        '" alt=""/><div class="glass"><span>+</span></div></a>'
      );
    })
    .join('');
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

var noirPreviewMap = null;
var noirPreviewMarker = null;
var NOIR_MAP_ZOOM = 18;

function destroyNoirPreviewMap() {
  if (noirPreviewMap) {
    try {
      noirPreviewMap.remove();
    } catch (e) {}
    noirPreviewMap = null;
    noirPreviewMarker = null;
  }
}

function noirRadarIcon() {
  if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return null;
  var html =
    '<div class="noir-map-pin-wrap">' +
    '<span class="noir-map-radar-ring"></span>' +
    '<span class="noir-map-radar-ring d2"></span>' +
    '<span class="noir-map-core"></span></div>';
  return L.divIcon({
    className: 'noir-leaflet-divicon',
    html: html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

function updatePreviewMapEmbed(lat, lon, addressLine) {
  var shell = document.getElementById('mapEmbedShell');
  var container = document.getElementById('mapLeafletContainer');
  var ph = document.getElementById('mapPlaceholder');
  var line = document.getElementById('mapAddressLine');
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
    destroyNoirPreviewMap();
    shell.hidden = true;
    if (ph) ph.hidden = false;
    return;
  }
  if (window.__LW_SKIP_LEAFLET) return;
  shell.hidden = false;
  if (ph) ph.hidden = true;
  if (typeof L === 'undefined') {
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(function () { updatePreviewMapEmbed(lat, lon, addressLine); });
    }
    return;
  }

  function applyMap() {
    if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
    if (!noirPreviewMap) {
      noirPreviewMap = L.map(container, {
        zoomControl: true,
        attributionControl: false,
        /** Solo zoom desde los botones +/-: ver `urban-bold.html` para el detalle. */
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([lat, lon], NOIR_MAP_ZOOM);
      L.control.attribution({ prefix: false }).addTo(noirPreviewMap);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(noirPreviewMap);
    } else {
      noirPreviewMap.setView([lat, lon], NOIR_MAP_ZOOM);
    }
    if (noirPreviewMarker) {
      noirPreviewMap.removeLayer(noirPreviewMarker);
    }
    noirPreviewMarker = L.marker([lat, lon], { icon: noirRadarIcon() }).addTo(noirPreviewMap);
    setTimeout(function () {
      if (noirPreviewMap) noirPreviewMap.invalidateSize();
    }, 80);
    setTimeout(function () {
      if (noirPreviewMap) noirPreviewMap.invalidateSize();
    }, 320);
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(applyMap);
  });
}

/* ───── LIVE PREVIEW DATA (query params + postMessage) ─── */
function escapeAttrNoir(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderNoirAboutExtras(sections) {
  var wrap = document.getElementById('aboutExtraBlocks');
  if (!wrap) return;
  wrap.className = 'noir-about-extras';
  wrap.setAttribute('data-main-text-first', '1');
  var list = Array.isArray(sections) ? sections.filter(function (s) { return s != null; }) : [];
  if (list.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = list
    .map(function (sec, i) {
      var title = escapeHtmlText(String(sec.title || '').trim());
      var desc = escapeHtmlText(String(sec.description || '').trim());
      var img = String(sec.image_url || '').trim();
      var mainTF = typeof lwIsMainAboutTextFirst === 'function' ? lwIsMainAboutTextFirst(wrap) : true;
      var textFirst = typeof lwAboutExtraTextFirst === 'function' ? lwAboutExtraTextFirst(i, mainTF) : (i + 1) % 2 === 0;
      var mod = textFirst ? 'noir-about-extra--text-first' : 'noir-about-extra--photo-first';
      var blockNum = String(i + 3).padStart(2, '0');
      var photoStyle = img ? ' style="background-image:url(\'' + escapeAttrNoir(img) + '\')"' : '';
      var photoClass =
        'about-photo noir-about-extra__photo reveal-up delay-2' + (img ? ' has-photo' : '');
      return (
        '<article class="noir-about-extra about-grid ' +
        mod +
        '">' +
        '<div class="about-text noir-about-extra__text">' +
        '<span class="eyebrow reveal-up">— Bloque ' +
        blockNum +
        '</span>' +
        '<div class="h-line short reveal-up delay-1"></div>' +
        (title ? '<h3 class="noir-about-extra__title reveal-up delay-2">' + title + '</h3>' : '') +
        (desc ? '<p class="noir-about-extra__desc reveal-up delay-2">' + desc + '</p>' : '') +
        '</div>' +
        '<div class="' +
        photoClass +
        '"' +
        photoStyle +
        '></div></article>'
      );
    })
    .join('');
  wrap.querySelectorAll('.noir-about-extra').forEach(function (el) {
    el.classList.add('reveal');
  });
  if (typeof window.lwRefreshAboutExtrasReveal === 'function') {
    window.lwRefreshAboutExtrasReveal();
  }
  if (typeof window.noirRevealAboutExtras === 'function') {
    window.noirRevealAboutExtras();
  }
}

window.lwRenderAboutExtrasImpl = renderNoirAboutExtras;

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNoirPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function buildDirectionsUrlFromRaw(raw) {
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

function syncNoirTemplateExtensions(raw) {
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
          var nm = escapeHtmlText(String(s.name || ''));
          var pr = escapeHtmlText(formatNoirPrice(s.price));
          var dc = s.description && String(s.description).trim();
          var descHtml = dc
            ? '<p class="noir-svc-desc">' + escapeHtmlText(String(s.description)) + '</p>'
            : '';
          return (
            '<article class="noir-svc-card"><h3 class="noir-svc-name">' +
            nm +
            '</h3><div class="noir-svc-price">' +
            pr +
            '</div>' +
            descHtml +
            '</article>'
          );
        })
        .join('');
    }
  }

  var mapsUrl = buildDirectionsUrlFromRaw(raw);
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
      vcWrap.style.display = 'block';
      vcA.href = vcUrl;
    } else {
      vcWrap.style.display = 'none';
      vcA.removeAttribute('href');
    }
  }

  var LW_DEFAULT_SOCIAL = {
    instagram: 'https://www.instagram.com/onez.es',
    tiktok: 'https://www.tiktok.com/@onez',
    facebook: 'https://www.facebook.com/onez'
  };
  function noirResolveSocialHref(raw, key, fallback) {
    var u = (raw[key] || '').trim();
    if (u) return u;
    return fallback || '#';
  }
  var igEl = document.getElementById('tplSocialInstagram');
  var ttEl = document.getElementById('tplSocialTiktok');
  var fbEl = document.getElementById('tplSocialFacebook');
  if (igEl) igEl.href = noirResolveSocialHref(raw, 'instagram_url', LW_DEFAULT_SOCIAL.instagram);
  if (ttEl) ttEl.href = noirResolveSocialHref(raw, 'tiktok_url', LW_DEFAULT_SOCIAL.tiktok);
  if (fbEl) fbEl.href = noirResolveSocialHref(raw, 'facebook_url', LW_DEFAULT_SOCIAL.facebook);
}

function applyLivePreviewData(raw, opts){
  opts = opts || {};
  const defaults = {
    name: 'Casa Lumen',
    tagline: 'Cocina de producto, fuego lento y una bodega curada con criterio.',
    phoneWa: '34911234567',
    aboutText: 'Casa Lúmen abrió hace once años en una antigua imprenta del barrio de Chamberí. Trabajamos con dieciséis pequeños productores del centro peninsular y servimos solo el menú del día.',
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

  document.title = `${name} — ONEZ`;

  const logoUrl = (raw?.logo_url || '').trim();
  var navTopEl = document.querySelector('nav.top');
  if (navTopEl) {
    if (logoUrl) {
      var lsc = typeof raw?.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : (logoUrl ? 1.35 : 1);
      if (lsc < 0.45) lsc = 0.45;
      if (lsc > 1.5) lsc = 1.5;
      navTopEl.style.setProperty('--lw-logo-scale', String(lsc));
    } else {
      navTopEl.style.removeProperty('--lw-logo-scale');
    }
  }
  const navBrandWrap = document.getElementById('navBrandWrap');
  const navBrandLogo = document.getElementById('navBrandLogo');
  const navBrandName = document.getElementById('navBrandName');
  if (navBrandWrap && navBrandLogo && navBrandName) {
    if (logoUrl) {
      navBrandLogo.src = logoUrl;
      navBrandLogo.alt = name ? `${name} · logo` : 'Logo';
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
  if (navBrandName && !logoUrl) navBrandName.textContent = name;

  const navBrandTagline = document.getElementById('navBrandTagline');
  if (navBrandTagline) {
    const navTl = (raw?.tagline || '').trim();
    if (navTl) {
      navBrandTagline.textContent = navTl;
      navBrandTagline.hidden = false;
    } else {
      navBrandTagline.textContent = '';
      navBrandTagline.hidden = true;
    }
  }

  const footBrand = document.getElementById('footBrand');
  if (footBrand) footBrand.textContent = name;

  const footTagline = document.getElementById('footTagline');
  if (footTagline) footTagline.textContent = tagline || defaults.tagline;

  const footAddress = document.getElementById('footAddress');
  const footAddressRow = document.getElementById('footAddressRow');
  if (footAddress && footAddressRow) {
    if (direccion) {
      footAddress.textContent = direccion;
      footAddressRow.hidden = false;
    } else {
      footAddress.textContent = '';
      footAddressRow.hidden = true;
    }
  }

  const footEmailRow = document.getElementById('footEmailRow');
  const footEmailLink = document.getElementById('footEmailLink');
  const footEmailDisplay = document.getElementById('footEmailDisplay');
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

  const footBottomBrand = document.getElementById('footBottomBrand');
  if (footBottomBrand) footBottomBrand.textContent = name;

  var mlat = raw?.map_lat;
  var mlon = raw?.map_lon;
  var latN = typeof mlat === 'number' ? mlat : parseFloat(mlat);
  var lonN = typeof mlon === 'number' ? mlon : parseFloat(mlon);
  if (Number.isFinite(latN) && Number.isFinite(lonN)) {
    updatePreviewMapEmbed(latN, lonN, direccion || '');
  } else {
    updatePreviewMapEmbed(NaN, NaN, direccion || '');
  }

  const easterBrand = document.getElementById('easterBrand');
  if (easterBrand) easterBrand.textContent = name;

  const aboutTeamBadge = document.getElementById('aboutTeamBadge');
  if (aboutTeamBadge) aboutTeamBadge.textContent = `Equipo · ${name}`;

  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = name;

  const heroTagline = document.getElementById('heroTagline');
  if (heroTagline) heroTagline.textContent = tagline;

  const aboutDescripcion = document.getElementById('aboutDescripcion');
  if (aboutDescripcion) aboutDescripcion.textContent = descripcion || defaults.aboutText;

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  updateNoirHeroSlider(raw || {});

  const aboutPhotoBg = document.getElementById('aboutPhotoBg');
  if (aboutPhotoBg) {
    aboutPhotoBg.style.backgroundImage = fotoEquipo ? `url("${fotoEquipo}")` : '';
  }

  const galeria = Array.isArray(raw?.galeria) ? raw.galeria.filter(Boolean) : [];
  renderNoirGallery(galeria);
  syncNoirScheduleFromPreview(raw.horario);
  renderSchedule();
  syncNoirTemplateExtensions(raw);
  if (opts.alignToHash) scrollEmbedPreviewToHash();
}
</script>
<script src="/templates/lw-about-extras.js?v=2"></script>
<script>
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

/* ───── NAV scroll state ───────────────────────────────── */
const nav = document.getElementById('nav');
function onScroll(){
  nav.classList.toggle('scrolled', window.scrollY > 30);
  // parallax on hero bg
  const bg = document.getElementById('heroBg');
  if (bg) bg.style.transform = `translateY(${window.scrollY * 0.4}px)`;
}
window.addEventListener('scroll', onScroll, { passive:true });
onScroll();

/* ───── BURGER ────────────────────────────────────────── */
const burger = document.getElementById('burger');
const sheet = document.getElementById('sheet');
burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

/* ───── INTERSECTION OBSERVER · reveal (vista previa embebida: escalonado) ─ */
(function initSectionReveals(){
  var ids = ['heroInner','aboutSec','gallerySec','reviewsSec','servicesSec','schedSec'];
  var embedPreview = document.body.classList.contains('embed-preview');
  var io = null;

  window.noirRevealAboutExtras = function(){
    document.querySelectorAll('#aboutExtraBlocks .noir-about-extra').forEach(function(el, i){
      if (io && io.observe) {
        try { io.observe(el); } catch (err) { /* ya observado */ }
      }
      var delay = embedPreview ? 20 + i * 70 : 40 + i * 120;
      setTimeout(function(){ el.classList.add('reveal'); }, delay);
    });
  };

  if (embedPreview) {
    ids.forEach(function(id, i){
      var el = document.getElementById(id);
      if (el) setTimeout(function(){ el.classList.add('reveal'); }, 60 + i * 160);
    });
    window.noirRevealAboutExtras();
    return;
  }

  io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        e.target.classList.add('reveal');
        io.unobserve(e.target);
      }
    });
  }, { threshold:.18 });
  ids.forEach(function(id){
    var el = document.getElementById(id); if (el) io.observe(el);
  });
  document.querySelectorAll('#aboutExtraBlocks .noir-about-extra').forEach(function(el){
    io.observe(el);
  });
})();

/* ───── HORARIO render + estado abierto/cerrado por día ───────────── */
function renderSchedule(){
  const now = new Date();
  const today = now.getDay();           // 0..6
  const wrap = document.getElementById('schedule');
  wrap.innerHTML = '';

  // build rows in week order starting Monday
  const ordered = [...SCHEDULE].sort((a,b) => ((a.idx+6)%7) - ((b.idx+6)%7));
  ordered.forEach(d => {
    const isToday = d.idx === today;
    const openDay = Boolean(d.open);
    const row = document.createElement('div');
    row.className = `row${isToday ? ' today' : ''}${openDay ? '' : ' closed'}`;
    row.innerHTML = `
      <span class="day">${d.name}</span>
      <span class="hours">${openDay ? d.open + ' — ' + d.close : 'Cerrado'}</span>
      <span class="label">${openDay ? 'Abierto' : 'Cerrado'}</span>
    `;
    wrap.appendChild(row);
  });

  // status general del día actual (no por hora)
  const todayD = SCHEDULE.find(d => d.idx === today);
  const openToday = Boolean(todayD && todayD.open);
  const pill = document.getElementById('statusPill');
  const txt = document.getElementById('statusText');
  pill.classList.toggle('open', openToday);
  txt.textContent = openToday ? 'Abierto hoy' : 'Cerrado hoy';
}
renderSchedule();
setInterval(renderSchedule, 60_000);

/* ───── PARTICLES (canvas, gold dust) ─────────────────── */
(function particles(){
  const c = document.getElementById('particles');
  if (!c) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w, h, parts = [];
  function size(){
    w = c.width = c.clientWidth * dpr;
    h = c.height = c.clientHeight * dpr;
  }
  size();
  window.addEventListener('resize', size);

  const N = 70;
  for (let i = 0; i < N; i++){
    parts.push({
      x: Math.random()*w, y: Math.random()*h,
      r: (Math.random()*1.4 + .6) * dpr,
      vy: -(Math.random()*0.25 + 0.05) * dpr,
      vx: (Math.random() - .5) * 0.04 * dpr,
      a: Math.random()*0.25 + 0.08,
      tw: Math.random()*Math.PI*2,
    });
  }
  function frame(){
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.tw += 0.02;
      const tw = (Math.sin(p.tw) + 1) * .5;     // 0..1
      if (p.y < -10) { p.y = h + 10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.fillStyle = `rgba(201,168,76,${p.a * (.5 + tw*.5)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ───── CURSOR (pointer:fine only) ────────────────────── */
(function cursor(){
  if (!matchMedia('(pointer:fine)').matches) return;
  const cur = document.getElementById('cursor');
  let x = 0, y = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  function tick(){
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    cur.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.querySelectorAll('[data-cursor="lg"], a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('large'));
    el.addEventListener('mouseleave', () => cur.classList.remove('large'));
  });
})();

/* ───── EASTER EGG: triple-click on the corner mark
        reveals a tiny constellation in the footer.        */
(function easter(){
  const e = document.getElementById('easter'); if (!e) return;
  let n = 0, t = 0;
  e.addEventListener('click', () => {
    const now = Date.now();
    if (now - t > 600) n = 0;
    n++; t = now;
    if (n >= 3){
      e.querySelector('.stars').textContent = '✦  ✧  ·  ✦  ·  ✧  ✦';
      e.style.color = 'var(--gold)';
      n = 0;
    }
  });
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
(function bootNoirEliteTenantPage() {
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
    if (typeof syncNoirScheduleFromPreview === 'function') syncNoirScheduleFromPreview(@json($horario));
    else if (typeof syncBoldScheduleFromPreview === 'function') syncBoldScheduleFromPreview(@json($horario));
    if (typeof renderSchedule === 'function') renderSchedule();
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
