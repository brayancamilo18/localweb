@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
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
    --bg:#FFFFFF; --bg-2:#F4F4F2; --bg-3:#E8E7E3;
    --ink:#0A0A0A; --ink-2:#2A2A28; --ink-3:#6A6A65; --ink-4:#A6A6A0;
    --line:#D8D7D2; --line-2:#B8B7B0;
    --accent:#E04E2C;
    --paper:#FAFAF7;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  section[id],a[id]{scroll-margin-top:88px}
  body{background:var(--bg);color:var(--ink);font-family:"Inter",system-ui,sans-serif;font-weight:400;font-size:15.5px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden;font-feature-settings:"kern","tnum"}
  html.embed-preview-root,body.embed-preview{overflow:auto!important;height:auto!important;min-height:100%}
  body.embed-preview .nav{position:sticky}
  ::selection{background:var(--ink);color:var(--bg)}
  a{color:inherit;text-decoration:none}
  img{display:block;max-width:100%}
  .serif{font-family:"Playfair Display",Georgia,serif;font-weight:500;letter-spacing:-.015em;line-height:1.02}
  .mono{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.9em}
  .container{max-width:1320px;margin:0 auto;padding:0 40px}
  .container-tight{max-width:1080px;margin:0 auto;padding:0 40px}
  .eyebrow{display:inline-flex;align-items:center;gap:14px;font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:500;color:var(--ink);letter-spacing:.16em;text-transform:uppercase}
  .eyebrow::before{content:"";width:32px;height:1px;background:var(--ink)}
  .rule{height:1px;background:var(--ink);width:100%;margin:0}
  .rule-thin{height:1px;background:var(--line)}

  /* ─── NAV ─── */
  .nav{position:fixed;top:0;left:0;right:0;z-index:60;background:rgba(255,255,255,.85);backdrop-filter:saturate(160%) blur(16px);-webkit-backdrop-filter:saturate(160%) blur(16px);border-bottom:1px solid transparent;transition:border-color .3s}
  .nav.scrolled{border-color:var(--line)}
  .nav-inner{max-width:1320px;margin:0 auto;padding:18px 40px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px}
  .brand{font-family:"Playfair Display",serif;font-size:24px;font-weight:500;letter-spacing:-.005em;color:var(--ink);grid-column:2;display:flex;flex-direction:column;align-items:center;text-align:center}
  .brand small{display:block;font-family:"JetBrains Mono",monospace;font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.28em;text-align:center;margin-top:4px;font-weight:400}
  .nav{--lw-logo-scale:1}
  .brand.brand-has-img .nav-brand-img{display:block;height:calc(40px * var(--lw-logo-scale,1));width:auto;max-width:calc(200px * var(--lw-logo-scale,1));object-fit:contain;margin:0 auto 4px}
  .brand.brand-has-img #navBrandName,.brand.brand-has-img #navBrandCat{display:none!important}
  .nav-left{display:flex;gap:32px;list-style:none}
  .nav-right{display:flex;justify-content:flex-end;align-items:center;gap:32px;list-style:none}
  .nav a.lnk{font-size:12px;color:var(--ink-2);font-weight:500;letter-spacing:.14em;text-transform:uppercase;padding:6px 0;position:relative}
  .nav a.lnk::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--ink);transform:scaleX(0);transform-origin:right;transition:transform .5s cubic-bezier(.7,0,.3,1)}
  .nav a.lnk:hover::after{transform-origin:left;transform:scaleX(1)}
  .nav-cta{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:var(--ink);color:var(--bg);font-size:11.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;border:1px solid var(--ink);transition:background .3s,color .3s}
  .nav-cta:hover{background:transparent;color:var(--ink)}

  .burger{display:none;width:40px;height:40px;background:transparent;border:1px solid var(--ink);cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0}
  .burger span{display:block;width:18px;height:1.5px;background:var(--ink);transition:.25s}
  .burger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
  .burger.open span:nth-child(2){opacity:0}
  .burger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}

  .mobile-menu{display:flex;flex-direction:column;position:fixed;top:0;left:0;right:0;bottom:0;background:var(--ink);color:var(--bg);z-index:200;padding:100px 40px 40px;transform:translateY(-100%);transition:transform .55s cubic-bezier(.7,0,.3,1);overflow-y:auto}
  .mobile-menu.open{transform:translateY(0)}
  body.mono-menu-open .nav{z-index:220}
  .mobile-menu-close{position:absolute;top:28px;right:28px;width:44px;height:44px;border:1px solid rgba(255,255,255,.35);background:transparent;color:var(--bg);font-size:22px;line-height:1;cursor:pointer;z-index:3}
  #servicios.is-hidden,#opiniones.is-hidden,.vcard.is-hidden{display:none!important}
  #tpl-platform-branding a{color:var(--accent)}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(10,10,10,.88);border:none;cursor:pointer}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;max-width:min(96vw,1100px);max-height:90vh;margin:0}
  .lw-gallery-lightbox-img{max-width:100%;max-height:90vh;display:block;object-fit:contain}
  .lw-gallery-lightbox-close{position:absolute;top:-12px;right:-12px;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:22px;cursor:pointer;line-height:1}
  .mobile-menu ul{list-style:none}
  .mobile-menu ul li{border-bottom:1px solid rgba(255,255,255,.1);overflow:hidden}
  .mobile-menu ul a{display:block;padding:22px 0;font-family:"Playfair Display",serif;font-size:38px;color:var(--bg);font-weight:500;letter-spacing:-.01em;transform:translateY(110%);transition:transform .6s cubic-bezier(.7,0,.3,1)}
  .mobile-menu.open ul a{transform:translateY(0)}
  .mobile-menu ul li:nth-child(2) a{transition-delay:.05s}
  .mobile-menu ul li:nth-child(3) a{transition-delay:.1s}
  .mobile-menu ul li:nth-child(4) a{transition-delay:.15s}
  .mobile-menu ul li:nth-child(5) a{transition-delay:.2s}
  .mobile-menu ul li:nth-child(6) a{transition-delay:.25s}
  .mobile-menu ul a em{font-style:italic;color:var(--accent)}
  .mobile-cta{display:block;margin-top:40px;padding:18px;text-align:center;background:var(--accent);color:var(--bg);font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase}

  /* ─── HERO · diagonal staircase ─── */
  .hero{padding:140px 0 100px;position:relative}
  .hero-top{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:24px;border-bottom:1px solid var(--ink);margin-bottom:48px;flex-wrap:wrap;gap:16px}
  .hero-top .eyebrow{margin:0}
  .pill-status{display:inline-flex;align-items:center;gap:10px;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
  .pill-status .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2.4s infinite}
  .pill-status.closed .dot{background:var(--ink-4);animation:none}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.85)}}

  .hero h1{font-family:"Playfair Display",serif;font-size:clamp(64px,12vw,200px);font-weight:500;line-height:.88;letter-spacing:-.025em;color:var(--ink);margin-bottom:24px}
  .hero h1 .line{display:block;overflow:hidden}
  .hero h1 .line > span{display:inline-block;transform:translateY(105%);transition:transform 1.05s cubic-bezier(.7,0,.3,1)}
  .hero.in h1 .line > span{transform:translateY(0)}
  .hero h1 .line:nth-child(2) > span{transition-delay:.12s}
  .hero h1 .line:nth-child(3) > span{transition-delay:.24s}
  .hero h1 em{font-style:italic;font-weight:500;color:var(--accent)}

  /* hero staircase 3 fotos */
  .hero-stair{position:relative;height:680px;margin:60px 0 64px}
  .sphoto{position:absolute;overflow:hidden;background:var(--bg-3);background-size:cover;background-position:center;will-change:transform,filter;filter:grayscale(1) contrast(1.05);transition:filter .8s cubic-bezier(.7,0,.3,1)}
  .sphoto::before{content:"";position:absolute;inset:0;background:var(--bg);transform-origin:top;transition:transform 1.3s cubic-bezier(.7,0,.3,1) 0s;z-index:2}
  .hero.in .sphoto::before{transform:scaleY(0)}
  .hero.in .sphoto:nth-child(2)::before{transition-delay:.18s}
  .hero.in .sphoto:nth-child(3)::before{transition-delay:.36s}
  .sphoto:hover{filter:grayscale(0) contrast(1)}
  /* staircase positions */
  .sphoto.s1{top:0;left:0;width:38%;height:62%;background-image:var(--img-1,url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=75'))}
  .sphoto.s2{top:18%;left:34%;width:38%;height:64%;z-index:2;background-image:var(--img-2,url('https://images.unsplash.com/photo-1650044252595-cacd425982ff?auto=format&fit=crop&w=700&q=75'))}
  .sphoto.s3{top:36%;right:0;width:34%;height:62%;background-image:var(--img-3,url('https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?auto=format&fit=crop&w=700&q=75'))}
  .sphoto.fallback{background:linear-gradient(180deg,var(--ink),var(--ink-2));filter:none}
  .sphoto.fallback.s2{background:linear-gradient(180deg,var(--bg-2),var(--bg-3))}
  .sphoto.fallback.s3{background:linear-gradient(180deg,var(--accent),#A8351E)}
  .sphoto-num{position:absolute;left:14px;top:14px;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--bg);background:var(--ink);padding:6px 10px;letter-spacing:.16em;text-transform:uppercase;z-index:3}
  .sphoto-cap{position:absolute;left:14px;bottom:14px;font-family:"JetBrains Mono",monospace;font-size:10.5px;color:var(--bg);letter-spacing:.16em;text-transform:uppercase;background:rgba(10,10,10,.7);backdrop-filter:blur(6px);padding:7px 11px;z-index:3}

  .hero-issue{position:absolute;right:0;top:-32px;font-family:"JetBrains Mono",monospace;font-size:10.5px;color:var(--ink-3);letter-spacing:.18em;text-transform:uppercase;text-align:right;line-height:1.7}
  .hero-issue strong{font-family:"Playfair Display",serif;font-size:32px;font-style:italic;color:var(--ink);font-weight:500;display:block;letter-spacing:-.005em;margin-bottom:4px}

  .hero-bottom{display:grid;grid-template-columns:1fr 1fr 1fr;gap:48px;align-items:start;padding-top:32px;border-top:1px solid var(--ink)}
  .hero-lede{font-family:"Playfair Display",serif;font-size:22px;line-height:1.45;color:var(--ink);font-style:italic;font-weight:500;letter-spacing:-.005em}
  .hero-lede strong{font-style:normal;font-weight:700;color:var(--accent)}
  .hero-credits{display:flex;flex-direction:column;gap:10px;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink-2);letter-spacing:.04em;line-height:1.7;text-transform:uppercase}
  .hero-credits div{display:flex;justify-content:space-between;gap:14px;padding-bottom:6px;border-bottom:1px dashed var(--line)}
  .hero-credits div span:first-child{color:var(--ink-3)}
  .hero-cta{display:flex;flex-direction:column;gap:12px}
  .btn-edito{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 0;font-size:12px;color:var(--ink);letter-spacing:.18em;text-transform:uppercase;font-weight:500;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);transition:padding .5s cubic-bezier(.7,0,.3,1),color .3s}
  .btn-edito::after{content:"→";font-size:14px;transition:transform .5s cubic-bezier(.7,0,.3,1)}
  .btn-edito:hover{padding-left:18px;padding-right:18px;color:var(--accent)}
  .btn-edito:hover::after{transform:translateX(10px)}
  .btn-edito.solid{background:var(--ink);color:var(--bg);padding-left:22px;padding-right:22px;border:none}
  .btn-edito.solid:hover{background:var(--accent);padding-left:32px;padding-right:32px}

  /* ─── TICKER ─── */
  .ticker{padding:24px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);overflow:hidden;background:var(--bg);pointer-events:none;user-select:none}
  .ticker-track{display:flex;gap:64px;font-family:"Playfair Display",serif;font-size:32px;font-weight:500;font-style:italic;letter-spacing:-.01em;white-space:nowrap;animation:scroll-m 50s linear infinite;will-change:transform;color:var(--ink)}
  .ticker-track span{display:inline-flex;align-items:center;gap:64px;flex-shrink:0}
  .ticker-track span::before{content:"✱";color:var(--accent);font-style:normal;font-size:18px}
  @keyframes scroll-m{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* ─── SECTIONS ─── */
  section{padding:140px 0;position:relative}
  .section-num{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink-3);letter-spacing:.18em;text-transform:uppercase;margin-bottom:48px;display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:1px solid var(--ink)}
  .section-num strong{color:var(--ink)}
  .section-head{display:grid;grid-template-columns:1fr 1.3fr;gap:64px;align-items:end;margin-bottom:80px}
  .section-head h2{font-family:"Playfair Display",serif;font-size:clamp(52px,8vw,128px);font-weight:500;line-height:.94;letter-spacing:-.025em}
  .section-head h2 em{font-style:italic;color:var(--accent)}
  .section-head .desc{font-size:16px;color:var(--ink-2);line-height:1.75;max-width:520px;padding-bottom:14px;font-weight:400}

  /* ─── SERVICES · acordeón ─── */
  .acc-list{border-top:1px solid var(--ink);max-width:1080px;margin:0 auto}
  .acc-item{border-bottom:1px solid var(--ink);position:relative}
  .acc-head{display:grid;grid-template-columns:80px 1fr auto auto;align-items:baseline;gap:32px;padding:36px 0;cursor:pointer;transition:padding .5s cubic-bezier(.7,0,.3,1)}
  .acc-head:hover{padding-left:18px;padding-right:18px}
  .acc-num{font-family:"JetBrains Mono",monospace;font-size:12px;color:var(--ink-3);letter-spacing:.14em;text-transform:uppercase;font-weight:500}
  .acc-name{font-family:"Playfair Display",serif;font-size:clamp(32px,4vw,52px);font-weight:500;letter-spacing:-.015em;line-height:1.02;color:var(--ink)}
  .acc-price{font-family:"Playfair Display",serif;font-size:26px;color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:-.005em}
  .acc-toggle{width:36px;height:36px;border:1px solid var(--ink);display:grid;place-items:center;font-family:"JetBrains Mono",monospace;font-size:14px;color:var(--ink);transition:background .3s,color .3s,transform .4s}
  .acc-item.open .acc-toggle{background:var(--ink);color:var(--bg);transform:rotate(45deg)}
  .acc-body{max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.7,0,.3,1)}
  .acc-item.open .acc-body{max-height:300px}
  .acc-body-inner{padding:0 0 36px;display:grid;grid-template-columns:80px 1fr;gap:32px}
  .acc-body-inner div:last-child{font-size:15px;color:var(--ink-2);line-height:1.7;max-width:60ch}
  .acc-body-inner div:last-child em{font-style:italic;color:var(--accent)}

  /* ─── ABOUT · split tipográfico con foto pequeña ─── */
  .about{padding:140px 0;background:var(--paper);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
  .about-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:96px;align-items:start;max-width:1320px;margin:0 auto;padding:0 40px}
  .about h2{font-family:"Playfair Display",serif;font-size:clamp(44px,6vw,84px);font-weight:500;line-height:.96;letter-spacing:-.02em;margin:24px 0 32px}
  .about h2 em{font-style:italic;color:var(--accent)}
  .about-lede{font-family:"Playfair Display",serif;font-size:24px;font-style:italic;color:var(--ink);line-height:1.4;font-weight:500;margin-bottom:36px;padding-bottom:28px;border-bottom:1px solid var(--ink)}
  .about-cols{column-count:2;column-gap:48px;font-size:15.5px;color:var(--ink-2);line-height:1.75}
  .about-cols p{margin-bottom:18px;break-inside:avoid}
  .about-cols p strong{color:var(--ink);font-weight:600}
  .about-side{position:sticky;top:120px}
  .about-photo{aspect-ratio:3/4;background:var(--bg-3) center/cover;background-image:var(--about-img,url('https://images.unsplash.com/photo-1559185590-765cdc663325?auto=format&fit=crop&w=700&q=75'));filter:grayscale(1);transition:filter .8s}
  .about-photo:hover{filter:grayscale(0)}
  .about-cap{font-family:"JetBrains Mono",monospace;font-size:10.5px;color:var(--ink-3);letter-spacing:.16em;text-transform:uppercase;margin-top:14px;line-height:1.6;display:flex;justify-content:space-between;gap:16px;padding-top:12px;border-top:1px solid var(--ink)}
  .about-cap strong{color:var(--ink);font-family:"Playfair Display",serif;font-size:16px;font-weight:500;letter-spacing:-.005em;text-transform:none;font-style:italic}

  /* ─── GALLERY · mosaico editorial ─── */
  .gallery-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;max-width:1320px;margin:0 auto;padding:0 40px}
  .gimg{position:relative;overflow:hidden;background:var(--bg-3);cursor:pointer}
  .gimg-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:grayscale(1) contrast(1.05);transition:filter .6s,transform 1.1s cubic-bezier(.7,0,.3,1)}
  .gimg:hover .gimg-bg{filter:grayscale(0) contrast(1);transform:scale(1.04)}
  .gimg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,10,10,.35));opacity:0;transition:opacity .5s;pointer-events:none}
  .gimg:hover::after{opacity:1}
  .gimg:nth-child(1){grid-column:span 7;aspect-ratio:7/5}
  .gimg:nth-child(2){grid-column:span 5;aspect-ratio:5/5}
  .gimg:nth-child(3){grid-column:span 4;aspect-ratio:4/5}
  .gimg:nth-child(4){grid-column:span 4;aspect-ratio:4/5}
  .gimg:nth-child(5){grid-column:span 4;aspect-ratio:4/5}
  .gimg:nth-child(6){grid-column:span 6;aspect-ratio:6/4}
  .gimg:nth-child(7){grid-column:span 6;aspect-ratio:6/4}

  /* ─── HOURS + CONTACT · lado a lado ─── */
  .hours-section{padding:140px 0;background:var(--ink);color:var(--bg);border-top:1px solid var(--ink)}
  .hours-section .section-num{color:var(--ink-4);border-color:rgba(255,255,255,.2)}
  .hours-section .section-num strong{color:var(--bg)}
  .hours-section h2{color:var(--bg)}
  .hours-section h2 em{color:var(--accent)}
  .hours-section .desc{color:rgba(255,255,255,.7)}
  .hours-grid{display:grid;grid-template-columns:1fr 1fr;gap:96px;max-width:1320px;margin:0 auto;padding:0 40px}
  .hours-card h3{font-family:"Playfair Display",serif;font-size:32px;font-weight:500;letter-spacing:-.015em;margin:18px 0 32px;color:var(--bg)}
  .hours-card h3 em{font-style:italic;color:var(--accent)}
  .hours-card .eyebrow{color:var(--accent)}
  .hours-card .eyebrow::before{background:var(--accent)}
  .schedule-row{display:grid;grid-template-columns:1fr auto;align-items:baseline;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.15);font-size:15px}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row .day{color:rgba(255,255,255,.75);letter-spacing:.02em;font-family:"JetBrains Mono",monospace;font-size:11.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
  .schedule-row .time{font-family:"Playfair Display",serif;font-size:22px;color:var(--bg);font-variant-numeric:tabular-nums;font-weight:500}
  .schedule-row .closed{color:var(--ink-4);font-style:italic;font-family:"Playfair Display",serif;font-size:18px;font-weight:500}
  .schedule-row.today{color:var(--accent)}
  .schedule-row.today .day{color:var(--accent)}
  .schedule-row.today .day::after{content:" / ahora";color:rgba(255,255,255,.5)}
  .schedule-row.today .time{color:var(--accent)}

  .contact-list{display:flex;flex-direction:column;gap:0}
  .contact-link{display:grid;grid-template-columns:60px 1fr;gap:20px;padding:22px 0;border-bottom:1px solid rgba(255,255,255,.15);transition:padding .5s cubic-bezier(.7,0,.3,1)}
  .contact-link:last-child{border-bottom:none}
  .contact-link:hover{padding-left:14px}
  .contact-link .ico{font-family:"Playfair Display",serif;font-size:28px;font-style:italic;color:var(--accent);font-weight:500;line-height:1}
  .contact-link strong{display:block;font-family:"Playfair Display",serif;font-size:22px;font-weight:500;color:var(--bg);letter-spacing:-.005em;line-height:1.15}
  .contact-link small{font-family:"JetBrains Mono",monospace;font-size:10.5px;color:var(--ink-4);letter-spacing:.16em;text-transform:uppercase;display:block;margin-top:8px;font-weight:400}

  /* ─── MAP ─── */
  .map-section{padding:0}
  #map{height:520px;background:var(--bg-3);border-top:1px solid var(--ink)}
  .mono-map-directions{display:none;justify-content:center;align-items:center;padding:28px 40px;border-top:1px solid var(--ink);background:var(--bg)}
  .mono-map-directions.is-visible{display:flex}
  .map-dir-btn{display:inline-flex;align-items:center;gap:12px;padding:16px 36px;background:var(--ink);color:var(--bg);font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;border:1px solid var(--ink);transition:background .3s,color .3s,padding .45s cubic-bezier(.7,0,.3,1)}
  .map-dir-btn::after{content:"→";font-size:13px;transition:transform .45s cubic-bezier(.7,0,.3,1)}
  .map-dir-btn:hover{background:transparent;color:var(--ink);padding-left:48px;padding-right:48px}
  .map-dir-btn:hover::after{transform:translateX(6px)}

  /* ─── REVIEWS ─── */
  .reviews-cta{padding:140px 0;text-align:center;background:var(--bg)}
  .reviews-cta-inner{max-width:780px;margin:0 auto;padding:0 40px}
  .gscore{font-family:"Playfair Display",serif;font-size:clamp(120px,18vw,240px);font-weight:500;line-height:.85;letter-spacing:-.03em;color:var(--ink);margin:24px 0 8px}
  .gscore em{font-style:italic;color:var(--accent)}
  .gscore small{font-size:.22em;color:var(--ink-3);font-weight:400;margin-left:8px;letter-spacing:-.01em}
  .gstars{font-size:24px;color:var(--accent);letter-spacing:6px;margin-bottom:18px}
  .greviews{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink-3);letter-spacing:.18em;text-transform:uppercase}
  .gquote{font-family:"Playfair Display",serif;font-size:28px;font-style:italic;color:var(--ink);line-height:1.4;max-width:600px;margin:24px auto;font-weight:500;letter-spacing:-.005em}
  .gquote::before,.gquote::after{content:"" "";color:var(--accent);font-style:normal;font-weight:500;margin:0 4px}
  .gbtn{display:inline-flex;align-items:center;gap:14px;padding:18px 36px;background:var(--ink);color:var(--bg);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;border:1px solid var(--ink);transition:background .3s,color .3s,padding .4s}
  .gbtn:hover{background:transparent;color:var(--ink);padding-left:48px;padding-right:48px}

  /* ─── VCARD ─── */
  .vcard{padding:64px 0;background:var(--paper);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
  .vcard-inner{max-width:1320px;margin:0 auto;padding:0 40px;display:flex;justify-content:space-between;align-items:center;gap:40px;flex-wrap:wrap}
  .vcard h3{font-family:"Playfair Display",serif;font-size:clamp(28px,3.5vw,44px);font-weight:500;letter-spacing:-.015em;line-height:1.1;max-width:560px}
  .vcard h3 em{font-style:italic;color:var(--accent)}
  .vcard-btn{display:inline-flex;align-items:center;gap:14px;padding:16px 28px;background:transparent;color:var(--ink);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;border:1px solid var(--ink);transition:background .3s,color .3s,padding .4s}
  .vcard-btn:hover{background:var(--ink);color:var(--bg);padding-left:38px;padding-right:38px}

  /* ─── CTA FINAL · bloque tipográfico puro ─── */
  .cta-final{padding:200px 0;text-align:center;background:var(--bg);position:relative}
  .cta-final::before,.cta-final::after{content:"";position:absolute;left:0;right:0;height:1px;background:var(--ink)}
  .cta-final::before{top:0}
  .cta-final::after{bottom:0}
  .cta-final h2{font-family:"Playfair Display",serif;font-size:clamp(72px,14vw,240px);font-weight:500;line-height:.88;letter-spacing:-.03em;margin-bottom:48px}
  .cta-final h2 em{font-style:italic;color:var(--accent)}
  .cta-final .actions{display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
  .cta-final .actions a{display:inline-flex;flex-direction:column;align-items:center;gap:8px;font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink);letter-spacing:.24em;text-transform:uppercase;padding:18px 32px;border:1px solid var(--ink);transition:background .3s,color .3s}
  .cta-final .actions a:hover{background:var(--ink);color:var(--bg)}
  .cta-final .actions a strong{font-family:"Playfair Display",serif;font-size:28px;font-weight:500;letter-spacing:-.005em;font-style:italic;text-transform:none;color:inherit;margin-bottom:4px}

  /* ─── FOOTER ─── */
  footer{background:var(--bg);padding:96px 0 32px}
  .foot{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:64px;padding-bottom:64px;border-bottom:1px solid var(--ink);max-width:1320px;margin:0 auto;padding-left:40px;padding-right:40px}
  .foot-brand strong{font-family:"Playfair Display",serif;font-size:36px;font-weight:500;letter-spacing:-.005em;color:var(--ink);display:block;margin-bottom:6px}
  .foot-brand small{font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.28em}
  .foot-brand p{margin-top:24px;font-size:14px;color:var(--ink-2);max-width:320px;line-height:1.7}
  .foot h4{font-family:"JetBrains Mono",monospace;font-size:11px;color:var(--ink);letter-spacing:.18em;text-transform:uppercase;margin-bottom:20px;font-weight:500}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:12px}
  .foot ul a{font-size:14px;color:var(--ink-2);transition:color .25s}
  .foot ul a:hover{color:var(--accent)}
  .foot-bot{max-width:1320px;margin:0 auto;padding:24px 40px 0;display:flex;justify-content:space-between;align-items:center;font-family:"JetBrains Mono",monospace;font-size:10.5px;color:var(--ink-3);letter-spacing:.16em;text-transform:uppercase;flex-wrap:wrap;gap:10px}
  .foot-bot a{color:var(--accent)}

  /* reveal */
  .slide-up{opacity:0;transform:translateY(40px);transition:opacity 1.05s cubic-bezier(.7,0,.3,1),transform 1.05s cubic-bezier(.7,0,.3,1)}
  .slide-up.in{opacity:1;transform:none}
  .slide-up[data-d="1"]{transition-delay:.12s}
  .slide-up[data-d="2"]{transition-delay:.24s}

  /* responsive */
  @media (max-width:1080px){
    .hero-bottom{grid-template-columns:1fr;gap:32px}
    .section-head{grid-template-columns:1fr;gap:18px}
    .about-grid{grid-template-columns:1fr;gap:48px}
    .about-side{position:static}
    .about-photo{max-width:380px}
    .about-cols{column-count:1}
    .hours-grid{grid-template-columns:1fr;gap:64px}
    .gallery-grid{grid-template-columns:repeat(6,1fr)}
    .gimg:nth-child(1){grid-column:span 6}
    .gimg:nth-child(2){grid-column:span 6;aspect-ratio:6/4}
    .gimg:nth-child(3),.gimg:nth-child(4),.gimg:nth-child(5){grid-column:span 2;aspect-ratio:2/3}
    .gimg:nth-child(6),.gimg:nth-child(7){grid-column:span 6}
    .foot{grid-template-columns:1fr 1fr;gap:40px}
  }
  @media (max-width:680px){
    .container,.container-tight{padding:0 22px}
    .nav-inner{padding:14px 22px;grid-template-columns:1fr auto auto}
    .nav-left,.nav-right li:not(:last-child){display:none}
    .nav-cta{display:none}
    .burger{display:flex}
    .brand{font-size:18px;grid-column:1}
    .brand small{display:none}
    .hero{padding:120px 0 60px}
    .hero h1{font-size:64px}
    .hero-stair{height:520px;margin:40px 0}
    .hero-issue{display:none}
    section,.about,.hours-section,.reviews-cta,.cta-final{padding:80px 0}
    .section-num{margin-bottom:32px}
    .section-head{margin-bottom:48px}
    .acc-head{grid-template-columns:50px 1fr auto;gap:14px;padding:24px 0}
    .acc-price{font-size:18px}
    .acc-toggle{grid-column:1/4;width:auto;margin-top:8px;padding:6px;display:none}
    .acc-body-inner{grid-template-columns:1fr;padding-bottom:24px}
    .gallery-grid{grid-template-columns:repeat(2,1fr);gap:10px}
    .gimg:nth-child(n){grid-column:span 1;aspect-ratio:3/4}
    .gimg:nth-child(1){grid-column:span 2;aspect-ratio:4/3}
    .schedule-row{grid-template-columns:1fr auto;gap:14px}
    .hours-grid{padding:0 22px}
    .contact-link{grid-template-columns:44px 1fr;gap:14px}
    .cta-final{padding:120px 0}
    .cta-final .actions{flex-direction:column;gap:14px}
    .vcard-inner{flex-direction:column;text-align:center;align-items:center}
    .foot{grid-template-columns:1fr;gap:40px;padding-left:22px;padding-right:22px}
    .foot-bot{flex-direction:column;text-align:center;padding:24px 22px 0}
  }
  @media (prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
    .slide-up{opacity:1;transform:none}
    .hero h1 .line > span{transform:none}
    .sphoto{filter:none}
    .gimg-bg{filter:none}
    .about-photo{filter:none}
  }
