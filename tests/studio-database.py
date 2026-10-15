import os,json,uuid,datetime,subprocess,pathlib
P='/usr/local/opt/postgresql@16/bin/psql'
def sql(q,ok=True):
 r=subprocess.run([P,'-h','127.0.0.1','-p','55439','-U','postgres','-At','-v','ON_ERROR_STOP=1','-c',q],capture_output=True,text=True)
 if ok and r.returncode:raise AssertionError(r.stderr)
 if not ok:assert r.returncode,'Expected denied query'
 return r.stdout.strip()
owner="set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);"
def report(args="'bio',7,false"):return json.loads(sql(owner+'select public.analytics_studio_report('+args+')').splitlines()[-1])
sql("create or replace function public.painel_config(text default 'pt') returns jsonb language sql as $$select '{\"passos\":{}}'::jsonb$$;create or replace function public.painel_funil(date default null,date default null,boolean default false) returns jsonb language sql as $$select jsonb_build_object('periodo',jsonb_build_object('desde',$1,'internos',$3),'funil','[]'::jsonb)$$;create or replace function public.painel_agora(boolean default false,text default 'pt') returns jsonb language sql as $$select '{\"pessoas\":[],\"janela_min\":10}'::jsonb$$;")
# The module migration must be applied to the disposable local database first.
now=datetime.datetime.now(datetime.timezone.utc);sid=str(uuid.uuid4());pid=str(uuid.uuid4());internal_pid=str(uuid.uuid4())
def e(name,**kwargs):return dict(dict(v=1,site='bio',event_id=str(uuid.uuid4()),session_id=sid,page_id=pid,at=now.isoformat(),internal=False,context={'path':'/','source':'studio-test','browser':'Safari','device':'mobile','release':'studio-synthetic'},name=name),**kwargs)
events=[e('page_view'),e('heartbeat',active_ms=15000),e('card_view',card='insomnio'),e('link_click',card='insomnio'),e('page_view',internal=True,session_id=str(uuid.uuid4()),page_id=internal_pid),e('page_view',session_id=str(uuid.uuid4()),page_id=str(uuid.uuid4()),at=(now-datetime.timedelta(minutes=10)).isoformat()),e('page_view',session_id=str(uuid.uuid4()),page_id=str(uuid.uuid4()),at=(now+datetime.timedelta(minutes=1)).isoformat())]
try:
 sql("set role anon;select public.analytics_ingest('"+json.dumps(events).replace("'","''")+"'::jsonb)")
 sql('set role anon;select public.analytics_studio_report()',False)
 sql("set role authenticated;select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);select public.analytics_studio_report()",False)
 for args in ["'bio',0,false","'bio',91,false","'unknown',7,false","'insomnia',7,false,'studio-test'"]:sql(owner+'select public.analytics_studio_report('+args+')',False)
 d=report("'bio',7,false,'studio-test','mobile','Safari'");assert d['live']['active_sessions']==1 and d['live']['views_5m']==1 and d['live']['clicks_5m']==1
 assert len(d['live']['events'])==3 and d['bio']['current']['views']==2
 assert 'session_id' not in json.dumps(d['live']) and 'page_id' not in json.dumps(d['live'])
 assert report("'bio',7,true,'studio-test'")['live']['active_sessions']==2
 assert report("'bio',7,false,'another-source'")['live']['active_sessions']==0
 assert report("'bio',7,false,'studio-test','desktop'")['live']['views_5m']==0
 q=report("'insomnia',14,false");assert q['funnel']['data']['periodo']['desde'] is not None
 assert sql('select count(*) from analytics_private.viewers')=='1'
 print('PASS: viewer-only report, bad ranges/modules, filter scope, fresh activity, delayed/future exclusion, internal isolation, no session identifiers, unchanged legacy adapter arguments.')
finally:
 sql("delete from analytics_private.events where page_id in (select id from analytics_private.pages where context->>'release'='studio-synthetic');delete from analytics_private.pages where context->>'release'='studio-synthetic';delete from analytics_private.sessions s where not exists(select 1 from analytics_private.pages p where p.site_id=s.site_id and p.session_id=s.id)")
