@extends('public.layouts.tenant')

@push('head-extras')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
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
    --bg:#FBF9F4;
    --bg-2:#F2EDE3;
    --paper:#FFFFFF;
    --ink:#15110C;
    --ink-2:#3A332A;
    --ink-3:#7E776C;
    --ink-4:#B8B0A0;
    --line:#E5DFD0;
    --line-2:#CFC6B1;
    --champagne:#B68A50;
    --champagne-2:color-mix(in srgb, var(--champagne) 80%, #000000);
    --champagne-soft:color-mix(in srgb, var(--champagne) 22%, #ffffff);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:"Inter",system-ui,sans-serif;font-weight:300;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;font-feature-settings:"kern","liga","tnum"}
  ::selection{background:var(--ink);color:var(--bg)}
  a{color:inherit;text-decoration:none}
  img{display:block;max-width:100%}
  .serif{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;letter-spacing:-.005em;line-height:1.04}
  .italic{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-weight:400;color:var(--champagne)}
  .container{max-width:1280px;margin:0 auto;padding:0 54px}
  .container-narrow{max-width:1080px;margin:0 auto;padding:0 54px}
  .eyebrow{display:inline-flex;align-items:center;gap:14px;font-size:11px;font-weight:400;color:var(--ink-3);letter-spacing:.32em;text-transform:uppercase}
  .eyebrow::before{content:"";width:50px;height:1px;background:var(--champagne)}

  /* ─── NAV ─── */
  .nav{position:fixed;top:0;left:0;right:0;z-index:60;padding:0 54px;transition:padding .3s,background .3s,backdrop-filter .3s}
  .nav.scrolled{padding-top:12px;background:rgba(251,249,244,.75);backdrop-filter:saturate(140%) blur(14px);-webkit-backdrop-filter:saturate(140%) blur(14px);border-bottom:1px solid var(--line)}
  .nav-inner{max-width:1280px;margin:0 auto;padding:28px 0;display:flex;justify-content:space-between;align-items:center;gap:24px;transition:padding .3s}
  .nav.scrolled .nav-inner{padding:14px 0}
  .brand{display:flex;flex-direction:column;line-height:.9;text-align:center}
  .brand strong{font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:400;letter-spacing:.02em;color:var(--ink)}
  .brand small{font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4em;margin-top:6px;font-weight:400}
  .nav ul{list-style:none;display:flex;gap:50px;align-items:center}
  .nav ul a{font-size:12px;color:var(--ink-2);font-weight:400;padding:8px 0;letter-spacing:.18em;text-transform:uppercase;position:relative}
  .nav ul a::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--ink);transform-origin:right;transform:scaleX(0);transition:transform .6s cubic-bezier(.7,0,.3,1)}
  .nav ul a:hover::before{transform-origin:left;transform:scaleX(1)}
  .nav-cta{display:inline-flex;align-items:center;gap:10px;font-size:12px;color:var(--ink);letter-spacing:.18em;text-transform:uppercase;padding:14px 24px;border:1px solid var(--ink);transition:background .3s,color .3s}
  .nav-cta:hover{background:var(--ink);color:var(--bg)}
  .nav-cta .wa{width:14px;height:14px;background:currentColor;mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2z'/></svg>") center/contain no-repeat;-webkit-mask:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.3-.4c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2 0 1.2.8 2.4 1 2.5.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.2z'/></svg>") center/contain no-repeat}
  .burger{display:none;width:52px;height:52px;background:transparent;border:none;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:0}
  .burger span{display:block;width:22px;height:1px;background:var(--ink);transition:.3s}
  .burger.open span:nth-child(1){transform:translateY(6px) rotate(45deg)}
  .burger.open span:nth-child(2){opacity:0}
  .burger.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}

  .mobile-menu{display:flex;flex-direction:column;position:fixed;top:0;right:0;bottom:0;left:0;background:var(--bg);z-index:200;padding:120px 54px 54px;transform:translateY(-100%);transition:transform .55s cubic-bezier(.7,0,.3,1);overflow-y:auto}
  .mobile-menu.open{transform:translateY(0)}
  .mobile-menu ul{list-style:none;display:flex;flex-direction:column;gap:0}
  .mobile-menu ul li{border-bottom:1px solid var(--line);overflow:hidden}
  .mobile-menu ul a{display:block;padding:24px 0;font-family:"Cormorant Garamond",serif;font-size:50px;color:var(--ink);font-weight:400;letter-spacing:-.005em;transform:translateY(120%);transition:transform .6s cubic-bezier(.7,0,.3,1)}
  .mobile-menu.open ul a{transform:translateY(0)}
  .mobile-menu ul li:nth-child(2) a{transition-delay:.05s}
  .mobile-menu ul li:nth-child(3) a{transition-delay:.1s}
  .mobile-menu ul li:nth-child(4) a{transition-delay:.15s}
  .mobile-menu ul li:nth-child(5) a{transition-delay:.2s}
  .mobile-menu ul li:nth-child(6) a{transition-delay:.25s}
  .mobile-menu ul a em{font-style:italic;color:var(--champagne)}
  .mobile-cta{display:block;margin-top:54px;padding:18px;text-align:center;background:var(--ink);color:var(--bg);font-size:12px;font-weight:400;letter-spacing:.24em;text-transform:uppercase}

  /* ─── HERO · tríptico horizontal con offset elegante ─── */
  .hero{padding:230px 0 100px;position:relative}
  .hero-meta{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:48px;gap:24px;flex-wrap:wrap}
  .hero-meta .eyebrow{margin:0}
  .pill-status{display:inline-flex;align-items:center;gap:10px;font-size:11px;color:var(--ink-3);letter-spacing:.24em;text-transform:uppercase}
  .pill-status .dot{width:6px;height:6px;border-radius:50%;background:#5BAB6E;animation:gentle 3s ease-in-out infinite}
  .pill-status.closed .dot{background:var(--ink-4);animation:none}
  @keyframes gentle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}

  .hero h1{font-family:"Cormorant Garamond",serif;font-size:clamp(64px,11vw,260px);font-weight:400;line-height:.92;letter-spacing:-.015em;color:var(--ink);margin-bottom:0}
  .hero h1 .line{display:block;overflow:hidden}
  .hero h1 .line > span{display:inline-block;transform:translateY(110%);transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
  .hero.in h1 .line > span{transform:translateY(0)}
  .hero h1 .line:nth-child(2) > span{transition-delay:.12s}
  .hero h1 .line:nth-child(3) > span{transition-delay:.24s}
  .hero h1 em{font-style:italic;color:var(--champagne)}

  /* triptych composition */
  .hero-triptych{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:24px;margin:60px 0 80px;align-items:start;position:relative}
  .tphoto{position:relative;overflow:hidden;background:var(--bg-2);background-size:cover;background-position:center;will-change:transform}
  .tphoto::before{content:"";position:absolute;inset:0;background:var(--bg-2);transform-origin:left;transition:transform 1.4s cubic-bezier(.7,0,.3,1) 0s;z-index:2}
  .hero.in .tphoto::before{transform:scaleX(0)}
  .hero.in .tphoto:nth-child(2)::before{transition-delay:.2s}
  .hero.in .tphoto:nth-child(3)::before{transition-delay:.4s}
  .tphoto.t1{aspect-ratio:3/4;margin-top:48px;background-image:var(--img-1,url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=75'))}
  .tphoto.t2{aspect-ratio:4/5;background-image:var(--img-2,url('https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=700&q=75'))}
  .tphoto.t3{aspect-ratio:3/4;margin-top:96px;background-image:var(--img-3,url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=75'))}
  .tphoto.fallback{background:linear-gradient(135deg,var(--champagne-soft),var(--bg-2));position:relative}
  .tphoto.fallback::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 30%,var(--champagne),transparent 70%);opacity:.4}
  .tphoto.fallback.t2{background:linear-gradient(135deg,var(--ink),var(--ink-2))}
  .tphoto-caption{position:absolute;left:16px;bottom:16px;color:#fff;z-index:3}
  .tphoto-caption small{font-size:10px;letter-spacing:.28em;text-transform:uppercase;opacity:.85}
  .tphoto-caption strong{display:block;font-family:"Cormorant Garamond",serif;font-weight:400;font-size:24px;font-style:italic;margin-top:6px}
  .tphoto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(21,17,12,.5));opacity:.7;pointer-events:none;transition:opacity .5s}
  .tphoto:hover::after{opacity:1}

  .hero-bottom{display:grid;grid-template-columns:1.5fr 1fr;gap:80px;align-items:end;padding-top:46px;border-top:1px solid var(--line)}
  .hero-lede{font-size:18px;line-height:1.7;color:var(--ink-2);max-width:520px;font-weight:300}
  .hero-lede em{font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--champagne);font-size:1.05em}
  .hero-cta{display:flex;flex-direction:column;gap:14px}
  .btn-luxe{display:inline-flex;align-items:center;justify-content:space-between;gap:54px;padding:18px 0;font-size:12px;color:var(--ink);letter-spacing:.24em;text-transform:uppercase;font-weight:400;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);transition:padding .5s cubic-bezier(.7,0,.3,1)}
  .btn-luxe::after{content:"→";font-size:14px;transition:transform .5s cubic-bezier(.7,0,.3,1)}
  .btn-luxe:hover{padding-left:14px;padding-right:14px}
  .btn-luxe:hover::after{transform:translateX(8px)}
  .btn-luxe.solid{background:var(--ink);color:var(--bg);padding-left:24px;padding-right:24px;border:none}
  .btn-luxe.solid:hover{background:var(--champagne)}

  /* ─── TICKER (refinado) ─── */
  .ticker{padding:46px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;background:var(--bg)}
  .ticker-track{display:flex;gap:80px;font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:400;font-style:italic;letter-spacing:.02em;white-space:nowrap;animation:scroll-luxe 50s linear infinite;will-change:transform;color:var(--ink-2)}
  .ticker-track span{display:inline-flex;align-items:center;gap:80px;flex-shrink:0}
  .ticker-track span::before{content:"❋";color:var(--champagne);font-style:normal;font-size:14px}
  @keyframes scroll-luxe{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* ─── SECTIONS ─── */
  section{padding:154px 0;position:relative}
  .section-head{text-align:center;max-width:860px;margin:0 auto 96px}
  .section-head h2{font-family:"Cormorant Garamond",serif;font-size:clamp(48px,7vw,108px);font-weight:400;line-height:.98;letter-spacing:-.015em;margin:18px 0 24px}
  .section-head h2 em{font-style:italic;color:var(--champagne)}
  .section-head .desc{font-size:17px;color:var(--ink-2);line-height:1.7;max-width:520px;margin:0 auto;font-weight:300}
  .section-head .desc em{font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--champagne)}

  /* ─── SERVICES · lista vertical numerada elegante ─── */
  .svc-list{border-top:1px solid var(--line);max-width:1080px;margin:0 auto}
  .svc-row{display:grid;grid-template-columns:90px 1fr auto;align-items:baseline;gap:48px;padding:48px 0;border-bottom:1px solid var(--line);position:relative;transition:padding .6s cubic-bezier(.7,0,.3,1);cursor:pointer}
  .svc-row::before{content:"";position:absolute;left:0;top:0;height:1px;background:var(--champagne);width:0;transition:width .6s cubic-bezier(.7,0,.3,1);z-index:1}
  .svc-row:hover::before{width:100%}
  .svc-row:hover{padding-left:24px}
  .svc-row:hover .svc-name{font-weight:500}
  .svc-num{font-family:"Cormorant Garamond",serif;font-size:14px;color:var(--ink-3);letter-spacing:.2em;font-style:italic;padding-top:8px}
  .svc-name{font-family:"Cormorant Garamond",serif;font-size:clamp(28px,3.5vw,44px);font-weight:400;line-height:1.05;letter-spacing:-.01em;color:var(--ink);transition:color .4s}
  .svc-name small{display:block;font-family:"Inter";font-size:15px;font-weight:300;color:var(--ink-2);letter-spacing:0;margin-top:14px;max-width:60ch;line-height:1.6}
  .svc-price{font-family:"Cormorant Garamond",serif;font-size:46px;font-weight:400;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
  .svc-price small{display:block;font-family:"Inter";font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-3);font-weight:400;margin-top:4px}

  /* ─── ABOUT · foto detrás del texto (mosaico) ─── */
  .about{padding:154px 0;position:relative;background:var(--bg-2)}
  .about-mosaic{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;max-width:1280px;margin:0 auto;padding:0 54px}
  .about-photos{position:relative;width:100%;aspect-ratio:4/5;max-height:654px;border-radius:2px;overflow:hidden}
  .aphoto{overflow:hidden;background:var(--paper);background-size:cover;background-position:center}
  .aphoto.a1{position:relative;width:100%;height:100%;min-height:480px;background-image:var(--about-1,url('https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=1000&q=75'))}
  .aphoto::after{content:"";position:absolute;inset:0;background:rgba(21,17,12,.05);transition:background .5s}
  .aphoto:hover::after{background:rgba(21,17,12,0)}
  .about-text h2{font-family:"Cormorant Garamond",serif;font-size:clamp(54px,5.5vw,72px);font-weight:400;line-height:1.04;letter-spacing:-.015em;margin:24px 0 46px}
  .about-text h2 em{font-style:italic;color:var(--champagne)}
  .about-text p{font-size:17px;line-height:1.8;color:var(--ink-2);margin-bottom:22px;max-width:520px;font-weight:300}
  .about-text p em{font-family:"Cormorant Garamond",serif;font-style:italic;color:var(--champagne);font-size:1.05em}
  .about-sig{margin-top:54px;padding-top:46px;border-top:1px solid var(--line-2);display:flex;align-items:center;gap:20px}
  .about-sig-img{width:60px;height:60px;border-radius:50%;background:var(--bg-2) center/cover;background-image:var(--sig-img,url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=75'));flex-shrink:0}
  .about-sig-text strong{display:block;font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:400;font-style:italic;color:var(--ink)}
  .about-sig-text small{font-size:11px;color:var(--ink-3);letter-spacing:.24em;text-transform:uppercase;display:block;margin-top:4px;font-weight:400}

  /* ─── GALLERY · bento ─── */
  .gallery{max-width:1280px;margin:0 auto;padding:0 54px;display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:154px;gap:20px}
  .gimg{position:relative;overflow:hidden;background:var(--bg-2);background-size:cover;background-position:center}
  .gimg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(21,17,12,.55));opacity:0;transition:opacity .6s}
  .gimg:hover::after{opacity:1}
  .gimg img,.gimg-bg{position:absolute;inset:0;background:inherit;background-size:cover;background-position:center;transform:scale(1.04);transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
  .gimg{cursor:pointer}
  .gimg:hover .gimg-bg{transform:scale(1)}
  .gimg-overlay{position:absolute;left:24px;right:24px;bottom:24px;color:#fff;z-index:2;transform:translateY(20px);opacity:0;transition:transform .6s cubic-bezier(.7,0,.3,1),opacity .5s}
  .gimg-overlay small{font-size:10px;letter-spacing:.28em;text-transform:uppercase;display:block;margin-bottom:6px;color:var(--champagne)}
  .gimg-overlay strong{font-family:"Cormorant Garamond",serif;font-size:24px;font-weight:400;font-style:italic;letter-spacing:-.005em}
  .gimg:hover .gimg-overlay{transform:translateY(0);opacity:1}
  .gimg:nth-child(1){grid-column:span 3;grid-row:span 3}
  .gimg:nth-child(2){grid-column:span 3;grid-row:span 2}
  .gimg:nth-child(3){grid-column:span 2;grid-row:span 2}
  .gimg:nth-child(4){grid-column:span 4;grid-row:span 2}
  .gimg:nth-child(5){grid-column:span 3;grid-row:span 2}
  .gimg:nth-child(6){grid-column:span 3;grid-row:span 2}

  /* ─── HOURS + CONTACT apilados, lujo ─── */
  .hours-section{background:var(--paper);padding:154px 0}
  .hours-grid{display:grid;grid-template-columns:1fr 1fr;gap:96px;max-width:1080px;margin:0 auto;padding:0 54px}
  .hours-card h3{font-family:"Cormorant Garamond",serif;font-size:50px;font-weight:400;letter-spacing:-.005em;margin:18px 0 50px}
  .hours-card h3 em{font-style:italic;color:var(--champagne)}
  .schedule-row{display:grid;grid-template-columns:1fr auto;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--line);font-size:15px;font-weight:300}
  .schedule-row:last-child{border-bottom:none}
  .schedule-row .day{color:var(--ink-2);letter-spacing:.02em}
  .schedule-row .time{font-family:"Cormorant Garamond",serif;font-size:20px;color:var(--ink);font-variant-numeric:tabular-nums;font-weight:400}
  .schedule-row .closed{color:var(--ink-3);font-style:italic}
  .schedule-row.today{color:var(--champagne)}
  .schedule-row.today .day{color:var(--champagne-2);font-weight:400}
  .schedule-row.today .day::after{content:" — hoy";font-style:italic;color:var(--ink-3);font-family:"Cormorant Garamond",serif;font-size:14px}
  .schedule-row.today .time{color:var(--champagne-2)}

  .contact-list{display:flex;flex-direction:column;gap:0}
  .contact-link{display:grid;grid-template-columns:60px 1fr;gap:18px;padding:20px 0;border-bottom:1px solid var(--line);transition:padding .5s cubic-bezier(.7,0,.3,1)}
  .contact-link:hover{padding-left:14px}
  .contact-link:last-child{border-bottom:none}
  .contact-link .ico{font-family:"Cormorant Garamond",serif;font-size:24px;font-style:italic;color:var(--champagne);font-weight:400}
  .contact-link strong{display:block;font-family:"Cormorant Garamond",serif;font-size:22px;font-weight:400;color:var(--ink);letter-spacing:-.005em;line-height:1.15}
  .contact-link small{font-size:11px;color:var(--ink-3);letter-spacing:.24em;text-transform:uppercase;display:block;margin-top:6px;font-weight:400}

  /* ─── MAP ─── */
  #map{height:520px;background:var(--bg-2)}
  .leaflet-container{font-family:"Inter",sans-serif!important}

  /* ─── REVIEWS ─── */
  .reviews-cta{background:var(--bg);padding:154px 0;text-align:center}
  .reviews-cta-inner{display:flex;flex-direction:column;align-items:center;gap:18px;max-width:680px;margin:0 auto;padding:0 54px}
  .gstars{font-size:46px;color:var(--champagne);letter-spacing:10px;margin-left:10px}
  .gscore{font-family:"Cormorant Garamond",serif;font-size:96px;font-weight:400;line-height:.9;letter-spacing:-.02em;color:var(--ink)}
  .gscore em{font-style:italic;color:var(--champagne)}
  .gscore small{font-size:22px;color:var(--ink-3);font-style:italic;margin-left:6px}
  .greviews{font-size:12px;color:var(--ink-3);letter-spacing:.24em;text-transform:uppercase;font-weight:400}
  .gquote{font-family:"Cormorant Garamond",serif;font-size:24px;font-style:italic;color:var(--ink-2);line-height:1.45;max-width:560px;margin:20px 0;font-weight:400}
  .gbtn{margin-top:16px;display:inline-flex;align-items:center;gap:14px;padding:18px 46px;border:1px solid var(--ink);font-size:12px;color:var(--ink);letter-spacing:.24em;text-transform:uppercase;font-weight:400;transition:background .4s,color .4s}
  .gbtn:hover{background:var(--ink);color:var(--bg)}
  .gbtn::after{content:"↗"}

  /* ─── VCARD ─── */
  .vcard{padding:80px 0;background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .vcard-inner{max-width:1080px;margin:0 auto;padding:0 54px;display:flex;justify-content:space-between;align-items:center;gap:54px;flex-wrap:wrap}
  .vcard h3{font-family:"Cormorant Garamond",serif;font-size:clamp(28px,3.5vw,44px);font-weight:400;line-height:1.1;letter-spacing:-.005em;max-width:520px}
  .vcard h3 em{font-style:italic;color:var(--champagne)}
  .vcard-btn{display:inline-flex;align-items:center;gap:14px;padding:18px 46px;border:1px solid var(--ink);font-size:12px;color:var(--ink);letter-spacing:.24em;text-transform:uppercase;font-weight:400;transition:background .4s,color .4s,padding .5s}
  .vcard-btn:hover{background:var(--ink);color:var(--bg);padding-left:54px;padding-right:54px}

  /* ─── CTA FINAL · bloque tipográfico puro ─── */
  .cta-final{padding:280px 0;text-align:center;background:var(--ink);color:var(--bg);position:relative;overflow:hidden}
  .cta-final::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(182,138,80,.08),transparent 60%);pointer-events:none}
  .cta-final h2{font-family:"Cormorant Garamond",serif;font-size:clamp(64px,11vw,260px);font-weight:400;line-height:.92;letter-spacing:-.02em;margin-bottom:54px;position:relative}
  .cta-final h2 em{font-style:italic;color:var(--champagne)}
  .cta-final .actions{display:flex;justify-content:center;gap:48px;flex-wrap:wrap;position:relative}
  .cta-final .actions a{display:inline-flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--bg);letter-spacing:.32em;text-transform:uppercase;padding:18px 46px;border:1px solid rgba(255,255,255,.3);transition:border-color .4s,padding .5s}
  .cta-final .actions a:hover{border-color:var(--champagne);padding-left:48px;padding-right:48px}
  .cta-final .actions a strong{font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:400;letter-spacing:0;font-style:italic;text-transform:none;color:var(--champagne);margin-bottom:4px}

  /* ─── FOOTER ─── */
  footer{background:var(--bg);padding:100px 0 46px;border-top:1px solid var(--line)}
  .foot{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:64px;padding-bottom:64px;border-bottom:1px solid var(--line);max-width:1280px;margin:0 auto;padding-left:54px;padding-right:54px}
  .foot-brand strong{font-family:"Cormorant Garamond",serif;font-size:50px;font-weight:400;letter-spacing:.02em;color:var(--ink);display:block;margin-bottom:6px}
  .foot-brand small{font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4em;font-weight:400}
  .foot-brand p{margin-top:24px;font-size:14px;color:var(--ink-2);max-width:320px;line-height:1.7;font-weight:300}
  .foot h4{font-size:10.5px;color:var(--ink-3);letter-spacing:.3em;text-transform:uppercase;margin-bottom:24px;font-weight:400}
  .foot ul{list-style:none;display:flex;flex-direction:column;gap:14px}
  .foot ul a{font-size:14px;color:var(--ink-2);font-weight:300;transition:color .3s}
  .foot ul a:hover{color:var(--champagne)}
  .foot-bot{max-width:1280px;margin:0 auto;padding:46px 54px 0;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-3);letter-spacing:.18em;text-transform:uppercase;flex-wrap:wrap;gap:10px;font-weight:400}
  .foot-bot a{color:var(--ink-2)}

  /* reveal on scroll · luxe (slow, no transform) */
  .fade-in{opacity:0;transition:opacity 1.4s cubic-bezier(.7,0,.3,1)}
  .fade-in.in{opacity:1}
  .slide-up{opacity:0;transform:translateY(54px);transition:opacity 1.2s cubic-bezier(.7,0,.3,1),transform 1.2s cubic-bezier(.7,0,.3,1)}
  .slide-up.in{opacity:1;transform:none}
  .slide-up[data-d="1"]{transition-delay:.15s}
  .slide-up[data-d="2"]{transition-delay:.3s}

  /* responsive */
  @media (max-width:980px){
    .hero-triptych{grid-template-columns:1fr 1.2fr 1fr;gap:14px}
    .hero-bottom{grid-template-columns:1fr;gap:46px}
    .about-mosaic{grid-template-columns:1fr;gap:64px;padding:0 46px}
    .about-photos{max-width:520px;min-height:420px;margin:0 auto;width:100%}
    .hours-grid{grid-template-columns:1fr;gap:64px}
    .foot{grid-template-columns:1fr 1fr;gap:48px}
    .gallery{grid-template-columns:repeat(4,1fr);grid-auto-rows:120px}
    .gimg:nth-child(1){grid-column:span 4;grid-row:span 3}
    .gimg:nth-child(2){grid-column:span 2}
    .gimg:nth-child(3){grid-column:span 2}
    .gimg:nth-child(4){grid-column:span 4}
    .gimg:nth-child(5){grid-column:span 2}
    .gimg:nth-child(6){grid-column:span 2}
  }
  @media (max-width:680px){
    .container,.container-narrow{padding:0 24px}
    .nav{padding:0 24px}
    .nav-inner{padding:18px 0}
    .nav.scrolled .nav-inner{padding:12px 0}
    .nav ul,.nav-cta{display:none}
    .burger{display:flex}
    .brand strong{font-size:22px}
    .brand small{font-size:8.5px;letter-spacing:.32em}
    .hero{padding:120px 0 60px}
    .hero-meta{margin-bottom:46px}
    .hero-triptych{grid-template-columns:1fr;gap:14px;margin:54px 0}
    .tphoto.t1{aspect-ratio:4/3;margin-top:0}
    .tphoto.t2{aspect-ratio:4/3}
    .tphoto.t3{aspect-ratio:4/3;margin-top:0}
    section,.about,.hours-section,.reviews-cta,.cta-final{padding:80px 0}
    .section-head{margin-bottom:56px}
    .svc-row{grid-template-columns:60px 1fr;gap:18px;padding:46px 0}
    .svc-row .svc-price{grid-column:span 2;text-align:left;font-size:24px;margin-top:8px}
    .gallery{grid-template-columns:repeat(2,1fr);gap:10px}
    .gimg:nth-child(n){grid-column:span 1;grid-row:span 1;aspect-ratio:1}
    .gimg:nth-child(1){grid-column:span 2;aspect-ratio:4/3}
    .hours-grid{padding:0 24px;gap:48px}
    .contact-link{grid-template-columns:48px 1fr;gap:12px}
    .vcard-inner{flex-direction:column;text-align:center;align-items:center}
    .cta-final{padding:120px 0}
    .cta-final .actions{flex-direction:column;gap:18px}
    .foot{grid-template-columns:1fr;gap:48px;padding-left:24px;padding-right:24px}
    .foot-bot{flex-direction:column;text-align:center}
  }

  section[id],a[id]{scroll-margin-top:96px}
  html.embed-preview-root,body.embed-preview{overflow:auto!important;height:auto!important;min-height:100%}
  body.embed-preview .nav{position:sticky}
  body.embed-preview .slide-up,body.embed-preview .fade-in{opacity:1!important;transform:none!important}
  .nav{--lw-logo-scale:1}
  .brand.brand-has-img .nav-brand-img{display:block;height:calc(50px * var(--lw-logo-scale,1));width:auto;max-width:calc(260px * var(--lw-logo-scale,1));object-fit:contain;margin:0 auto 6px}
  .brand.brand-has-img #navBrandName,.brand.brand-has-img #navBrandCat{display:none!important}
  #servicios.is-hidden,#opiniones.is-hidden,.vcard.is-hidden{display:none!important}
  .ticker{pointer-events:none;user-select:none}
  .lw-gallery-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px}
  .lw-gallery-lightbox[hidden]{display:none!important}
  .lw-gallery-lightbox-backdrop{position:absolute;inset:0;background:rgba(21,17,12,.88);border:0;cursor:pointer}
  .lw-gallery-lightbox-frame{position:relative;z-index:1;max-width:min(96vw,1100px);max-height:90vh;margin:0}
  .lw-gallery-lightbox-img{max-width:100%;max-height:90vh;display:block;object-fit:contain}
  .lw-gallery-lightbox-close{position:absolute;top:-8px;right:-8px;width:44px;height:44px;border:1px solid #fff;background:#15110C;color:#fff;font-size:22px;line-height:1;cursor:pointer}
  .map-section{padding:0}
  .luxe-map-directions{display:none;justify-content:center;padding:28px 54px;border-top:1px solid var(--line);background:var(--bg)}
  .luxe-map-directions.is-visible{display:flex}
  .map-dir-btn{display:inline-flex;align-items:center;gap:12px;padding:16px 50px;background:var(--ink);color:var(--bg);font-size:11px;letter-spacing:.18em;text-transform:uppercase;border:1px solid var(--ink);transition:background .3s,color .3s,padding .45s}
  .map-dir-btn::after{content:"→";transition:transform .45s}
  .map-dir-btn:hover{background:var(--champagne);color:var(--bg);padding-left:48px;padding-right:48px}
  .map-dir-btn:hover::after{transform:translateX(6px)}
  .mobile-menu-close{position:absolute;top:28px;right:28px;width:44px;height:44px;border:1px solid var(--line);background:transparent;color:var(--ink);font-size:22px;cursor:pointer;z-index:3}
  body.luxe-menu-open .nav{z-index:220}

  @media (prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
    .fade-in,.slide-up{opacity:1;transform:none}
    .hero h1 .line > span{transform:none}
    .tphoto::before{transform:scaleX(0)}
  }
</style>
@endverbatim

@include('public.partials.brand-override', ['brandColor' => $brand_color ?? null, 'variableName' => $brand_variable ?? null])

@endpush

@section('content')

<!-- 1. NAV -->
<nav class="nav" id="nav">
  <div class="nav-inner">
    <ul style="flex:1;justify-content:flex-start">
      <li id="navServiciosLi" style="display:none;"><a href="#servicios">Servicios</a></li>
      <li><a href="#sobre-nosotros">Nosotros</a></li>
      <li><a href="#galeria">Galería</a></li>
    </ul>
    <a href="#" class="brand" id="navBrandWrap">
      @if($logo_url)
      <img id="navBrandLogo" class="nav-brand-img" src="{{ $logo_url }}" alt="{{ $nombre }}" decoding="async"/>
      @else
      <img id="navBrandLogo" class="nav-brand-img" alt="" hidden style="display:none"/>
      @endif
      <strong id="navBrandName">{{ $nombre }}</strong>
      <small id="navBrandCat">{{ $tagline }}</small>
    </a>
    <ul style="flex:1;justify-content:flex-end">
      <li><a href="#horario">Horario</a></li>
      <li id="navOpinionesLi" style="display:none;"><a href="#opiniones">Opiniones</a></li>
      <li><a href="#contacto">Contacto</a></li>
      <li><a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" class="nav-cta"><span class="wa"></span>Reservar</a></li>
    </ul>
    <button class="burger" id="burger" aria-label="Menú"><span></span><span></span><span></span></button>
  </div>
</nav>

<aside class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <button type="button" class="mobile-menu-close" id="mobileMenuClose" aria-label="Cerrar menú">×</button>
  <ul>
    <li id="navServiciosMobileLi" style="display:none;"><a href="#servicios">Servicios</a></li>
    <li><a href="#sobre-nosotros">Sobre <em>nosotros</em></a></li>
    <li><a href="#galeria"><em>Galería</em></a></li>
    <li><a href="#horario">Horario</a></li>
    <li id="navOpinionesMobileLi" style="display:none;"><a href="#opiniones">Opiniones</a></li>
    <li><a href="#contacto"><em>Contacto</em></a></li>
  </ul>
  <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer" class="mobile-cta">Reservar</a>
</aside>

<!-- 2. HERO · tríptico horizontal -->
<header class="hero" id="hero">
  <div class="container">
    <div class="hero-meta">
      <span class="eyebrow" id="heroEyebrow">Maison · est. {{ $anio_fundacion }}</span>
      <span class="pill-status" id="pill-status"><span class="dot"></span><span id="pill-text">Atelier abierto</span></span>
    </div>
    <h1 class="serif">
      <span class="line"><span>El cuidado</span></span>
      <span class="line"><span>del detalle,</span></span>
      <span class="line"><span><em>como manifiesto.</em></span></span>
    </h1>

    <div class="hero-triptych">
      <div class="tphoto t1" id="heroTphoto1"><div class="tphoto-caption"><small>I</small><strong>Maison</strong></div></div>
      <div class="tphoto t2" id="heroTphoto2"><div class="tphoto-caption"><small>II</small><strong>Atelier</strong></div></div>
      <div class="tphoto t3" id="heroTphoto3"><div class="tphoto-caption"><small>III</small><strong>Pieza</strong></div></div>
    </div>

    <div class="hero-bottom">
      <p class="hero-lede" id="heroLede">{{ $tagline }}. <em>Cada visita, una experiencia.</em></p>
      <div class="hero-cta">
        <a href="https://wa.me/{{ $whatsapp }}" data-wa-link class="btn-luxe solid" target="_blank" rel="noopener noreferrer">Reservar visita<span></span></a>
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link class="btn-luxe">Llamar<span></span></a>
      </div>
    </div>
  </div>
</header>

<!-- 3. TICKER -->
<div class="ticker">
  <div class="ticker-track" id="tplTickerTrack">
    <span>Maison fundada en {{ $anio_fundacion }}</span>
    <span>Atención personal</span>
    <span>Piezas únicas</span>
    <span>Reserva con cita previa</span>
    <span>Servicio en {{ $ciudad }}</span>
    <span>Atelier privado</span>
    <span>Maison fundada en {{ $anio_fundacion }}</span>
    <span>Atención personal</span>
    <span>Piezas únicas</span>
    <span>Reserva con cita previa</span>
    <span>Servicio en {{ $ciudad }}</span>
    <span>Atelier privado</span>
  </div>
</div>

<!-- 4. SERVICIOS -->
<section id="servicios" class="is-hidden" data-section="servicios">
  <div class="container-narrow">
    <div class="section-head slide-up">
      <span class="eyebrow">Nuestros servicios</span>
      <h2 class="serif">El <em>arte</em><br/>de lo bien hecho.</h2>
      <p class="desc">Cada propuesta es una <em>conversación</em>. Cada propuesta, un proyecto pensado a medida de quien lo recibe.</p>
    </div>
  </div>
  <div class="container-narrow">
    <div class="svc-list" id="luxeServicesList" data-services-list>
      <a class="svc-row" data-svc>
        <div class="svc-num">I</div>
        <div class="svc-name serif">{{ ($services[0]['name'] ?? '') }}<small>{{ ($services[0]['description'] ?? '') }}</small></div>
        <div class="svc-price">
            @if(isset($services[0]) && $services[0]['price'] !== null)
            {{ number_format($services[0]['price'], 2, ",", ".") }}
            @else
            Consultar
            @endif
            <small>Desde</small>
          </div>
      </a>
      <a class="svc-row" data-svc>
        <div class="svc-num">II</div>
        <div class="svc-name serif">{{ ($services[1]['name'] ?? '') }}<small>{{ ($services[1]['description'] ?? '') }}</small></div>
        <div class="svc-price">
            @if(isset($services[1]) && $services[1]['price'] !== null)
            {{ number_format($services[1]['price'], 2, ",", ".") }}
            @else
            Consultar
            @endif
            <small>Por sesión</small>
          </div>
      </a>
      <a class="svc-row" data-svc>
        <div class="svc-num">III</div>
        <div class="svc-name serif">{{ ($services[2]['name'] ?? '') }}<small>{{ ($services[2]['description'] ?? '') }}</small></div>
        <div class="svc-price">A consultar<small>Atelier privado</small></div>
      </a>
    </div>
  </div>
</section>

<!-- 5. ABOUT · foto detrás del texto -->
<section id="sobre-nosotros" class="about">
  <div class="about-mosaic">
    <div class="about-photos slide-up">
      <div class="aphoto a1" id="aboutPhoto1"></div>
    </div>
    <div class="about-text slide-up" data-d="1">
      <span class="eyebrow">La maison</span>
      <h2 class="serif" id="aboutTitle">Una casa<br/><em>con oficio.</em></h2>
      <div id="aboutBody"><p>{{ $descripcion }}</p></div>
      <p><em>Trabajamos a mano</em>, con materiales escogidos uno a uno, y un único principio: cada pieza ha de poder firmarse. Sin atajos, sin prisa, sin compromiso con la moda.</p>
      <div class="about-sig">
        <div class="about-sig-img" id="aboutSigImg"></div>
        <div class="about-sig-text">
          <strong id="aboutSigName">{{ $nombre_responsable ?? '' }}</strong>
          <small id="aboutSigYear">Fundador · {{ $anio_fundacion }}</small>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 6. GALERÍA · bento -->
<section id="galeria">
  <div class="container">
    <div class="section-head slide-up">
      <span class="eyebrow">Selección</span>
      <h2 class="serif">Una <em>curaduría</em><br/>visual.</h2>
      <p class="desc">Una <em>muestra escogida</em> de piezas, escenas y momentos del atelier.</p>
    </div>
  </div>
  <div class="gallery" id="galleryGrid">
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1521577352947-9bb58764b69a?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1521577352947-9bb58764b69a?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1535868463750-c78d9543614f?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1535868463750-c78d9543614f?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>
    <div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>
  </div>
</section>

<!-- 7. HORARIO + 8. CONTACTO -->
<section id="horario" class="hours-section">
  <div class="container-narrow">
    <div class="section-head slide-up">
      <span class="eyebrow">Visítenos</span>
      <h2 class="serif">Horario<br/>y <em>contacto.</em></h2>
    </div>
  </div>
  <div class="hours-grid">
    <div class="hours-card slide-up">
      <span class="eyebrow">Atelier abierto</span>
      <h3 class="serif">Horarios <em>de la maison</em></h3>
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
      <span class="eyebrow">Conversemos</span>
      <h3 class="serif">Permanezcamos <em>en contacto</em></h3>
      <div class="contact-list">
        <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link class="contact-link">
          <span class="ico">☏</span>
          <div>
            <strong data-phone-display>{{ $telefono }}</strong>
            <small>Recepción</small>
          </div>
        </a>
        <a href="mailto:" id="contactEmailLink" class="contact-link">
          <span class="ico">@</span>
          <div>
            <strong>{{ $correo }}</strong>
            <small>Reservas privadas</small>
          </div>
        </a>
        <a href="https://wa.me/{{ $whatsapp }}" data-wa-link class="contact-link" target="_blank" rel="noopener noreferrer">
          <span class="ico">✉</span>
          <div>
            <strong>WhatsApp</strong>
            <small>Mensaje directo</small>
          </div>
        </a>
        <a href="#" id="contactAddressLink" class="contact-link" target="_blank">
          <span class="ico">◆</span>
          <div>
            <strong>{{ $direccion }}</strong>
            <small>{{ $ciudad }}</small>
          </div>
        </a>
      </div>
    </aside>
  </div>
</section>

<!-- 9. MAPA -->
<section class="map-section">
  <div id="map" data-lat="{{ $map_lat }}" data-lng="{{ $map_lon }}" data-name="{{ $nombre }}" data-addr="{{ $direccion }}"></div>
  <div class="luxe-map-directions" id="luxeMapDirectionsRow">
    <a href="#" id="luxeMapsDirectionsBtn" class="map-dir-btn" target="_blank" rel="noopener noreferrer">Cómo llegar en Google Maps</a>
  </div>
</section>

<!-- 10. OPINIONES -->
<section id="opiniones" class="reviews-cta is-hidden" data-section="opiniones">
  <div class="reviews-cta-inner">
    <span class="eyebrow">Reseñas</span>
    <div class="gscore serif">{{ $nota_google ?? '' }}<em>/5</em></div>
    <div class="gstars">★★★★★</div>
    <div class="greviews">{{ $n_reseñas ?? '' }} reseñas en Google</div>
    <p class="gquote">«Una experiencia que <em>recuerda por qué</em> existe el oficio bien hecho».</p>
    <a href="#" id="gbizBtn" class="gbtn" target="_blank">Ver opiniones</a>
  </div>
</section>

<!-- 11. VCARD -->
<section class="vcard is-hidden" data-section="vcard">
  <div class="vcard-inner">
    <h3 class="serif">Guarde el contacto<br/><em>de la maison.</em></h3>
    <a href="#" id="vcardBtn" class="vcard-btn" download="{{ $nombre }}.vcf">↓ Guardar tarjeta</a>
  </div>
</section>

<!-- 12. CTA FINAL -->
<section class="cta-final">
  <div class="container">
    <h2 class="serif slide-up">Una <em>visita,</em><br/>una <em>conversación.</em></h2>
    <div class="actions slide-up" data-d="1">
      <a href="{{ $whatsapp ? 'tel:+'.$whatsapp : 'tel:' }}" data-tel-link><strong>Llamada</strong> <span data-phone-display>{{ $telefono }}</span></a>
      <a href="https://wa.me/{{ $whatsapp }}" data-wa-link target="_blank" rel="noopener noreferrer"><strong>WhatsApp</strong>Mensaje directo</a>
      <a href="mailto:" id="ctaEmailLink"><strong id="ctaEmailDisplay">{{ $correo }}</strong></a>
    </div>
  </div>
</section>

<!-- 13. FOOTER -->
<footer>
  <div class="foot">
    <div class="foot-brand">
      <strong>{{ $nombre }}</strong>
      <small>{{ $categoria ?? '' }}</small>
      <p>{{ $descripcion }} {{ $ciudad }}, desde {{ $anio_fundacion }}.</p>
    </div>
    <div>
      <h4>Maison</h4>
      <ul>
        <li id="footNavServicios" style="display:none;"><a href="#servicios">Servicios</a></li>
        <li><a href="#sobre-nosotros">Sobre nosotros</a></li>
        <li><a href="#galeria">Galería</a></li>
        <li id="footNavOpiniones" style="display:none;"><a href="#opiniones">Reseñas</a></li>
      </ul>
    </div>
    <div>
      <h4>Conversemos</h4>
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
    <span>© {{ date('Y') }} {{ $nombre }}</span>
    <span id="tpl-platform-branding"@if($is_pro) style="display:none;"@endif>Hecho con <a href="https://onez.es" target="_blank" rel="noopener noreferrer">ONEZ</a></span>
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
(function initLuxePreviewModeClasses() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.body.classList.add('luxe-preview');
  }
})();