</style>
@endverbatim

@endpush

@section('content')

<!-- 1. NAV -->
<nav class="nav" id="nav">
  <div class="nav-inner">
    <ul class="nav-left">
      <li id="navServiciosLi" style="display:none;"><a href="#servicios" class="lnk">Servicios</a></li>
      <li><a href="#sobre-nosotros" class="lnk">Nosotros</a></li>
      <li><a href="#galeria" class="lnk">Galería</a></li>
    </ul>
    <a href="#" class="brand" id="navBrandWrap">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <span id="navBrandName">{{ $nombre }}</span><small id="navBrandCat">{{ $tagline }}</small>
    </a>
    <ul class="nav-right">
      <li><a href="#horario" class="lnk">Horario</a></li>
      <li id="navOpinionesLi" style="display:none;"><a href="#opiniones" class="lnk">Opiniones</a></li>
      <li><a href="#contacto" class="lnk">Contacto</a></li>
      <li><a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" class="nav-cta">Reservar</a></li>
    </ul>
    <button class="burger" id="burger" aria-label="Menú"><span></span><span></span><span></span></button>
  </div>
</nav>

<aside class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <button type="button" class="mobile-menu-close" id="mobileMenuClose" aria-label="Cerrar menú">×</button>
  <ul>
    <li id="navServiciosMobileLi" style="display:none;"><a href="#servicios">Servicios</a></li>
    <li><a href="#sobre-nosotros">Sobre <em>nosotros</em></a></li>
    <li><a href="#galeria">Galería</a></li>
    <li><a href="#horario">Horario</a></li>
    <li id="navOpinionesMobileLi" style="display:none;"><a href="#opiniones">Opiniones</a></li>
    <li><a href="#contacto"><em>Contacto</em></a></li>
  </ul>
  <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" class="mobile-cta">Reservar</a>
