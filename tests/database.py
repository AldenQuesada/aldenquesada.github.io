"""Integration contract against disposable local PostgreSQL only. No production data."""
import json,subprocess,uuid,datetime,os
PSQL=os.environ.get('PSQL','/usr/local/opt/postgresql@16/bin/psql')
args=[PSQL,'-h','127.0.0.1','-p','55439','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1']
def sql(q,ok=True):
 r=subprocess.run(args+['-c',q],capture_output=True,text=True)
 if ok and r.returncode:raise AssertionError(r.stderr)
 if not ok:assert r.returncode, 'Expected rejection'
 return r.stdout.strip()
def quote(x):return "'"+json.dumps(x).replace("'","''")+"'::jsonb"
def ingest(batch,ok=True):return sql('set role anon;select public.analytics_ingest('+quote(batch)+');',ok)
now=datetime.datetime.now(datetime.timezone.utc)
sess=str(uuid.uuid4());page=str(uuid.uuid4())
def event(name,**props):
 return dict(dict(v=1,site='bio',event_id=str(uuid.uuid4()),session_id=sess,page_id=page,at=now.isoformat(),internal=False,context={'path':'/','source':'test-campaign','browser':'Safari','device':'mobile','release':'synthetic-tests'},name=name),**props)
batch=[event('page_view'),event('card_view',card='diabetes-es'),event('slide_view',card='diabetes-es',slide=2),event('link_click',card='diabetes-es',slide=2),event('heartbeat',active_ms=15000),event('card_time',card='diabetes-es',active_ms=10000),event('performance',detail={'load_ms':830}),event('error',detail={'kind':'resource','message':'health-secret'})]
try:
 ingest(batch);ingest(batch)
 assert sql("select count(*) from analytics_private.events where page_id='"+page+"'")=='8'
 for bad in [event('purchase'),event('card_time',card='no-card',active_ms=10),event('heartbeat',active_ms=999999),event('page_view',v=8),event('page_view',page_id=page,session_id=str(uuid.uuid4())),event('page_view',internal=True)]:ingest([bad],False)
 sql('set role anon; select * from analytics_private.events',False)
 sql('set role anon; select public.analytics_bio_report()',False)
 sql("set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);select public.analytics_bio_report()",False)
 report=json.loads(sql("set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);select public.analytics_bio_report(7,false,'test-campaign')").splitlines()[-1])
 assert report['current']['views']==1 and report['current']['sessions']==1 and report['current']['clicks']==1
 assert report['current']['median_active_seconds']==15
 assert report['quality']['lcp_ms'] is None
 assert len(report['hours'])==24 and len(report['days'])==7
 card=next(c for c in report['cards'] if c['id']=='diabetes-es');assert card['exposed_click_sessions']==1 and card['median_active_seconds']==10
 assert 'health-secret' not in sql("select detail::text from analytics_private.events where page_id='"+page+"'")
 # Internal visit cannot enter real statistics.
 internal=event('page_view',session_id=str(uuid.uuid4()),page_id=str(uuid.uuid4()),internal=True);ingest([internal])
 r=json.loads(sql("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);select public.analytics_bio_report(7,false,'test-campaign')").splitlines()[-1]);assert r['current']['views']==1
 print('PASS: ingestion, duplicate retries, validation, private tables, unauthorized users, metrics, no-health metadata, missing performance values, internal isolation')
finally:
 sql("delete from analytics_private.events where page_id in(select id from analytics_private.pages where context->>'release'='synthetic-tests');delete from analytics_private.pages where context->>'release'='synthetic-tests';delete from analytics_private.sessions s where not exists(select 1 from analytics_private.pages p where p.site_id=s.site_id and p.session_id=s.id)")