var LUXE_SCHEDULE_DEFAULT = [
  { name: 'Lun', full: 'Lunes', idx: 1, open: '10:00', close: '20:00' },
  { name: 'Mar', full: 'Martes', idx: 2, open: '10:00', close: '20:00' },
  { name: 'Mié', full: 'Miércoles', idx: 3, open: '10:00', close: '20:00' },
  { name: 'Jue', full: 'Jueves', idx: 4, open: '10:00', close: '20:00' },
  { name: 'Vie', full: 'Viernes', idx: 5, open: '10:00', close: '20:00' },
  { name: 'Sáb', full: 'Sábado', idx: 6, open: '10:00', close: '18:00' },
  { name: 'Dom', full: 'Domingo', idx: 0, open: null, close: null },
];
var SCHEDULE = LUXE_SCHEDULE_DEFAULT.map(function (d) {
  return { name: d.name, full: d.full, idx: d.idx, open: d.open, close: d.close };
});

var luxePreviewMap = null;
var luxePreviewMarker = null;
var LUXE_MAP_ZOOM = 18;

function luxeHasStr(v) {
  return v != null && String(v).trim() !== '';
}

function escapeLuxeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeLuxeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function formatLuxePrice(p) {
  if (p === null || p === undefined || p === '') return 'Consultar';
  var n = typeof p === 'number' ? p : parseFloat(String(p).replace(',', '.'));
  if (!Number.isFinite(n)) return 'Consultar';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/** Tienda de ropa / moda — solo en vista previa (?embed=1 o ?preview=1). */
var LUXE_PREVIEW_SAMPLE = {
  portada: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
  portada_2: 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=1000&q=80',
  portada_3: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
  foto_equipo: 'https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=1000&q=80',
};

function shouldUseLuxeSampleMedia() {
  return document.body.classList.contains('embed-preview') || document.body.classList.contains('luxe-preview');
}

function luxeResolvePreviewPhotoSrc(userSrc, sampleKey) {
  var src = userSrc ? String(userSrc).trim() : '';
  if (src) return src;
  if (!shouldUseLuxeSampleMedia()) return '';
  return LUXE_PREVIEW_SAMPLE[sampleKey] || '';
}

var LUXE_DEFAULT_GALLERY_INNER =
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>' +
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>' +
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1521577352947-9bb58764b69a?auto=format&fit=crop&w=900&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1521577352947-9bb58764b69a?auto=format&fit=crop&w=900&q=75&quot;)"></div></div>' +
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1535868463750-c78d9543614f?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1535868463750-c78d9543614f?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>' +
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>' +
  '<div class="gimg" data-lightbox-src="https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=600&q=75"><div class="gimg-bg" style="background-image:url(&quot;https://images.unsplash.com/photo-1777628530456-bb93d3a03faf?auto=format&fit=crop&w=600&q=75&quot;)"></div></div>';