</aside>

<!-- 2. HERO -->
<header class="hero" id="hero">
  <div class="container">
    <div class="hero-top">
      <span class="eyebrow" id="heroEyebrow">Núm. 01 / {{ $anio_fundacion }} — {{ $ciudad }}</span>
      <span class="pill-status" id="pill-status"><span class="dot"></span><span id="pill-text">Abierto ahora</span></span>
    </div>
    <h1>
      <span class="line"><span>El</span></span>
      <span class="line"><span><em>oficio</em></span></span>
      <span class="line"><span>como portada.</span></span>
    </h1>

    <div class="hero-stair">
      <div class="hero-issue" id="heroIssue"><strong id="heroIssueNum">№ 01</strong> edición especial<br/><span id="heroIssueVol">volumen I</span></div>
      <div class="sphoto s1" id="heroPhoto1"><span class="sphoto-num">01</span><span class="sphoto-cap">Foto · 01</span></div>
      <div class="sphoto s2" id="heroPhoto2"><span class="sphoto-num">02</span><span class="sphoto-cap">Foto · 02</span></div>
      <div class="sphoto s3" id="heroPhoto3"><span class="sphoto-num">03</span><span class="sphoto-cap">Foto · 03</span></div>
    </div>

    <div class="hero-bottom">
      <p class="hero-lede" id="heroLede">"<strong id="heroLedeName">{{ $nombre }}</strong> es <span id="heroLedeTag">{{ $tagline }}</span>."</p>
      <div class="hero-credits">
        <div><span>Establecido</span><span id="heroCreditYear">{{ $anio_fundacion }}</span></div>
        <div><span>Localización</span><span id="heroCreditCity">{{ $ciudad }}</span></div>
        <div><span>País</span><span id="heroCreditCountry">{{ $pais }}</span></div>
        <div><span>Reservas</span><span data-phone-display id="heroCreditPhone">{{ $telefono }}</span></div>
      </div>
      <div class="hero-cta">
        <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" class="btn-edito solid">Reservar visita<span></span></a>
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link class="btn-edito">Llamar<span></span></a>
      </div>
    </div>
  </div>
