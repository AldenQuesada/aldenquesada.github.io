/* Collection transport only: no DOM, rendering, cookies or advertising SDKs. */
(function (root) {
  'use strict';
  function uuid() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    var b = new Uint8Array(16);
    if (!root.crypto || !root.crypto.getRandomValues) throw new Error('Secure randomness unavailable');
    root.crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.from(b, function (v) { return v.toString(16).padStart(2, '0'); }).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }
  function read(storage, key, fallback) { try { return JSON.parse(storage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function write(storage, key, value) { try { storage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function create(cfg) {
    var clock = cfg.clock || Date.now, session = null, page = '', busy = false, retry = null, failures = 0;
    var local = cfg.localStorage, store = cfg.sessionStorage, key = 'instituto_analytics_session_v1';
    var queueKey = 'instituto_analytics_queue_v1_' + cfg.site;
    var queue = read(store, queueKey, []).filter(function(e) { return e && clock()-Date.parse(e.at)<23*3600000; });
    var dropped = 0;
    function persist() { write(store, queueKey, queue); }
    function renew() {
      var saved = read(local, key, null), previous = session && session.id;
      if (saved && saved.internal === cfg.internal && clock()-saved.last < cfg.sessionMs && clock() >= saved.last) session = saved;
      else if (!session || clock()-session.last >= cfg.sessionMs || session.internal !== cfg.internal) session = {id:uuid(),last:clock(),internal:cfg.internal};
      session.last = clock(); write(local, key, session);
      var changed = !page || previous !== session.id;
      if (changed) page = uuid();
      return changed;
    }
    function emit(name, props) {
      if (!session) renew();
      var e = Object.assign({}, props || {}, {v:1,site:cfg.site,event_id:uuid(),session_id:session.id,page_id:page,
        at:new Date(clock()).toISOString(),internal:cfg.internal,context:cfg.context,name:name});
      if (queue.length >= cfg.queueMax) { queue.shift(); dropped++; }
      queue.push(e); persist(); return e.event_id;
    }
    function flush() {
      if (busy || !queue.length) return Promise.resolve(false);
      queue = queue.filter(function(e) { return clock()-Date.parse(e.at)<23*3600000; });
      if (!queue.length) { persist(); return Promise.resolve(false); }
      var batch = queue.slice(0,20); busy = true;
      return Promise.resolve().then(function() { return cfg.fetch(cfg.url+'/rest/v1/rpc/analytics_ingest', {
        method:'POST', keepalive:true, headers:{apikey:cfg.anon,Authorization:'Bearer '+cfg.anon,'Content-Type':'application/json'},
        body:JSON.stringify({p_batch:batch})
      }); }).then(function(r) {
        if (!r.ok) throw new Error('HTTP '+r.status);
        return r.json();
      }).then(function(result) {
        if (result.accepted !== batch.length) throw new Error('Incomplete acknowledgement');
        var ids = new Set(batch.map(function(e) { return e.event_id; }));
        queue = queue.filter(function(e) { return !ids.has(e.event_id); }); persist(); failures = 0;
        return true;
      }).catch(function() { failures++; return false; }).then(function(ok) {
        busy = false;
        if (queue.length && !retry) retry = cfg.setTimeout(function() { retry=null; flush(); },ok?100:Math.min(30000,1000*Math.pow(2,Math.min(failures,5))));
        return ok;
      });
    }
    return {renew:renew,emit:emit,flush:flush,diagnostics:function() {return {pending:queue.length,failures:failures,dropped:dropped,page:page};}};
  }
  root.AnalyticsCore = {create:create};
})(window);