function buildLuxeDirectionsUrl(raw) {
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

function syncLuxeMapDirections(raw) {
  var mapsUrl = buildLuxeDirectionsUrl(raw);
  var row = document.getElementById('luxeMapDirectionsRow');
  var btn = document.getElementById('luxeMapsDirectionsBtn');
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

function syncLuxeScheduleFromPreview(h) {
  if (h == null || typeof h !== 'object') {
    SCHEDULE = LUXE_SCHEDULE_DEFAULT.map(function (d) {
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

function renderLuxeSchedule() {
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
      '<span class="day">' + escapeLuxeHtml(isToday ? d.full + ' · hoy' : d.full) + '</span>' +
      (openDay
        ? '<span class="time">' + escapeLuxeHtml(d.open + ' – ' + d.close) + '</span>'
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
    txt.textContent = openNow ? 'Atelier abierto' : 'Cerrado · con cita previa';
  }
}


function luxeSetTphoto(el, varName, src) {
  if (!el) return;
  var u = src ? String(src).trim() : '';
  if (u) {
    el.style.setProperty(varName, 'url("' + escapeLuxeAttr(u) + '")');
    el.classList.remove('fallback');
  } else {
    el.style.removeProperty(varName);
    el.classList.add('fallback');
  }
}

function updateLuxeHeroPhotos(raw) {
  raw = raw || {};
  var hasP1 = Object.prototype.hasOwnProperty.call(raw, 'portada');
  var hasP2 = Object.prototype.hasOwnProperty.call(raw, 'portada_2');
  var hasP3 = Object.prototype.hasOwnProperty.call(raw, 'portada_3');
  if (!hasP1 && !hasP2 && !hasP3 && !shouldUseLuxeSampleMedia()) return;
  luxeSetTphoto(document.getElementById('heroTphoto1'), '--img-1', luxeResolvePreviewPhotoSrc(raw.portada, 'portada'));
  luxeSetTphoto(document.getElementById('heroTphoto2'), '--img-2', luxeResolvePreviewPhotoSrc(raw.portada_2, 'portada_2'));
  luxeSetTphoto(document.getElementById('heroTphoto3'), '--img-3', luxeResolvePreviewPhotoSrc(raw.portada_3, 'portada_3'));
}

function updateLuxeAboutPhoto(raw) {
  raw = raw || {};
  var hasFoto = Object.prototype.hasOwnProperty.call(raw, 'foto_equipo');
  if (!hasFoto && !shouldUseLuxeSampleMedia()) return;
  var src = luxeResolvePreviewPhotoSrc(raw.foto_equipo, 'foto_equipo');
  var a1 = document.getElementById('aboutPhoto1');
  var sig = document.getElementById('aboutSigImg');
  if (a1) {
    if (src) a1.style.setProperty('--about-1', 'url("' + escapeLuxeAttr(src) + '")');
    else a1.style.removeProperty('--about-1');
  }
  if (sig) {
    if (src) sig.style.setProperty('--sig-img', 'url("' + escapeLuxeAttr(src) + '")');
    else sig.style.removeProperty('--sig-img');
  }
}


function renderLuxeGallery(urls) {
  var root = document.getElementById('galleryGrid');
  if (!root) return;
  var list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) {
    root.innerHTML = LUXE_DEFAULT_GALLERY_INNER;
    return;
  }
  root.innerHTML = list
    .slice(0, 6)
    .map(function (src) {
      var esc = escapeLuxeAttr(src);
      return (
        '<div class="gimg" data-lightbox-src="' + esc + '">' +
        '<div class="gimg-bg" style="background-image:url(&quot;' + esc + '&quot;)"></div>' +
        '</div>'
      );
    })
    .join('');
}

function renderLuxeServices(services) {
  var list = document.getElementById('luxeServicesList');
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
  var nums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  list.innerHTML = services.slice(0, 9).map(function (svc, i) {
    var nm = escapeLuxeHtml(String(svc.name || ''));
    var pr = escapeLuxeHtml(formatLuxePrice(svc.price));
    var dc = svc.description && String(svc.description).trim();
    var desc = dc ? escapeLuxeHtml(String(svc.description)) : 'Detalle del servicio.';
    return (
      '<a class="svc-row" data-svc href="#contacto">' +
      '<div class="svc-num">' + (nums[i] || String(i + 1)) + '</div>' +
      '<div class="svc-name serif">' + nm + '<small>' + desc + '</small></div>' +
      '<div class="svc-price">' + pr + '<small>Desde</small></div>' +
      '</a>'
    );
  }).join('');
}

function updateLuxeTicker(raw) {
  var track = document.getElementById('tplTickerTrack');
  if (!track) return;
  var brand = (raw && raw.nombre ? String(raw.nombre).trim() : '') || 'Tu negocio';
  var tagline = (raw && raw.tagline ? String(raw.tagline).trim() : '') || '';
  var city = (raw && raw.ciudad ? String(raw.ciudad).trim() : '') || '';
  var parts = [brand, tagline, city, 'Hecho a mano', 'Atención personal', 'Cita previa'].filter(Boolean);
  var inner = parts
    .concat(parts)
    .map(function (p) {
      return '<span>' + escapeLuxeHtml(p) + '</span>';
    })
    .join('');
  track.innerHTML = inner;
}

function destroyLuxePreviewMap() {
  if (luxePreviewMap) {
    try { luxePreviewMap.remove(); } catch (e) {}
    luxePreviewMap = null;
    luxePreviewMarker = null;
  }
}

function updateLuxePreviewMap(lat, lon, label) {
  var el = document.getElementById('map');
  if (!el || window.__LW_SKIP_LEAFLET) return;
  if (typeof L === 'undefined') {
    if (typeof lwWhenLeafletReady === 'function') {
      lwWhenLeafletReady(function () { updateLuxePreviewMap(lat, lon, label); });
    }
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    destroyLuxePreviewMap();
    return;
  }
  function applyMap() {
    if (window.__LW_SKIP_LEAFLET || typeof L === 'undefined') return;
    if (!luxePreviewMap) {
      luxePreviewMap = L.map(el, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
      }).setView([lat, lon], LUXE_MAP_ZOOM);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(luxePreviewMap);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(luxePreviewMap);
    } else {
      luxePreviewMap.setView([lat, lon], LUXE_MAP_ZOOM);
    }
    if (luxePreviewMarker) luxePreviewMap.removeLayer(luxePreviewMarker);
    var icon = L.divIcon({
      html: '<div style="width:18px;height:18px;background:#15110C;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(182,138,80,.25)"></div>',
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    luxePreviewMarker = L.marker([lat, lon], { icon: icon }).addTo(luxePreviewMap);
    if (label) luxePreviewMarker.bindPopup('<strong>' + escapeLuxeHtml(label) + '</strong>');
    setTimeout(function () { if (luxePreviewMap) luxePreviewMap.invalidateSize(); }, 100);
  }
  requestAnimationFrame(function () { requestAnimationFrame(applyMap); });
}

function syncLuxeFooter(raw) {
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
  if (fbs) fbs.textContent = (tagline || 'Atelier') + (loc ? ' — ' + loc : '');
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

function syncLuxeTemplateExtensions(raw) {
  raw = raw || {};
  var isPro = raw.is_pro === true || raw.is_pro === 'true' || raw.is_pro === 1;
  var branding = document.getElementById('tpl-platform-branding');
  if (branding) branding.style.display = isPro ? 'none' : '';

  var services = Array.isArray(raw.services)
    ? raw.services.filter(function (s) { return s && String(s.name || '').trim(); })
    : [];
  renderLuxeServices(services);

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

function revealLuxeScrollAnimations() {
  document.querySelectorAll('.slide-up, .fade-in').forEach(function (el) {
    el.classList.add('in');
  });
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

  document.title = name + ' — Atelier';

  var logoUrl = (raw.logo_url || '').trim();
  var nav = document.getElementById('nav');
  if (nav) {
    if (logoUrl) {
      var lsc = typeof raw.logo_scale === 'number' && isFinite(raw.logo_scale) ? raw.logo_scale : (logoUrl ? 1.35 : 1);
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
  if (heroEyebrow) heroEyebrow.textContent = 'Maison · est. ' + year;

  var heroLede = document.getElementById('heroLede');
  if (heroLede) {
    heroLede.innerHTML = escapeLuxeHtml(tagline) + '. <em>' + escapeLuxeHtml(descripcion ? descripcion.split(/\n\n+/)[0].slice(0, 120) : 'Cada visita, una experiencia.') + '</em>';
  }

  if (typeof lwApplyContactLinks === 'function') lwApplyContactLinks(raw);

  var aboutTitle = document.getElementById('aboutTitle');
  var aboutYear = document.getElementById('aboutYear');
  var aboutLede = document.getElementById('aboutLede');
  var aboutDesc = document.getElementById('aboutDesc');
  if (aboutTitle) aboutTitle.innerHTML = escapeLuxeHtml(name) + ',<br/><em>con oficio.</em>';
  var aboutBody = document.getElementById('aboutBody');
  if (aboutBody) {
    if (descripcion) {
      var paras = descripcion.split(/\n\n+/).filter(Boolean);
      aboutBody.innerHTML = paras.map(function (p) { return '<p>' + escapeLuxeHtml(p) + '</p>'; }).join('');
    } else {
      aboutBody.innerHTML = '<p>' + escapeLuxeHtml(tagline || 'Un atelier donde el detalle importa.') + '</p>';
    }
  }
  var aboutSigName = document.getElementById('aboutSigName');
  if (aboutSigName) aboutSigName.textContent = name;
  var aboutSigYear = document.getElementById('aboutSigYear');
  if (aboutSigYear) aboutSigYear.textContent = 'Fundador · ' + year;

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
    var mapsUrl = buildLuxeDirectionsUrl(raw);
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
  syncLuxeMapDirections(raw);

  updateLuxeHeroPhotos(raw);
  updateLuxeAboutPhoto(raw);
  var galeria = Array.isArray(raw.galeria) ? raw.galeria.filter(Boolean) : [];
  if (Object.prototype.hasOwnProperty.call(raw, 'galeria')) {
    renderLuxeGallery(galeria);
  } else if (galeria.length) {
    renderLuxeGallery(galeria);
  }
  updateLuxeTicker(raw);
  syncLuxeScheduleFromPreview(raw.horario);
  renderLuxeSchedule();
  syncLuxeFooter(raw);
  syncLuxeTemplateExtensions(raw);

  var lat = parseFloat(raw.map_lat);
  var lon = parseFloat(raw.map_lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    updateLuxePreviewMap(lat, lon, name);
  } else {
    destroyLuxePreviewMap();
  }

  revealLuxeScrollAnimations();

  if (opts.alignToHash) scrollEmbedPreviewToHash();
}

(function initLuxePreviewSampleMedia() {
  if (!shouldUseLuxeSampleMedia()) return;
  function boot() {
    updateLuxeHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
    updateLuxeAboutPhoto({ foto_equipo: '' });
    renderLuxeGallery([]);
    syncLuxeTemplateExtensions({});
    var hero = document.getElementById('hero');
    if (hero) hero.classList.add('in');
    revealLuxeScrollAnimations();
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
    syncLuxeScheduleFromPreview(null);
    renderLuxeSchedule();
    syncLuxeTemplateExtensions({});
    revealLuxeScrollAnimations();
    if (shouldUseLuxeSampleMedia()) {
      updateLuxeHeroPhotos({ portada: '', portada_2: '', portada_3: '' });
      updateLuxeAboutPhoto({ foto_equipo: '' });
      renderLuxeGallery([]);
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
    anio_fundacion: params.get('anio_fundacion') || '',
  }, { alignToHash: !!window.location.hash.replace(/^#/, '') });
})();

(function initLuxeUi() {
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  var menuClose = document.getElementById('mobileMenuClose');
  if (burger && menu) {
    function toggleMenu(open) {
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      document.body.classList.toggle('luxe-menu-open', open);
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
    revealLuxeScrollAnimations();
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
(function bootLuxeAtelierTenantPage() {
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
