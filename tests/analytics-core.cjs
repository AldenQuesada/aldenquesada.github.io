const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const ctx={window:{crypto:crypto.webcrypto},Uint8Array,Set,Date};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../js/analytics/core.js','utf8'),ctx);
(async()=>{
 let now=Date.now(), requests=[],fail=true,timers=[];const local=storage(),session=storage();
 const cfg={clock:()=>now,site:'bio',url:'https://example.test',anon:'public',context:{path:'/'},internal:false,sessionMs:1800000,queueMax:120,localStorage:local,sessionStorage:session,setTimeout:f=>{timers.push(f);return 1;},fetch:async(url,o)=>{requests.push(JSON.parse(o.body).p_batch);return {ok:!fail,status:503,json:async()=>({accepted:requests.at(-1).length})};}};
 let c=ctx.window.AnalyticsCore.create(cfg);assert.equal(c.renew(),true);const page=c.diagnostics().page;assert.equal(c.renew(),false);c.emit('page_view');await c.flush();assert.equal(c.diagnostics().pending,1);const id=requests[0][0].event_id;
 fail=false;await c.flush();assert.equal(requests[1][0].event_id,id);assert.equal(c.diagnostics().pending,0);
 const d=ctx.window.AnalyticsCore.create({...cfg,sessionStorage:storage()});d.renew();d.emit('page_view');await d.flush();assert.equal(requests.at(-1)[0].session_id,requests[0][0].session_id);assert.notEqual(d.diagnostics().page,page);
 now+=1800001;assert.equal(c.renew(),true);c.emit('page_view');await c.flush();assert.notEqual(requests.at(-1)[0].session_id,requests[0][0].session_id);
 const internal=ctx.window.AnalyticsCore.create({...cfg,internal:true,sessionStorage:storage()});internal.renew();internal.emit('page_view');await internal.flush();assert.notEqual(requests.at(-1)[0].session_id,requests.at(-2)[0].session_id);
 fail=true;c.emit('heartbeat',{active_ms:15000});await c.flush();const recovered=ctx.window.AnalyticsCore.create(cfg);assert.equal(recovered.diagnostics().pending,1);
 fail=false;await recovered.flush();assert.equal(recovered.diagnostics().pending,0);
 for(let i=0;i<130;i++)recovered.emit('scroll',{scroll_pct:25});assert.equal(recovered.diagnostics().pending,120);assert.equal(recovered.diagnostics().dropped,10);await recovered.flush();assert.equal(requests.at(-1).length,20);
 now+=24*3600000;const expired=ctx.window.AnalyticsCore.create(cfg);assert.equal(expired.diagnostics().pending,0);
 console.log('PASS: retry idempotency, acknowledgement, tab continuity, page identity, expiry, internal isolation, offline recovery, queue limit, batch limit and TTL');
})().catch(e=>{console.error(e);process.exit(1)});
