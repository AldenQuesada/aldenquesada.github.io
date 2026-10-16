"""Synthetic, rollback-only tests. Local PostgreSQL only; never hosted data."""
import subprocess,pathlib,json,uuid,datetime,zoneinfo
P='/usr/local/opt/postgresql@16/bin/psql';work=pathlib.Path(__file__).resolve().parents[1]
quote=lambda s:"'"+str(s).replace("'","''")+"'"
now=datetime.datetime.now(zoneinfo.ZoneInfo('America/Sao_Paulo'));day=now.replace(hour=10,minute=0,second=0,microsecond=0)-datetime.timedelta(days=1)
statements=['begin;',(work/'supabase/migrations/20261015141414_bio_analytics_dashboard.sql').read_text().split('revoke all')[0].replace('analytics_private.report(', 'analytics_private.report_baseline(',1)]
source='charts-synthetic'
def session(ms,start=day,internal=False,device='mobile',browser='Safari',view=True):
 sid=str(uuid.uuid4());pid=str(uuid.uuid4());context=json.dumps({'source':source,'device':device,'browser':browser})
 statements.append(f"insert into analytics_private.sessions values('bio',{quote(sid)},{str(internal).lower()},{quote(start.isoformat())},{quote(start.isoformat())});")
 statements.append(f"insert into analytics_private.pages values({quote(pid)},'bio',{quote(sid)},{quote(start.isoformat())},{quote(context)}::jsonb);")
 def event(name,at,active=0,card=None):
  statements.append(f"insert into analytics_private.events(id,page_id,name,occurred_at,active_ms,card_id) values({quote(uuid.uuid4())},{quote(pid)},{quote(name)},{quote(at.isoformat())},{active},{quote(card) if card else 'null'});")
 if view:event('page_view',start)
 if ms is not None:
  remaining=ms
  while True:
   part=min(remaining,15000);event('heartbeat',start+datetime.timedelta(minutes=2),part);remaining-=part
   if remaining<=0:break
 return event
for i,ms in enumerate([0,9999,10000,29999,30000,59999,60000,179999,180000]):
 start=day if i else (day-datetime.timedelta(days=1)).replace(hour=23,minute=59)
 ev=session(ms,start)
 if i==1:ev('page_view',start+datetime.timedelta(seconds=2));ev('link_click',start+datetime.timedelta(seconds=4),card='diabetes-es')
session(None);session(15000,internal=True);session(15000,device='desktop',browser='Chrome');session(15000,view=False)
session(15000,start=now+datetime.timedelta(hours=1));session(15000,start=day-datetime.timedelta(days=40))
legacy='charts-legacy-'+str(uuid.uuid4())
for kind in ['bio_view','bio_click']:
 metadata=json.dumps({'utm':{'utm_source':source},'dispositivo':'movil','id':'unmapped-old-card'})
 statements.append(f"insert into public.quiz_events(session_id,tipo,metadata,created_at) values({quote(legacy)},{quote(kind)},{quote(metadata)}::jsonb,{quote(day.isoformat())});")
statements += ["set role authenticated;select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);",
 f"select jsonb_build_object('new',analytics_private.report(7,false,{quote(source)}),'old',analytics_private.report_baseline(7,false,{quote(source)}));",
 f"select jsonb_build_object('mobile',analytics_private.report(7,false,{quote(source)},'mobile','Safari'),'internal',analytics_private.report(7,true,{quote(source)},'mobile','Safari'),'empty',analytics_private.report(7,false,'nonexistent-source'));"]
statements += ['rollback;']
r=subprocess.run([P,'-h','127.0.0.1','-p','55439','-U','postgres','-At','-v','ON_ERROR_STOP=1'],input='\n'.join(statements),capture_output=True,text=True)
assert r.returncode==0,r.stderr
rows=[json.loads(x) for x in r.stdout.splitlines() if x.startswith('{')];new=rows[0]['new'];old=rows[0]['old'];eng=new.pop('engagement');assert new==old,'Existing metrics changed'
# All-source includes one extra measured Chrome session, legacy is unmeasured.
assert eng['timed_sessions']==10 and eng['unmeasured_sessions']==2
mobile=rows[1]['mobile'];e=mobile['engagement'];assert e['timed_sessions']==9 and e['unmeasured_sessions']==1
assert [b['sessions'] for b in e['buckets']]==[2,2,2,2,1]
assert sum(d['timed_sessions'] for d in e['days'])==9
assert mobile['current']['median_active_seconds']==30
assert sum(b['sessions'] for b in eng['buckets'])==new['current']['timed_sessions']
assert rows[1]['internal']['engagement']['timed_sessions']==10
assert rows[1]['empty']['engagement']['timed_sessions']==0
assert all(d['median_active_seconds'] is None for d in rows[1]['empty']['engagement']['days'])
first=next(d for d in e['days'] if d['day']==(day-datetime.timedelta(days=1)).date().isoformat());assert first['timed_sessions']==1 and first['median_active_seconds']==0
assert 'session_id' not in json.dumps(e) and 'page_id' not in json.dumps(e)
print('PASS: all existing aggregates unchanged; exact duration boundaries; missing vs measured zero; unique sessions with repeated views; midnight cohort; source/device/browser/internal filters; future/out-of-period exclusion; aggregate-only response; transaction rolled back.')
