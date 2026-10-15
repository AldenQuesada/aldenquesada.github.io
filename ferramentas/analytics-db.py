#!/usr/bin/env python3
"""Scoped module deployment/backup. Credentials stay in memory; no application rows printed."""
import argparse,os,json,hashlib,pathlib,subprocess,urllib.request,datetime
p=argparse.ArgumentParser();p.add_argument('action',choices=['migrate','backup','status']);p.add_argument('--project',required=True);p.add_argument('--keychain');p.add_argument('--output',type=pathlib.Path);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
token=os.environ.get('SUPABASE_ACCESS_TOKEN','')
if a.keychain:token=subprocess.run(['security','find-generic-password','-s',a.keychain,'-w'],capture_output=True,text=True,check=True).stdout.strip()
if not token:raise SystemExit('Set SUPABASE_ACCESS_TOKEN or choose the existing Keychain service with --keychain.')
if len(a.project)!=20 or not a.project.isalpha():raise SystemExit('Invalid project reference')
def request(path,body=None,key=None):
 headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}
 if key:headers['Idempotency-Key']=key
 req=urllib.request.Request('https://api.supabase.com/v1/projects/'+a.project+path,data=json.dumps(body).encode() if body else None,headers=headers,method='POST' if body else 'GET')
 with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)
def query(q):return request('/database/query',{'query':q,'read_only':True})
if a.action=='status':
 print(json.dumps(query("select now() checked_at,to_regnamespace('analytics_private') is not null installed")))
elif a.action=='migrate':
 existing=request('/database/migrations');existing=existing if isinstance(existing,list) else existing.get('migrations',[])
 for f in sorted((root/'supabase/migrations').glob('*_bio_analytics_*.sql')):
  version,name=f.stem.split('_',1)
  recorded=next((m for m in existing if m.get('name')==name),None)
  if recorded:
   if recorded['version']!=version:f.rename(f.with_name(recorded['version']+'_'+name+'.sql'))
   print(name+': already recorded');continue
  result=request('/database/migrations',{'query':f.read_text(),'name':name},hashlib.sha256(f.read_bytes()).hexdigest())
  # Management API assigns its own version. Adopt that authoritative version,
  # preserving CLI-generated migration creation and avoiding future CLI drift.
  after=request('/database/migrations');after=after if isinstance(after,list) else after.get('migrations',[])
  deployed=next(m for m in after if m.get('name')==name)
  if deployed['version']!=version:f.rename(f.with_name(deployed['version']+'_'+name+'.sql'))
  print(json.dumps({'name':name,'version':deployed['version'],'applied':True}))
elif a.action=='backup':
 if not a.output:raise SystemExit('--output directory required')
 a.output.mkdir(parents=True,exist_ok=False);os.chmod(a.output,0o700)
 # One database snapshot, with bounded scope. Suitable for this low-volume site;
 # use pg_dump for high-volume installations rather than removing this limit.
 q="select jsonb_build_object('at',now(),'sites',(select coalesce(jsonb_agg(t),'[]') from analytics_private.sites t),'viewers',(select coalesce(jsonb_agg(t),'[]') from analytics_private.viewers t),'sessions',(select coalesce(jsonb_agg(t),'[]') from analytics_private.sessions t),'pages',(select coalesce(jsonb_agg(t),'[]') from analytics_private.pages t),'events',(select coalesce(jsonb_agg(t),'[]') from analytics_private.events t)) snapshot"
 count=query('select count(*) count from analytics_private.events')[0]['count']
 if count>100000:raise SystemExit('Use pg_dump: module exceeds the small-site snapshot limit.')
 snapshot=query(q)[0]['snapshot'];(a.output/'data.json').write_text(json.dumps(snapshot,ensure_ascii=False));os.chmod(a.output/'data.json',0o600)
 schema='\n'.join(f.read_text() for f in sorted((root/'supabase/migrations').glob('*_bio_analytics_*.sql')))
 (a.output/'schema.sql').write_text(schema);(a.output/'manifest.json').write_text(json.dumps({'project':a.project,'events':count,'schema_sha256':hashlib.sha256(schema.encode()).hexdigest(),'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}))
 print(json.dumps({'backup':str(a.output),'events':count,'scope':'analytics_private and its constrained API wrappers'}))
