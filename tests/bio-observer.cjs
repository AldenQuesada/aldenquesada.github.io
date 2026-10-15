const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function simulate({dnt=false,hidden=false}={}){
 let now=0,events=[],handlers={},interval;const images=[0,1,2].map((x)=>({classList:{contains:()=>x===current}}));let current=0;
 const card={dataset:{id:'diabetes-es'},getBoundingClientRect:()=>({top:0,bottom:200,height:200,width:300,left:0,right:300}),querySelectorAll:()=>images,querySelector:()=>null,getAttribute:()=>null,href:'https://example.com'};
 const doc={hidden,readyState:'loading',referrer:'https://instagram.com/?private=yes',documentElement:{scrollHeight:2000},querySelectorAll:()=>[card],addEventListener:(k,f)=>{(handlers[k]??=[]).push(f);}};
 let renewed=false;const core={renew:()=>{if(!renewed){renewed=true;return true;}return false;},emit:(n,p)=>events.push({name:n,...p}),flush:()=>Promise.resolve(),diagnostics:()=>({})};
 const window={BIO_ANALYTICS_CONFIG:{site:'bio',idleMs:30000,heartbeatMs:15000,exposureMs:1000,internalKey:'internal',optoutKey:'optout'},AnalyticsCore:{create:()=>core},fetch:()=>{},setTimeout:()=>{},addEventListener:doc.addEventListener,UTM:{rastro:{}}};
 const c={window,document:doc,navigator:{doNotTrack:dnt?'1':'0',userAgent:'iPhone Safari',language:'es'},location:{search:'',hostname:'example.com',pathname:'/'},innerWidth:390,innerHeight:844,scrollY:0,URL,URLSearchParams,Date:{now:()=>now},setInterval:f=>{interval=f;},setTimeout:()=>{},requestAnimationFrame:f=>f(),performance:{getEntriesByType:()=>[]}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../js/analytics/bio.js','utf8'),c);window.BioAnalytics.iniciar({url:'https://local.test',anon:'public'});
 return {events,step(n){for(let i=0;i<n;i++){now+=1000;interval?.();}},setSlide(n){current=n;},fire(k,ev={}){(handlers[k]||[]).forEach(f=>f(ev));},doc,card};
}
let s=simulate();s.step(2);assert.equal(s.events.filter(e=>e.name==='card_view').length,1);s.setSlide(1);s.step(3);assert.equal(s.events.find(e=>e.name==='slide_view'&&e.slide===2).card,'diabetes-es');assert.equal(s.events.filter(e=>e.name==='link_click').length,0);
s.fire('click',{target:{closest:()=>s.card}});assert.equal(s.events.find(e=>e.name==='link_click').slide,2);s.step(60);assert.ok(s.events.filter(e=>e.name==='heartbeat').reduce((n,e)=>n+e.active_ms,0)<=35000);
const before=s.events.length;s.doc.hidden=true;s.step(30);assert.equal(s.events.length,before);
assert.equal(simulate({dnt:true}).events.length,0);
console.log('PASS: passive exposure, mockup association, autoplay is not a click, idle cap, hidden tab, Do Not Track');