</header>

<!-- 3. TICKER -->
<div class="ticker" id="tplTicker">
  <div class="ticker-track" id="tplTickerTrack">
    <span>Edición {{ $vol ?? '' }}</span>
    <span>Hecho a mano</span>
    <span>Atención personal</span>
    <span>Sin atajos</span>
    <span>Cita previa recomendada</span>
    <span>Edición {{ $vol ?? '' }}</span>
    <span>Hecho a mano</span>
    <span>Atención personal</span>
    <span>Sin atajos</span>
    <span>Cita previa recomendada</span>
  </div>
</div>

<!-- 4. SERVICIOS · acordeón -->
<section id="servicios" class="is-hidden" data-section="servicios">
  <div class="container-tight">
    <div class="section-num slide-up"><span>§ 01 — Servicios</span></div>
    <div class="section-head slide-up">
      <div>
        <span class="eyebrow">Lo que hacemos</span>
        <h2 class="serif">Lo que<br/><em>ofrecemos</em>.</h2>
      </div>
      <p class="desc">Una selección curada de servicios. Pulsa cada uno para conocer el detalle, los plazos y el precio aproximado.</p>
    </div>
    <div class="acc-list" id="monoServicesList" data-services-list>
      <article class="acc-item" data-svc>
        <div class="acc-head">
          <span class="acc-num">/ 01</span>
          <span class="acc-name">{{ ($services[0]['name'] ?? '') }}</span>
          <span class="acc-price">
            @if(isset($services[0]) && $services[0]['price'] !== null)
            {{ number_format($services[0]['price'], 2, ",", ".") }} €
            @else
            Consultar
            @endif
          </span>
          <span class="acc-toggle">+</span>
        </div>
        <div class="acc-body"><div class="acc-body-inner"><span></span><div>{{ ($services[0]['description'] ?? '') }} <em>Una propuesta cuidada de principio a fin.</em></div></div></div>
      </article>
      <article class="acc-item" data-svc>
        <div class="acc-head">
          <span class="acc-num">/ 02</span>
          <span class="acc-name">{{ ($services[1]['name'] ?? '') }}</span>
          <span class="acc-price">
            @if(isset($services[1]) && $services[1]['price'] !== null)
            {{ number_format($services[1]['price'], 2, ",", ".") }} €
            @else
            Consultar
            @endif
          </span>
          <span class="acc-toggle">+</span>
        </div>
        <div class="acc-body"><div class="acc-body-inner"><span></span><div>{{ ($services[1]['description'] ?? '') }} Trabajamos con atención al detalle y plazos transparentes.</div></div></div>
      </article>
      <article class="acc-item" data-svc>
        <div class="acc-head">
          <span class="acc-num">/ 03</span>
          <span class="acc-name">{{ ($services[2]['name'] ?? '') }}</span>
          <span class="acc-price">
            @if(isset($services[2]) && $services[2]['price'] !== null)
            {{ number_format($services[2]['price'], 2, ",", ".") }} €
            @else
            Consultar
            @endif
          </span>
          <span class="acc-toggle">+</span>
        </div>
        <div class="acc-body"><div class="acc-body-inner"><span></span><div>{{ ($services[2]['description'] ?? '') }} <em>Servicio principal de la casa.</em></div></div></div>
      </article>
    </div>
  </div>
