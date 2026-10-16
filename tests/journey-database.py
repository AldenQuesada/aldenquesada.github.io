"""Transactional synthetic journeys on localhost only. Never writes hosted records."""
import subprocess,json,uuid,datetime,pathlib
P='/usr/local/opt/postgresql@16/bin/psql';q=lambda s:"'"+str(s).replace("'","''")+"'";uid=lambda:str(uuid.uuid4())
now=datetime.datetime.now(datetime.timezone.utc);old=now-datetime.timedelta(hours=2);recent=now-datetime.timedelta(minutes=3);quiz='1b52c0b8-17c1-40fe-8a88-f832b6f88d4d';source='journey-synthetic';ids=[]
sql=['begin;',"update analytics_private.sites set config=jsonb_set(config,'{journey_since}',to_jsonb((now()-interval '2 days')::text)) where id='bio';"]
def event(pid,name,t,card=None,detail={}):
 eid=uid();ids.append(eid);sql.append(f"insert into analytics_private.events(id,page_id,name,occurred_at,card_id,detail) values({q(eid)},{q(pid)},{q(name)},{q(t.isoformat())},{q(card) if card else 'null'},{q(json.dumps(detail))});");return eid
def bio(t,clicked=False,internal=False,release='bio-journey-1',device='mobile'):
 sid=uid();pid=uid();sql.append(f"insert into analytics_private.sessions values('bio',{q(sid)},{str(internal).lower()},{q(t.isoformat())},{q(t.isoformat())});insert into analytics_private.pages values({q(pid)},'bio',{q(sid)},{q(t.isoformat())},{q(json.dumps(dict(source=source,release=release,browser='Safari',device=device)))});")
 event(pid,'page_view',t);eid=event(pid,'link_click',t+datetime.timedelta(seconds=2),'insomnio',{'journey':'sales'}) if clicked else None;return pid,eid

def qe(kind,t,j=None,page=None,bio=None,internal=False,route='sales',sid=None,extra={},passo=None):
 j=j or uid();page=page or uid();sid=sid or 'synthetic-'+j;meta={**extra,'aq':dict(v=1,id=j,page=page,bio=bio,route=route,internal=internal),'interno':internal}
 sql.append(f"insert into public.quiz_events(quiz_id,session_id,tipo,metadata,passo,created_at) values({q(quiz)},{q(sid)},{q(kind)},{q(json.dumps(meta))},{passo if passo is not None else 'null'},{q(t.isoformat())});");return j,page,sid
