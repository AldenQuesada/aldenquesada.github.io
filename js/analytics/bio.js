/* Page observation and first-party link correlation. No content or style changes. */
(function (root) {
  'use strict';
  var started = false;
  function iniciar(connection) {
    if (started || !root.AnalyticsCore || !root.BIO_ANALYTICS_CONFIG) return;
    started = true;
    var cfg = root.BIO_ANALYTICS_CONFIG, params = new URLSearchParams(location.search), internal=false, local, store;
    try { local=root.localStorage; store=root.sessionStorage; } catch (_) {}
    try {
      if (params.get('interno') === '1') local.setItem(cfg.internalKey,'1');
      if (params.get('interno') === '0') local.removeItem(cfg.internalKey);
      internal = local.getItem(cfg.internalKey)==='1';
      if (local.getItem(cfg.optoutKey)==='1') return;
    } catch (_) {}
    if (params.has('interno')) internal=params.get('interno')!=='0';
    if (params.get('medicao')==='off' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && params.get('medicao')!=='test') return;
    if (navigator.globalPrivacyControl || navigator.doNotTrack==='1') return;
    var ua = navigator.userAgent || '', browser = /Instagram/i.test(ua)?'Instagram':/FBAN|FBAV/i.test(ua)?'Facebook':/Edg/i.test(ua)?'Edge':/CriOS|Chrome/i.test(ua)?'Chrome':/FxiOS|Firefox/i.test(ua)?'Firefox':/Safari/i.test(ua)?'Safari':'Other';
    var utm = root.UTM && root.UTM.rastro || {}, context = {path:location.pathname,release:cfg.release,browser:browser,
      device:/iPad|Tablet/i.test(ua)||/Macintosh/.test(ua)&&navigator.maxTouchPoints>1?'tablet':/Mobi|iPhone|Android/i.test(ua)?'mobile':'desktop',
      language:(navigator.language || '').slice(0,12),ref_host:''};
    ['source','medium','campaign','content','term'].forEach(function(k) { var v=utm['utm_'+k] || '';context[k]=/@|[0-9]{9}/.test(v)?'':v.slice(0,100); });
    try { context.ref_host = new URL(document.referrer).hostname; } catch (_) {}
    var core;
    try { core=root.AnalyticsCore.create(Object.assign({},cfg,connection,{internal:internal,context:context,localStorage:local,sessionStorage:store,fetch:root.fetch.bind(root),setTimeout:root.setTimeout.bind(root)})); }
    catch (_) { return; }
    var last=Date.now(), activity=last, active=0, cards=[], seen={}, scrolls={}, lastFlush=last, lcp=null, errors=0, sessionTouch=last;
    function page() { if (core.renew()) {seen={};scrolls={};active=0;cards.forEach(function(c){c.ms=0;c.visibleMs=0;c.slideMs=0;});core.emit('page_view');} }
    page();
    function visible(el) {
      var b=el.getBoundingClientRect(), h=Math.max(0,Math.min(b.bottom,innerHeight)-Math.max(0,b.top));
      return b.width>0 && b.height>0 && h >= Math.min(b.height,innerHeight)*0.5 && b.right>0 && b.left<innerWidth;
    }
    function slide(el) {
      var images=Array.from(el.querySelectorAll('.card__img img')), i=images.findIndex(function(n){return n.classList.contains('ativo');});
      return images.length ? (i<0?1:i+1) : null;
    }
    function discover() { cards=Array.from(document.querySelectorAll('.card[data-id]')).map(function(el) {return {el:el,id:el.dataset.id,ms:0,visibleMs:0,slideMs:0,slide:slide(el)};}); }
    function sample() {
      var now=Date.now(), dt=Math.min(1000,Math.max(0,Math.min(now,activity+cfg.idleMs)-last));last=now;
      if (document.hidden) return;
      active+=dt;
      cards.forEach(function(c) {
        var isVisible=visible(c.el), s=slide(c.el);
        if (!isVisible || !dt) {c.visibleMs=0;c.slideMs=0;return;}
        c.ms+=dt;c.visibleMs+=dt;
        if (s!==c.slide) {c.slide=s;c.slideMs=0;} else c.slideMs+=dt;
        if (c.visibleMs>=cfg.exposureMs && !seen[c.id]) {seen[c.id]=true;core.emit('card_view',{card:c.id});}
        var k=c.id+':'+s;
        if (s && c.slideMs>=cfg.exposureMs && !seen[k]) {seen[k]=true;core.emit('slide_view',{card:c.id,slide:s});}
      });
      if (now-lastFlush>=cfg.heartbeatMs) flush();
    }
    function flush() {
      lastFlush=Date.now();
      if (active>0) {core.emit('heartbeat',{active_ms:Math.min(cfg.heartbeatMs,Math.round(active))});active=0;}
      cards.forEach(function(c){if(c.ms>0){core.emit('card_time',{card:c.id,active_ms:Math.min(cfg.heartbeatMs,Math.round(c.ms))});c.ms=0;}});
      core.flush();
    }
    function interact() { sample();var n=Date.now();if(n-sessionTouch>=1000){page();sessionTouch=n;}activity=n;last=n; }
    ['pointerdown','keydown','touchstart'].forEach(function(n){document.addEventListener(n,interact,{passive:true,capture:true});});
    var scrollScheduled=false;
    window.addEventListener('scroll',function(){
      interact();if(scrollScheduled)return;scrollScheduled=true;
      requestAnimationFrame(function(){scrollScheduled=false;var h=document.documentElement.scrollHeight-innerHeight;
        var pct=h>0?Math.min(100,Math.round(scrollY/h*100)):0;
        [25,50,75,100].forEach(function(p){if(pct>=p&&!scrolls[p]){scrolls[p]=true;core.emit('scroll',{scroll_pct:p});}});
      });
    },{passive:true});
    document.addEventListener('click',function(ev){
      var a=ev.target.closest && ev.target.closest('a[href]');
      if(!a || a.getAttribute('aria-disabled')==='true' || !/^https?:/.test(a.href))return;
      interact();
      var id=a.dataset.id || null, destination=null, route=null;
      try { destination=new URL(a.href);if(destination.origin===location.origin && id==='insomnio')route=cfg.journeyRoutes[destination.pathname] || null; } catch (_) {}
      var eventId=core.emit('link_click',{card:id,slide:slide(a),detail:{transitioning:!!a.querySelector('.card__img .saindo'),journey:route}});
      if(route){destination.searchParams.set('aq_bio',eventId);destination.searchParams.delete('aq_flow');destination.searchParams.set('aq_i',internal?'1':'0');a.href=destination.href;}
      flush();
    },true);
    document.addEventListener('visibilitychange',function(){sample();flush();last=Date.now();if(!document.hidden){page();activity=last;}});
    window.addEventListener('pagehide',function(){sample();flush();});
    window.addEventListener('pageshow',function(ev){if(ev.persisted){last=activity=Date.now();page();}});
    window.addEventListener('online',function(){core.flush();});
    document.addEventListener('pagina:pronta',discover); discover();
    function reportError(kind) { if(errors++<3)core.emit('error',{detail:{kind:kind}}); }
    window.addEventListener('error',function(ev){reportError(ev.target && ev.target!==window?'resource':'script');},true);
    window.addEventListener('unhandledrejection',function(){reportError('promise');});
    try { var observer=new PerformanceObserver(function(list){list.getEntries().forEach(function(e){lcp=Math.round(e.startTime);});});observer.observe({type:'largest-contentful-paint',buffered:true}); } catch (_) {}
    function performanceEvent(){setTimeout(function(){var n=performance.getEntriesByType('navigation')[0];var d={};if(n&&n.loadEventEnd)d.load_ms=Math.round(n.loadEventEnd);if(lcp!==null)d.lcp_ms=lcp;core.emit('performance',{detail:d});core.flush();},1000);}
    if(document.readyState==='complete')performanceEvent();else window.addEventListener('load',performanceEvent,{once:true});
    setInterval(sample,1000);core.flush();
    root.BioAnalytics.diagnostics=core.diagnostics;
  }
  root.BioAnalytics={iniciar:iniciar};
})(window);