</section>

<!-- 5. ABOUT -->
<section id="sobre-nosotros" class="about">
  <div class="container">
    <div class="section-num slide-up"><span>§ 02 — Editorial</span><strong>Sobre nosotros</strong></div>
  </div>
  <div class="about-grid">
    <div class="slide-up">
      <span class="eyebrow">Editorial</span>
      <h2 class="serif" id="aboutTitle">{{ $nombre }},<br/>desde <em id="aboutYear">{{ $anio_fundacion }}</em>.</h2>
      <p class="about-lede" id="aboutLede">"{{ $tagline }}"</p>
      <div class="about-cols" id="aboutDesc"></div>
    </div>
    <div class="about-side slide-up" data-d="1">
      <div class="about-photo" id="aboutPhoto"></div>
    </div>
  </div>
</section>

<!-- 6. GALERÍA -->
<section id="galeria">
  <div class="container">
    <div class="section-num slide-up"><span>§ 03 — Galería</span><strong>Imágenes seleccionadas</strong></div>
    <div class="section-head slide-up">
      <div>
        <span class="eyebrow">Galería visual</span>
        <h2 class="serif">El sitio<br/>en <em>imágenes.</em></h2>
      </div>
      <p class="desc">Una selección visual. Pasa el cursor sobre cada imagen para verla a todo color — el blanco y negro es solo invitación.</p>
    </div>
  </div>
  <div class="gallery-grid" id="galleryGrid">
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1650044252595-cacd425982ff?auto=format&fit=crop&w=700&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?auto=format&fit=crop&w=700&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?auto=format&fit=crop&w=700&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1672015521020-ab4f86d5cc00?auto=format&fit=crop&w=700&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1671493228689-754b0f200c84?auto=format&fit=crop&w=700&q=75')"></div></div>
    <div class="gimg"><div class="gimg-bg" style="background-image:url('https://images.unsplash.com/photo-1559185590-765cdc663325?auto=format&fit=crop&w=700&q=75')"></div></div>
  </div>
</section>

<!-- 7. HORARIO + 8. CONTACTO -->
<section id="horario" class="hours-section">
  <div class="container">
    <div class="section-num slide-up"><span>§ 04 — Horario &amp; Contacto</span><strong>Cuándo y cómo</strong></div>
    <div class="section-head slide-up">
      <div>
        <span class="eyebrow" style="color:var(--accent)"><span style="background:var(--accent);width:32px;height:1px;display:inline-block"></span>Visítanos</span>
        <h2 class="serif">Horario<br/><em>y contacto.</em></h2>
      </div>
      <p class="desc">Cita previa recomendada. Para urgencias, escríbenos por WhatsApp y te respondemos en menos de una hora durante el horario laboral.</p>
    </div>
  </div>
  <div class="hours-grid">
    <div class="hours-card slide-up">
      <span class="eyebrow">Horario semanal</span>
      <h3 class="serif">Estamos <em>aquí</em></h3>
      @php
  $scheduleDays = [
    ['mon', 'Lunes', 1],
    ['tue', 'Martes', 2],
    ['wed', 'Miércoles', 3],
    ['thu', 'Jueves', 4],
    ['fri', 'Viernes', 5],
    ['sat', 'Sábado', 6],
    ['sun', 'Domingo', 0],
  ];
  $todayIdx = (int) now()->dayOfWeek;
@endphp
      <div id="schedule">
@foreach($scheduleDays as [$key, $dayName, $idx])
@php
  $row = is_array($horario) ? ($horario[$key] ?? null) : null;
  $closed = !$row || !empty($row['closed']);
  $open = !$closed && !empty($row['open']);
  $isToday = $idx === $todayIdx;
@endphp
        <div class="schedule-row{{ $isToday ? ' today' : '' }}" data-day="{{ $idx }}"><span class="day">{{ $dayName }}</span><span class="time{{ !$open ? ' closed' : '' }}">@if($open)
{{ $row["open"] }} — {{ $row["close"] }}
@else
Cerrado
@endif</span></div>
@endforeach
      </div>
    </div>
    <aside id="contacto" class="hours-card slide-up" data-d="1">
      <span class="eyebrow">Contacto directo</span>
      <h3 class="serif">Cómo <em>encontrarnos</em></h3>
      <div class="contact-list">
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link class="contact-link"><span class="ico">☏</span><div><strong data-phone-display>{{ $telefono }}</strong><small>Teléfono</small></div></a>
        <a href="mailto:" id="contactEmailLink" class="contact-link"><span class="ico">@</span><div><strong>{{ $correo }}</strong><small>Correo</small></div></a>
        <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" target="_blank" class="contact-link"><span class="ico">✉</span><div><strong>WhatsApp</strong><small>Respuesta rápida</small></div></a>
        <a href="#" id="contactAddressLink" target="_blank" class="contact-link"><span class="ico">◆</span><div><strong>{{ $direccion }}</strong><small>{{ $ciudad }}</small></div></a>
      </div>
    </aside>
  </div>
</section>

<!-- 9. MAPA -->
<section class="map-section">
  <div id="map" data-lat="{{ $map_lat }}" data-lng="{{ $map_lon }}" data-name="{{ $nombre }}" data-addr="{{ $direccion }}"></div>
  <div class="mono-map-directions" id="monoMapDirectionsRow">
    <a href="#" id="monoMapsDirectionsBtn" class="map-dir-btn" target="_blank" rel="noopener noreferrer">Cómo llegar en Google Maps</a>
  </div>
</section>

<!-- 10. OPINIONES -->
<section id="opiniones" class="reviews-cta is-hidden" data-section="opiniones">
  <div class="reviews-cta-inner">
    <span class="eyebrow">Reseñas</span>
    <div class="gscore serif">{{ $nota_google ?? '' }}<em>/5</em></div>
    <div class="gstars">★★★★★</div>
    <div class="greviews">{{ $n_reseñas ?? '' }} reseñas en Google</div>
    <p class="gquote">Un sitio donde el oficio se nota desde el primer minuto.</p>
    <a href="#" id="gbizBtn" target="_blank" class="gbtn">Ver opiniones</a>
  </div>
</section>

<!-- 11. VCARD -->
<section class="vcard is-hidden" data-section="vcard">
  <div class="vcard-inner">
    <h3 class="serif">Guarda nuestro <em>contacto</em>.</h3>
    <a href="#" id="vcardBtn" class="vcard-btn" download="{{ $nombre }}.vcf">↓ Tarjeta de contacto</a>
  </div>
</section>

<!-- 12. CTA FINAL -->
<section class="cta-final">
  <div class="container">
    <h2 class="serif slide-up">Ven, <em>conversemos.</em></h2>
    <div class="actions slide-up" data-d="1">
      <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><strong>Llámanos</strong> <span data-phone-display>{{ $telefono }}</span></a>
      <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" target="_blank"><strong>WhatsApp</strong>Mensaje directo</a>
      <a href="mailto:" id="ctaEmailLink"><strong id="ctaEmailDisplay">{{ $correo }}</strong></a>
    </div>
  </div>