# A completed; repeat clicks, repeated arrivals and events do not duplicate sessions.
pa,ea=bio(old,True);ja,pga,sa=qe('tsl_view',old+datetime.timedelta(seconds=4),bio=ea)
qe('tsl_view',old+datetime.timedelta(seconds=5),ja,pga,ea);qe('tsl_click',old+datetime.timedelta(seconds=6),ja,pga,ea,extra={'botao':'barra'});qe('tsl_scroll',old+datetime.timedelta(seconds=7),ja,pga,ea,extra={'pct':75})
ea2=event(pa,'link_click',old+datetime.timedelta(seconds=9),'insomnio',{'journey':'sales'});qe('tsl_view',old+datetime.timedelta(seconds=10),ja,pga,ea2)
# B old no click; C old click without arrival; D recent arrival but no checkout; E wrong token ignored; F recent no click.
bio(old);bio(old,True);pd,ed=bio(recent,True);jd,pgd,_=qe('tsl_view',recent+datetime.timedelta(seconds=4),bio=ed);qe('tsl_bloco',recent+datetime.timedelta(seconds=5),jd,pgd,ed,extra={'bloco':'oferta'})
bio(old,True);qe('tsl_view',old+datetime.timedelta(seconds=4),bio=uid());bio(recent)
# G cached release excluded. H internal hidden; I other device excluded by filters.
bio(old,True,release='bio-analytics-1');pi,ei=bio(old,True,internal=True);qe('tsl_view',old+datetime.timedelta(seconds=4),bio=ei,internal=True);bio(old,device='desktop')
# Orphan click cannot become a sales stage; stale legacy session matching cannot join.
qe('tsl_click',old+datetime.timedelta(seconds=8),bio=ed);qe('tsl_view',old+datetime.timedelta(days=2),bio=ed)
# Q1 complete, true server submit; duplicate answers; explicit journey into sales, no health values projected.
j,p,s=qe('page_view',old,route='quiz');
for kind,sec,extra in [('start',1,{}),('answer',2,{'pergunta':'q1a','valor':'private sentinel'}),('answer',3,{'pergunta':'q1a'}),('contact',4,{})]:qe(kind,old+datetime.timedelta(seconds=sec),j,p,route='quiz',sid=s,extra=extra,passo=0)
sql.append(f"insert into public.quiz_events(quiz_id,session_id,tipo,created_at) values({q(quiz)},{q(s)},'submit',{q((old+datetime.timedelta(seconds=5)).isoformat())});")
qe('cta_resultado',old+datetime.timedelta(seconds=6),j,p,route='quiz',sid=s);p2=uid();qe('tsl_view',old+datetime.timedelta(seconds=7),j,p2);qe('tsl_click',old+datetime.timedelta(seconds=8),j,p2,extra={'botao':'oferta'})
# Q2 stopped on first question, Q3 offer before result/CTA must not advance.
j,p,s=qe('page_view',old,route='quiz');qe('start',old+datetime.timedelta(seconds=1),j,p,route='quiz');qe('answer',old+datetime.timedelta(seconds=2),j,p,route='quiz',extra={'pergunta':'q1a'},passo=0)
j,p,s=qe('page_view',old,route='quiz');qe('tsl_view',old+datetime.timedelta(seconds=1),j,uid())
owner="set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);"
sql += [owner, f"select analytics_private.journey_report(7,false,{q(source)},'mobile','Safari');", "select analytics_private.journey_report(7,false);",f"select analytics_private.journey_report(7,true,{q(source)},'mobile','Safari');",f"select public.analytics_studio_report('journey',7,false,{q(source)},'mobile','Safari');",'rollback;']
r=subprocess.run([P,'-h','127.0.0.1','-p','55439','-U','postgres','-At','-v','ON_ERROR_STOP=1'],input='\n'.join(sql),capture_output=True,text=True);assert r.returncode==0,r.stderr
rows=[json.loads(x) for x in r.stdout.splitlines() if x.startswith('{')];b=rows[0]['bio'];
assert [s['n'] for s in b['steps']]==[6,4,2,1]
assert [s['stopped'] for s in b['steps']]==[1,2,0,0]
assert [s['pending'] for s in b['steps']]==[1,0,1,0]
assert b['clicks']==5 and b['linked_clicks']==3
for row in rows[:3]:
 for route in ['bio','quiz']:
  steps=row[route]['steps'];assert all(steps[i]['n']>=steps[i+1]['n'] for i in range(len(steps)-1))
  for s in steps[:-1]:assert s['n']==s['advanced']+s['pending']+s['stopped']
assert rows[0]['quiz']['steps']==[] and rows[0]['quiz']['bio_filter_only']
assert [s['n'] for s in rows[1]['quiz']['steps']]==[3,2,1,1,1,1,1]
assert rows[1]['quiz']['answers'][0]['n']==2 and rows[1]['quiz']['answers'][0]['stopped']==1
assert rows[2]['bio']['steps'][0]['n']==7
assert rows[3]['module']=='journey' and 'bio' in rows[3] and 'journey' in rows[3]
assert 'private sentinel' not in json.dumps(rows) and all(x not in json.dumps(rows) for x in ids)
for statement in ['set role anon;select public.analytics_studio_report(\'journey\');',"set role authenticated;select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);select public.analytics_studio_report('journey');",owner+"select analytics_private.journey_report(0);"]:
 r=subprocess.run([P,'-h','127.0.0.1','-p','55439','-U','postgres','-At','-v','ON_ERROR_STOP=1','-c',statement],capture_output=True,text=True);assert r.returncode
print('PASS: ordered transitions, exact click linkage, repeat/reload deduplication, fresh vs inactive, internal/source/device isolation, unlinked and historical exclusion, actual server completion, question positions, no identity/answers in reports, viewer-only access.')