</section>

<!-- 13. FOOTER -->
<footer>
  <div class="foot">
    <div class="foot-brand">
      <strong>{{ $nombre }}</strong>
      <small>{{ $categoria ?? '' }} — {{ $ciudad }}</small>
      <p>{{ $descripcion }} En {{ $ciudad }} desde {{ $anio_fundacion }}.</p>
    </div>
    <div>
      <h4>Sumario</h4>
      <ul>
        <li id="footNavServicios" style="display:none;"><a href="#servicios">Servicios</a></li>
        <li><a href="#sobre-nosotros">Editorial</a></li>
        <li><a href="#galeria">Galería</a></li>
        <li id="footNavOpiniones" style="display:none;"><a href="#opiniones">Reseñas</a></li>
      </ul>
    </div>
    <div>
      <h4>Contacto</h4>
      <ul>
        <li><a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link data-phone-display>{{ $telefono }}</a></li>
        <li><a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
        <li id="footEmailRow" hidden><a id="footEmailLink" href="mailto:"><span id="footEmailDisplay">{{ $correo }}</span></a></li>
        <li><a href="#contacto" id="footAddress"></a></li>
      </ul>
    </div>
    <div>
      <h4>Legal</h4>
      <ul>
        <li><a href="#">Aviso legal</a></li>
        <li><a href="#">Privacidad</a></li>
        <li><a href="#">Cookies</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bot">
    <span>© {{ date('Y') }} {{ $nombre }} — Edición {{ $vol ?? '' }}</span>
    <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Hecho con <a href="https://localweb.es" target="_blank" rel="noopener noreferrer">LocalWeb</a></span>
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
(function initMonoPreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('mono-preview');
  }
})();

var MONO_SCHEDULE_DEFAULT = [
  { name: 'Lun', full: 'Lunes', idx: 1, open: '10:00', close: '20:00' },
  { name: 'Mar', full: 'Martes', idx: 2, open: '10:00', close: '20:00' },
  { name: 'Mié', full: 'Miércoles', idx: 3, open: '10:00', close: '20:00' },
  { name: 'Jue', full: 'Jueves', idx: 4, open: '10:00', close: '20:00' },
  { name: 'Vie', full: 'Viernes', idx: 5, open: '10:00', close: '20:00' },
  { name: 'Sáb', full: 'Sábado', idx: 6, open: '10:00', close: '18:00' },
  { name: 'Dom', full: 'Domingo', idx: 0, open: null, close: null },
];
var SCHEDULE = MONO_SCHEDULE_DEFAULT.map(function (d) {
  return { name: d.name, full: d.full, idx: d.idx, open: d.open, close: d.close };
});

var monoPreviewMap = null;
var monoPreviewMarker = null;
var MONO_MAP_ZOOM = 18;

function monoHasStr(v) {
  return v != null && String(v).trim() !== '';
}

function escapeMonoHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeMonoAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatMonoPrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/** Spa / bienestar — solo en vista previa (?embed=1 o ?preview=1). */
var MONO_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  portada_2: 'https://images.unsplash.com/photo-1650044252595-cacd425982ff?auto=format&fit=crop&w=1000&q=80',
  portada_3: 'https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?auto=format&fit=crop&w=1000&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1559185590-765cdc663325?auto=format&fit=crop&w=1000&q=80',
};

function shouldUseMonoSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('mono-preview');
}

function monoResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseMonoSampleMedia()) return '';
  return MONO_PREVIEW_SAMPLE[sampleKey] || '';
}

var MONO_DEFAULT_GALLERY_INNER =
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1650044252595-cacd425982ff?auto=format&fit=crop&w=700&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1757689314932-bec6e9c39e51?auto=format&fit=crop&w=700&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1630595632518-8217c0bceb8f?auto=format&fit=crop&w=700&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1672015521020-ab4f86d5cc00?auto=format&fit=crop&w=700&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1671493228689-754b0f200c84?auto=format&fit=crop&w=700&q=75\')"></div></div>' +
  '<div class="gimg"><div class="gimg-bg" style="background-image:url(\'https://images.unsplash.com/photo-1559185590-765cdc663325?auto=format&fit=crop&w=700&q=75\')"></div></div>';
function buildMonoDirectionsUrl(raw) {
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

function syncMonoMapDirections(raw) {
  var mapsUrl = buildMonoDirectionsUrl(raw);
  var row = document.getElementById('monoMapDirectionsRow');
  var btn = document.getElementById('monoMapsDirectionsBtn');
  if (row && btn) {
    if (mapsUrl) {
      row.classList.add('is-visible');
      btn.href = mapsUrl;
    } else {
      row.classList.remove('is-visible');
      btn.removeAttribute('href');
    }
  }
}

function syncMonoScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = MONO_SCHEDULE_DEFAULT.map(function (d) {
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
    if (!row || row.closed) return { name: t[1], full: t[2], idx: t[3], open: null, close: null };
    return { name: t[1], full: t[2], idx: t[3], open: row.open || '10:00', close: row.close || '20:00' };
  });
}

function renderMonoSchedule() {
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
    row.setAttribute('data-day', String(d.idx));
    row.innerHTML =
      '<span class="day">' + escapeMonoHtml(isToday ? d.full + ' · hoy' : d.full) + '</span>' +
      (openDay
        ? '<span class="time">' + escapeMonoHtml(d.open + ' – ' + d.close) + '</span>'
        : '<span class="time closed">Cerrado</span>');
    wrap.appendChild(row);
  });

  var todayD = SCHEDULE.find(function (d) { return d.idx === today; });
  var openNow = false;
  if (todayD && todayD.open) {
    var parts = todayD.open.split(':');
    var closeParts = todayD.close.split(':');
    var h = now.getHours();
    var m = now.getMinutes();
    var cur = h * 60 + m;
    var o = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
    var c = parseInt(closeParts[0], 10) * 60 + parseInt(closeParts[1] || '0', 10);
    openNow = cur >= o && cur < c;
  }
  var pill = document.getElementById('pill-status');
  var txt = document.getElementById('pill-text');
  if (pill && txt) {
    pill.classList.toggle('closed', !openNow);
    txt.textContent = openNow ? 'Abierto ahora' : 'Cerrado · vuelve mañana';
  }
}

function monoSetHeroPhoto(el, src) {
  if (!el) return;
  var s = src ? String(src).trim() : '';
  if (s) {
    el.style.backgroundImage = 'url("' + escapeMonoAttr(s) + '")';
    el.classList.remove('fallback');
  } else {
    el.style.backgroundImage = '';
    el.classList.add('fallback');
  }
}

function updateMonoHeroPhotos(raw) {
  raw = raw || {};
  var hasP1 = Object.prototype.hasOwnProperty.call(raw, 'portada');
  var hasP2 = Object.prototype.hasOwnProperty.call(raw, 'portada_2');
  var hasP3 = Object.prototype.hasOwnProperty.call(raw, 'portada_3');
  if (!hasP1 && !hasP2 && !hasP3 && !shouldUseMonoSampleMedia()) return;
  monoSetHeroPhoto(document.getElementById('heroPhoto1'), monoResolvePreviewPhotoSrc(raw.portada, 'portada'));
  monoSetHeroPhoto(document.getElementById('heroPhoto2'), monoResolvePreviewPhotoSrc(raw.portada_2, 'portada_2'));
  monoSetHeroPhoto(document.getElementById('heroPhoto3'), monoResolvePreviewPhotoSrc(raw.portada_3, 'portada_3'));
}

function updateMonoAboutPhoto(raw) {
  var el = document.getElementById('aboutPhoto');
  if (!el) return;
  var hasFoto = raw && Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseMonoSampleMedia()) return;
  var src = monoResolvePreviewPhotoSrc(raw && raw.foto_equipo, 'foto_equipo');
  if (src) {
    el.style.backgroundImage = 'url("' + escapeMonoAttr(src) + '")';
  } else {
    el.style.backgroundImage = '';
  }
}

function renderMonoGallery(urls) {
  var root = document.getElementById('galleryGrid');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = MONO_DEFAULT_GALLERY_INNER;
    return;
  }
  root.innerHTML = list
    .slice(0, 7)
    .map(function (src) {
      var esc = escapeMonoAttr(src);
      return (
        '<div class="gimg" data-lightbox-src="' + esc + '">' +
        '<div class="gimg-bg" style="background-image:url(&quot;' + esc + '&quot;)"></div>' +
        '</div>'
      );
    })
    .join('');
}

function bindMonoAccordion() {
  document.querySelectorAll('.acc-item').forEach(function (it) {
    var head = it.querySelector('.acc-head');
    if (!head || head.dataset.monoBound) return;
    head.dataset.monoBound = '1';
    head.addEventListener('click', function () {
      var wasOpen = it.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(function (x) { x.classList.remove('open'); });
      if (!wasOpen) it.classList.add('open');
    });
  });
}

function renderMonoServices(services) {
  var list = document.getElementById('monoServicesList');
  var sec = document.getElementById('servicios');
  var navSvc = document.getElementById('navServiciosLi');
  var navSvcMob = document.getElementById('navServiciosMobileLi');
  var footSvc = document.getElementById('footNavServicios');
  if (!list || !sec) return;
  if (!services.length) {
    sec.classList.add('is-hidden');
    list.innerHTML = '';
    if (navSvc) navSvc.style.display = 'none';
    if (navSvcMob) navSvcMob.style.display = 'none';
    if (footSvc) footSvc.style.display = 'none';
    return;
  }
  sec.classList.remove('is-hidden');
  if (navSvc) navSvc.style.display = '';
  if (navSvcMob) navSvcMob.style.display = '';
  if (footSvc) footSvc.style.display = '';
  list.innerHTML = services
    .slice(0, 9)
    .map(function (s, i) {
      var num = String(i + 1).padStart(2, '0');
      var nm = escapeMonoHtml(String(s.name || ''));
      var pr = escapeMonoHtml(formatMonoPrice(s.price));
      var dc = s.description && String(s.description).trim();
      var desc = dc ? escapeMonoHtml(String(s.description)) : 'Detalle del servicio.';
      return (
        '<article class="acc-item" data-svc>' +
        '<div class="acc-head">' +
        '<span class="acc-num">/ ' + num + '</span>' +
        '<span class="acc-name">' + nm + '</span>' +
        '<span class="acc-price">' + pr + '</span>' +
        '<span class="acc-toggle">+</span>' +
        '</div>' +
        '<div class="acc-body"><div class="acc-body-inner"><span></span><div>' + desc + '</div></div></div>' +
        '</article>'
      );
    })
    .join('');
  bindMonoAccordion();
}

function updateMonoTicker(raw) {
  var track = document.getElementById('tplTickerTrack');
  if (!track) return;
  var brand = (raw && raw.nombre ? String(raw.nombre).trim() : '') || 'Tu negocio';
  var tagline = (raw && raw.tagline ? String(raw.tagline).trim() : '') || '';
  var city = (raw && raw.ciudad ? String(raw.ciudad).trim() : '') || '';
  var parts = [brand, tagline, city, 'Hecho a mano', 'Atención personal', 'Cita previa'].filter(Boolean);
  var inner = parts
    .concat(parts)
    .map(function (p) {
      return '<span>' + escapeMonoHtml(p) + '</span>';
    })
    .join('');
  track.innerHTML = inner;
}

function destroyMonoPreviewMap() {
  if (monoPreviewMap) {
    try { monoPreviewMap.remove(); } catch (e) {}
    monoPreviewMap = null;
    monoPreviewMarker = null;
  }
}

function updateMonoPreviewMap(lat, lon, label) {
  var el = document.getElementById('map');
  if (!el || window.__LW_SKIP_LEAFLET) return;
  if (typeof L === 'undefined') {
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(function () { updateMonoPreviewMap(lat, lon, label); });
    }
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    destroyMonoPreviewMap();
    return;
  }
  function applyMap() {
    if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
    if (!monoPreviewMap) {
      monoPreviewMap = L.map(el, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([lat, lon], MONO_MAP_ZOOM);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(monoPreviewMap);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(monoPreviewMap);
    } else {
      monoPreviewMap.setView([lat, lon], MONO_MAP_ZOOM);
    }
    if (monoPreviewMarker) monoPreviewMap.removeLayer(monoPreviewMarker);
    var icon = L.divIcon({
      html: '<div style="width:18px;height:18px;background:#0A0A0A;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(224,78,44,.3)"></div>',
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    monoPreviewMarker = L.marker([lat, lon], { icon: icon }).addTo(monoPreviewMap);
    if (label) monoPreviewMarker.bindPopup('<strong>' + escapeMonoHtml(label) + '</strong>');
    setTimeout(function () { if (monoPreviewMap) monoPreviewMap.invalidateSize(); }, 100);
  }
  requestAnimationFrame(function () { requestAnimationFrame(applyMap); });
}

function syncMonoFooter(raw) {
  raw = raw || {};
  var name = (raw.nombre || '').trim() || 'Tu negocio';
  var city = (raw.ciudad || '').trim();
  var country = (raw.pais || '').trim();
  var year = (raw.anio_fundacion || '').trim() || String(new Date().getFullYear());
  var tagline = (raw.tagline || '').trim();
  var desc = (raw.descripcion || '').trim();
  var direccion = (raw.direccion || '').trim();
  var loc = [city, country].filter(Boolean).join(', ');

  var fb = document.querySelector('.foot-brand strong');
  if (fb) fb.textContent = name;
  var fbs = document.querySelector('.foot-brand small');
  if (fbs) fbs.textContent = (tagline || 'Editorial') + (loc ? ' — ' + loc : '');
  var fbp = document.querySelector('.foot-brand p');
  if (fbp) {
    fbp.textContent = (desc ? desc + ' ' : '') + (loc ? 'En ' + loc + ' desde ' + year + '.' : '');
  }
  var footAddress = document.getElementById('footAddress');
  if (footAddress) {
    footAddress.href = '#contacto';
    footAddress.textContent = direccion || city || '';
  }
  document.querySelectorAll('.foot-bot span').forEach(function (span, i) {
    if (i === 0) span.textContent = '© ' + new Date().getFullYear() + ' ' + name;
  });
}

function syncMonoTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services)
    ? raw.services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  renderMonoServices(services);

  var gUrl = (raw.google_business_url || '').trim();
  var opSec = document.getElementById('opiniones');
  var gBtn = document.getElementById('gbizBtn');
  var navOp = document.getElementById('navOpinionesLi');
  var navOpMob = document.getElementById('navOpinionesMobileLi');
  var footOp = document.getElementById('footNavOpiniones');
  if (opSec) {
    if (gUrl) {
      opSec.classList.remove('is-hidden');
      if (gBtn) gBtn.href = gUrl;
      if (navOp) navOp.style.display = '';
      if (navOpMob) navOpMob.style.display = '';
      if (footOp) footOp.style.display = '';
    } else {
      opSec.classList.add('is-hidden');
      if (gBtn) gBtn.removeAttribute('href');
      if (navOp) navOp.style.display = 'none';
      if (navOpMob) navOpMob.style.display = 'none';
      if (footOp) footOp.style.display = 'none';
    }
  }

  var vcOn = raw.vcard_enabled === true || raw.vcard_enabled === 'true' || raw.vcard_enabled === 1;
  var vcUrl = (raw.vcard_download_url || '').trim();
  var vcSec = document.querySelector('.vcard[data-section="vcard"]');
  var vcA = document.getElementById('vcardBtn');
  if (vcSec) {
    if (vcOn && vcUrl) {
      vcSec.classList.remove('is-hidden');
      if (vcA) vcA.href = vcUrl;
    } else {
      vcSec.classList.add('is-hidden');
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
    var nav = document.getElementById('nav');
    var offset = nav ? Math.round(nav.getBoundingClientRect().height) + 12 : 12;
    var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
  }
  requestAnimationFrame(function () { requestAnimationFrame(doScroll); });
  setTimeout(doScroll, 120);
}

function applyLivePreviewData(raw, opts) {
  opts = opts || {};
  raw = raw || {};
  var name = (raw.nombre || '').trim() || 'Tu negocio';
  var tagline = (raw.tagline || '').trim() || 'Tagline de tu negocio';
  var phoneRaw = (raw.telefono || '').trim();
  var phoneWa = phoneRaw.replace(/\D/g, '');
  var descripcion = (raw.descripcion || '').trim();
  var direccion = (raw.direccion || '').trim();
  var correo = (raw.correo || '').trim();
  var ciudad = (raw.ciudad || '').trim();
  var pais = (raw.pais || '').trim();
  var year = (raw.anio_fundacion || '').trim() || String(new Date().getFullYear());

  document.title = name + ' — Editorial';

  var logoUrl = (raw.logo_url || '').trim();
  var nav = document.getElementById('nav');
  if (nav) {
    if (logoUrl) {
      var lsc = typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : 1;
      lsc = Math.min(1.5, Math.max(0.45, lsc));
      nav.style.setProperty('--lw-logo-scale', String(lsc));
    } else {
      nav.style.removeProperty('--lw-logo-scale');
    }
  }
  var navBrandWrap = document.getElementById('navBrandWrap');
  var navBrandLogo = document.getElementById('navBrandLogo');
  var navBrandName = document.getElementById('navBrandName');
  var navBrandCat = document.getElementById('navBrandCat');
  if (navBrandWrap && navBrandLogo && navBrandName) {
    if (logoUrl) {
      navBrandLogo.src = logoUrl;
      navBrandLogo.alt = name;
      navBrandLogo.hidden = false;
      navBrandName.style.display = 'none';
      if (navBrandCat) navBrandCat.style.display = 'none';
      navBrandWrap.classList.add('brand-has-img');
    } else {
      navBrandLogo.removeAttribute('src');
      navBrandLogo.hidden = true;
      navBrandName.style.display = '';
      navBrandName.textContent = name;
      if (navBrandCat) {
        navBrandCat.style.display = '';
        navBrandCat.textContent = tagline;
      }
      navBrandWrap.classList.remove('brand-has-img');
    }
  }

  var heroEyebrow = document.getElementById('heroEyebrow');
  if (heroEyebrow) heroEyebrow.textContent = 'Núm. 01 / ' + year + (ciudad ? ' — ' + ciudad : '');

  var heroLedeName = document.getElementById('heroLedeName');
  var heroLedeTag = document.getElementById('heroLedeTag');
  if (heroLedeName) heroLedeName.textContent = name;
  if (heroLedeTag) heroLedeTag.textContent = tagline;

  var heroCreditYear = document.getElementById('heroCreditYear');
  var heroCreditCity = document.getElementById('heroCreditCity');
  var heroCreditCountry = document.getElementById('heroCreditCountry');
  if (heroCreditYear) heroCreditYear.textContent = year;
  if (heroCreditCity) heroCreditCity.textContent = ciudad || '—';
  if (heroCreditCountry) heroCreditCountry.textContent = pais || '—';

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var aboutTitle = document.getElementById('aboutTitle');
  var aboutYear = document.getElementById('aboutYear');
  var aboutLede = document.getElementById('aboutLede');
  var aboutDesc = document.getElementById('aboutDesc');
  if (aboutTitle) aboutTitle.innerHTML = escapeMonoHtml(name) + ',<br/>desde <em>' + escapeMonoHtml(year) + '</em>.';
  if (aboutYear) aboutYear.textContent = year;
  if (aboutLede) aboutLede.textContent = '"' + tagline + '"';
  if (aboutDesc && descripcion) {
    var paras = descripcion.split(/\n\n+/).filter(Boolean);
    aboutDesc.innerHTML = paras.map(function (p) { return '<p>' + escapeMonoHtml(p) + '</p>'; }).join('');
  }

  var contactEmailLink = document.getElementById('contactEmailLink');
  var contactEmailStrong = contactEmailLink && contactEmailLink.querySelector('strong');
  if (contactEmailLink && contactEmailStrong) {
    if (correo) {
      contactEmailLink.href = 'mailto:' + correo;
      contactEmailStrong.textContent = correo;
    } else {
      contactEmailStrong.textContent = 'correo@ejemplo.com';
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
      footEmailRow.hidden = true;
    }
  }
  var ctaEmailLink = document.getElementById('ctaEmailLink');
  var ctaEmailDisplay = document.getElementById('ctaEmailDisplay');
  if (ctaEmailLink && ctaEmailDisplay) {
    if (correo) {
      ctaEmailLink.href = 'mailto:' + correo;
      ctaEmailDisplay.textContent = correo;
    }
  }
  var mapsLink = document.getElementById('contactAddressLink');
  if (mapsLink) {
    var mapsUrl = buildMonoDirectionsUrl(raw);
    if (mapsUrl) {
      mapsLink.href = mapsUrl;
      mapsLink.target = '_blank';
      mapsLink.rel = 'noopener noreferrer';
    }
    var addrStrong = mapsLink.querySelector('strong');
    var addrSmall = mapsLink.querySelector('small');
    if (addrStrong) addrStrong.textContent = direccion || ciudad || 'Dirección';
    if (addrSmall) addrSmall.textContent = ciudad || '';
  }
  syncMonoMapDirections(raw);

  updateMonoHeroPhotos(raw);
  updateMonoAboutPhoto(raw);
  var galeria = Array.isArray(raw.galeria) ? raw.galeria.filter(Boolean) : [];
  if (Object.prototype.hasOwnProperty.call(raw, 'galeria')) {
    renderMonoGallery(galeria);
  } else if (galeria.length) {
    renderMonoGallery(galeria);
  }
  updateMonoTicker(raw);
  syncMonoScheduleFromPreview(raw.horario);
  renderMonoSchedule();
  syncMonoFooter(raw);
  syncMonoTemplateExtensions(raw);

  var lat = parseFloat(raw.map_lat);
  var lon = parseFloat(raw.map_lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    updateMonoPreviewMap(lat, lon, name);
  } else {
    destroyMonoPreviewMap();
  }

  if (opts.alignToHash) scrollEmbedPreviewToHash();
}

(function initMonoPreviewSampleMedia() {
  if (!shouldUseMonoSampleMedia()) return;
  function boot() {
    updateMonoHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
    updateMonoAboutPhoto({ foto_equipo: '' });
    renderMonoGallery([]);
    syncMonoTemplateExtensions({});
    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('in');
    document.querySelectorAll('.slide-up').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, 60 + i * 140);
    });
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
    syncMonoScheduleFromPreview(null);
    renderMonoSchedule();
    syncMonoTemplateExtensions({});
    bindMonoAccordion();
    if (shouldUseMonoSampleMedia()) {
      updateMonoHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
      updateMonoAboutPhoto({ foto_equipo: '' });
      renderMonoGallery([]);
    }
    return;
  }
  applyLivePreviewData({
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
  }, { alignToHash: !!window.location.hash.replace(/^#/, '') });
})();

(function initMonoUi() {
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  var menuClose = document.getElementById('mobileMenuClose');
  if (burger && menu) {
    function toggleMenu(open) {
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      document.body.classList.toggle('mono-menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    burger.addEventListener('click', function () { toggleMenu(!menu.classList.contains('open')); });
    if (menuClose) menuClose.addEventListener('click', function () { toggleMenu(false); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) toggleMenu(false);
    });
  }

  var navEl = document.getElementById('nav');
  if (navEl) {
    window.addEventListener('scroll', function () {
      navEl.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  requestAnimationFrame(function () {
    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('in');
  });

  if (document.body.classList.contains('embed-preview')) {
    document.querySelectorAll('.slide-up').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('in'); }, 60 + i * 140);
    });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.slide-up').forEach(function (el) { io.observe(el); });
  }

  bindMonoAccordion();

})();
</script>
<div id="lw-gallery-lightbox" class="lw-gallery-lightbox" hidden aria-modal="true" role="dialog" aria-label="Imagen ampliada">
  <button type="button" class="lw-gallery-lightbox-backdrop" tabindex="-1" aria-label="Cerrar"></button>
  <figure class="lw-gallery-lightbox-frame">
    <button type="button" class="lw-gallery-lightbox-close" aria-label="Cerrar">×</button>
    <img class="lw-gallery-lightbox-img" src="" alt="" decoding="async"/>
  </figure>
</div>
<script>
(function initLwGalleryLightbox() {
  var lb = document.getElementById('lw-gallery-lightbox');
  if (!lb) return;
  var backdrop = lb.querySelector('.lw-gallery-lightbox-backdrop');
  var closeBtn = lb.querySelector('.lw-gallery-lightbox-close');
  var imgEl = lb.querySelector('.lw-gallery-lightbox-img');
  var prevOverflow = '';
  function bgUrlFromGimg(gimg) {
    if (!gimg) return '';
    var ds = gimg.getAttribute('data-lightbox-src');
    if (ds) return ds;
    var bg = gimg.querySelector('.gimg-bg');
    if (!bg) return '';
    var inline = bg.getAttribute('style') || '';
    var m = inline.match(/url\(["']?([^"')]+)/);
    if (m) return m[1];
    return '';
  }
  function openLb(src) {
    if (!src) return;
    imgEl.src = src;
    lb.hidden = false;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.hidden = true;
    imgEl.removeAttribute('src');
    document.body.style.overflow = prevOverflow || '';
  }
  document.addEventListener('click', function (e) {
    var sec = document.getElementById('galeria');
    if (!sec || !sec.contains(e.target)) return;
    if (e.target.closest('#lw-gallery-lightbox')) return;
    var gimg = e.target.closest('.gimg');
    if (gimg && sec.contains(gimg)) {
      var u = bgUrlFromGimg(gimg);
      if (u) { e.preventDefault(); openLb(u); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) closeLb();
  });
  if (backdrop) backdrop.addEventListener('click', closeLb);
  if (closeBtn) closeBtn.addEventListener('click', closeLb);
})();
</script>
<!--
LW-CONTRACT-VERSION: 1
Public: applyLivePreviewData, initLivePreviewFromQuery, initSecureMessageListener
-->


@endverbatim

<script>
(function bootMonoEditoTenantPage() {
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
