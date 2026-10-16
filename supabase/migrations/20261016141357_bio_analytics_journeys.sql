-- Correlated journeys are separate from all historical totals. No backfill or CRM changes.
update analytics_private.sites set config=config||jsonb_build_object(
 'journey_since',now(),'journey_quiz_slug','insonia','journey_idle_minutes',30,'journey_window_hours',24)
where id='bio';
create index if not exists quiz_events_journey on public.quiz_events((metadata->'aq'->>'id'),created_at) where metadata->'aq'->>'v'='1';
create index if not exists quiz_events_bio_handoff on public.quiz_events((metadata->'aq'->>'bio'),created_at) where metadata->'aq'->>'v'='1';

create or replace function analytics_private.journey_report(p_days integer default 7,p_internal boolean default false,
 p_source text default null,p_device text default null,p_browser text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare cfg jsonb; start_at timestamptz; since_at timestamptz; idle interval; window_size interval; quiz uuid; questions jsonb; result jsonb;
begin
 if not exists(select 1 from analytics_private.viewers where user_id=auth.uid()) then
  raise exception 'Panel access not authorized' using errcode='42501'; end if;
 if p_days is null or p_days not between 1 and 90 then raise exception 'Period must be 1..90 days' using errcode='22023';end if;
 select config into cfg from analytics_private.sites where id='bio';
 since_at:=(cfg->>'journey_since')::timestamptz;
 start_at:=greatest(since_at,((now() at time zone (cfg->>'timezone'))::date-(p_days-1))::timestamp at time zone (cfg->>'timezone'));
 idle:=make_interval(mins=>(cfg->>'journey_idle_minutes')::integer);
 window_size:=make_interval(hours=>(cfg->>'journey_window_hours')::integer);
 select id,schema->'perguntas' into quiz,questions from public.quiz_templates where slug=cfg->>'journey_quiz_slug' limit 1;
 with bp as materialized (
  select p.* from analytics_private.pages p join analytics_private.sessions s on s.site_id=p.site_id and s.id=p.session_id
  where p.site_id='bio' and (p_internal or not s.internal)
   and p.context->>'release'='bio-journey-1'
   and (p_source is null or coalesce(nullif(p.context->>'source',''),'(sem origem)')=p_source)
   and (p_device is null or p.context->>'device'=p_device)
   and (p_browser is null or p.context->>'browser'=p_browser)
   and exists(select 1 from analytics_private.events e where e.page_id=p.id and e.name='page_view' and e.occurred_at between start_at and now())
 ), be as materialized (
  select e.*,p.session_id from analytics_private.events e join bp p on p.id=e.page_id where e.occurred_at between start_at and now()
 ), bc as materialized (
  select * from be where name='link_click' and card_id='insomnio' and detail->>'journey' in ('sales','quiz')
 ), qe as materialized (
  -- Read event positions only. Personal and clinical values are never projected.
  select e.id,e.session_id,e.tipo,e.passo,e.created_at,e.metadata->'aq' aq,
   e.metadata->>'pergunta' question,e.metadata->>'bloco' block,e.metadata->>'botao' button,
   case when e.metadata->>'pct' in ('25','50','75','100') then (e.metadata->>'pct')::int end pct
  from public.quiz_events e where e.quiz_id=quiz and e.created_at between start_at and now()
   and e.metadata->'aq'->>'v'='1'
   and e.metadata->'aq'->>'id' ~ '^[0-9a-f-]{36}$' and e.metadata->'aq'->>'page' ~ '^[0-9a-f-]{36}$'
   and (p_internal or (coalesce(e.metadata->>'interno','false') not in ('true','1') and coalesce(e.metadata->'aq'->>'internal','false') not in ('true','1')))
 ), q0 as (
  select aq->>'id' id,min(created_at) arrival from qe e where tipo='page_view' and aq->>'route'='quiz'
   and ((p_source is null and p_device is null and p_browser is null) or exists(select 1 from bc where bc.id::text=e.aq->>'bio' and bc.detail->>'journey'='quiz' and e.created_at between bc.occurred_at-interval '5 minutes' and bc.occurred_at+window_size))
  group by aq->>'id'
 ), q1 as (
  select q.*,x.started from q0 q left join lateral(select min(created_at) started from qe where aq->>'id'=q.id and aq->>'route'='quiz' and tipo='start' and created_at between q.arrival and q.arrival+window_size)x on true
 ), q2 as (
  select q.*,x.contact from q1 q left join lateral(select min(created_at) contact from qe where aq->>'id'=q.id and aq->>'route'='quiz' and tipo='contact' and created_at between q.started and q.arrival+window_size)x on true
 ), q3 as (
  select q.*,x.completed from q2 q left join lateral(
   select min(e.created_at) completed from public.quiz_events e where e.quiz_id=quiz and e.tipo='submit'
    and e.created_at between q.contact and q.arrival+window_size
    and exists(select 1 from qe c where c.aq->>'id'=q.id and c.aq->>'route'='quiz' and c.tipo='contact' and c.session_id=e.session_id and c.created_at<=e.created_at)
  )x on true
 ), q4 as (
  select q.*,x.offer_click from q3 q left join lateral(select min(created_at) offer_click from qe where aq->>'id'=q.id and aq->>'route'='quiz' and tipo='cta_resultado' and created_at between q.completed and q.arrival+window_size)x on true
 ), q5 as (
  select q.*,x.offer from q4 q left join lateral(select min(created_at) offer from qe where aq->>'id'=q.id and aq->>'route'='sales' and tipo='tsl_view' and created_at between q.offer_click and q.arrival+window_size)x on true
 ), q6 as materialized (
  select q.*,x.checkout,y.last_seen from q5 q
  left join lateral(select min(created_at) checkout from qe where aq->>'id'=q.id and aq->>'route'='sales' and tipo='tsl_click' and created_at between q.offer and q.arrival+window_size)x on true
  left join lateral(select max(created_at) last_seen from qe where aq->>'id'=q.id and created_at between q.arrival and q.arrival+window_size)y on true
 ), deliveries as materialized (
  -- Explicit click token, same route, bounded time, real arrival required.
  select b.id click_id,b.session_id,b.occurred_at clicked,e.aq->>'id' journey,e.aq->>'page' page,min(e.created_at) arrived
  from bc b join qe e on e.aq->>'bio'=b.id::text and e.tipo='tsl_view' and e.aq->>'route'='sales'
   and e.created_at between b.occurred_at-interval '5 minutes' and b.occurred_at+window_size
  where b.detail->>'journey'='sales'
  group by b.id,b.session_id,b.occurred_at,e.aq->>'id',e.aq->>'page'
 ), b0 as (
  select session_id,min(occurred_at) filter(where name='page_view') arrival,max(occurred_at) last_seen,
   min(occurred_at) filter(where name='card_view' and card_id='insomnio') exposed,
   min(occurred_at) filter(where name='link_click' and card_id='insomnio' and detail->>'journey'='sales') clicked
  from be group by session_id
 ), b1 as materialized (
  select b.*,x.arrived,x.checkout,greatest(b.last_seen,x.last_seen) seen from b0 b left join lateral(
   select min(d.arrived) arrived,min(e.created_at) filter(where e.tipo='tsl_click') checkout,max(e.created_at) last_seen
   from deliveries d left join qe e on e.aq->>'id'=d.journey and e.aq->>'page'=d.page and e.aq->>'route'='sales'
    and e.created_at between d.arrived and d.clicked+window_size where d.session_id=b.session_id
  )x on true
 ), bsteps as (
  select step.key,step.label,step.ord,count(*) filter(where reached is not null) n,
   count(*) filter(where reached is not null and advanced is not null) advanced,
   count(*) filter(where reached is not null and advanced is null and seen>now()-idle and step.ord<4) pending,
   count(*) filter(where reached is not null and advanced is null and seen<=now()-idle and step.ord<4) stopped
  from b1 cross join lateral(values
   ('bio','Abriu a bio',1,arrival,clicked),('click','Clicou em Insônia',2,clicked,arrived),
   ('offer','Chegou à oferta',3,arrived,checkout),('checkout','Clicou para o checkout',4,checkout,null::timestamptz)) step(key,label,ord,reached,advanced)
  group by step.key,step.label,step.ord
 ), qsteps as (
  select step.key,step.label,step.ord,count(*) filter(where reached is not null) n,
   count(*) filter(where reached is not null and advanced is not null) advanced,
   count(*) filter(where reached is not null and advanced is null and last_seen>now()-idle and step.ord<7) pending,
   count(*) filter(where reached is not null and advanced is null and last_seen<=now()-idle and step.ord<7) stopped
  from q6 cross join lateral(values
   ('quiz','Abriu o quiz',1,arrival,started),('start','Começou o quiz',2,started,contact),('contact','Chegou ao contato',3,contact,completed),
   ('result','Concluiu o quiz',4,completed,offer_click),('result_click','Clicou para ver a oferta',5,offer_click,offer),
   ('offer','Chegou à oferta',6,offer,checkout),('checkout','Clicou para o checkout',7,checkout,null::timestamptz)) step(key,label,ord,reached,advanced)
  group by step.key,step.label,step.ord
 ), sales as materialized (
  select distinct e.* from qe e where e.aq->>'route'='sales' and (
   exists(select 1 from deliveries d where e.aq->>'id'=d.journey and e.aq->>'page'=d.page and e.created_at between d.arrived and d.clicked+window_size)
   or exists(select 1 from q6 q where e.aq->>'id'=q.id and e.created_at between q.offer and q.arrival+window_size))
 ), blocks as (
  select left(block,60) label,count(distinct aq->>'id') n from sales where tipo='tsl_bloco' and block is not null group by left(block,60)
 ), buttons as (
  select left(button,60) label,count(distinct aq->>'id') n from sales where tipo='tsl_click' and button is not null group by left(button,60)
 ), last_blocks as (
  select distinct on(aq->>'id') aq->>'id' journey,left(block,60) label from sales where tipo='tsl_bloco' and block is not null order by aq->>'id',created_at desc,id desc
 ), stopped_blocks as (
  select l.label,count(*) n from last_blocks l where not exists(select 1 from sales s where s.aq->>'id'=l.journey and s.tipo='tsl_click')
   and (select max(created_at) from sales s where s.aq->>'id'=l.journey)<=now()-idle group by l.label
 ), question_positions as (
  select value->>'id' id,row_number() over(order by ord) passo from jsonb_array_elements(coalesce(questions,'[]')) with ordinality as t(value,ord) where value->>'tipo' in ('scale','escolha')
 ), answer_events as (
  select e.aq->>'id' journey,e.created_at,e.id,qp.passo from qe e join q6 q on q.id=e.aq->>'id' join question_positions qp on qp.id=e.question
  where e.aq->>'route'='quiz' and e.tipo='answer' and e.created_at between q.started and q.arrival+window_size
 ), last_answers as (
  select distinct on(a.journey) a.journey,a.passo from answer_events a join q6 q on q.id=a.journey
  where q.contact is null and q.last_seen<=now()-idle order by a.journey,a.created_at desc,a.id desc
 ), answers as (
  select qp.passo,(select count(distinct journey) from answer_events a where a.passo=qp.passo) n,
   (select count(*) from last_answers a where a.passo=qp.passo) stopped from question_positions qp
 )
 select jsonb_build_object('since',since_at,'from',start_at,'idle_minutes',cfg->'journey_idle_minutes','window_hours',cfg->'journey_window_hours',
  'bio',jsonb_build_object('steps',coalesce((select jsonb_agg(to_jsonb(b) order by ord) from bsteps b),'[]'::jsonb),
   'exposed_sessions',(select count(*) from b1 where exposed is not null),'clicks',(select count(*) from bc where detail->>'journey'='sales'),
   'linked_clicks',(select count(distinct click_id) from deliveries)),
  'quiz',jsonb_build_object('steps',coalesce((select jsonb_agg(to_jsonb(q) order by ord) from qsteps q),'[]'::jsonb),
   'bio_filter_only',p_source is not null or p_device is not null or p_browser is not null,
   'answers',coalesce((select jsonb_agg(to_jsonb(a) order by passo) from answers a),'[]'::jsonb)),
  'sales',jsonb_build_object('journeys',(select count(distinct aq->>'id') from sales where tipo='tsl_view'),
   'blocks',coalesce((select jsonb_agg(to_jsonb(b) order by n desc,label) from blocks b),'[]'::jsonb),
   'buttons',coalesce((select jsonb_agg(to_jsonb(b) order by n desc,label) from buttons b),'[]'::jsonb),
   'last_blocks',coalesce((select jsonb_agg(to_jsonb(b) order by n desc,label) from stopped_blocks b),'[]'::jsonb),
   'scroll',(select jsonb_agg(jsonb_build_object('pct',p,'n',(select count(distinct aq->>'id') from sales where tipo='tsl_scroll' and pct>=p)) order by p) from unnest(array[25,50,75,100]) p)),
  'coverage',jsonb_build_object('unlinked_sales_views',(select count(*) from qe e where tipo='tsl_view' and not exists(select 1 from sales s where s.id=e.id)))
 ) into result;
 return result;
end $$;
revoke all on function analytics_private.journey_report(integer,boolean,text,text,text) from public,anon;
grant execute on function analytics_private.journey_report(integer,boolean,text,text,text) to authenticated,service_role;

CREATE OR REPLACE FUNCTION analytics_private.ingest(p_batch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare e jsonb; c jsonb; normalized jsonb; cfg jsonb; sid text; eid uuid; pid uuid; sess uuid;
  ts timestamptz; nm text; card text; ins integer; accepted integer := 0; added integer := 0;
  test boolean; n integer; detail jsonb;
begin
 if jsonb_typeof(p_batch) <> 'array' or jsonb_array_length(p_batch) not between 1 and 20
    or octet_length(p_batch::text) > 48000 then raise exception 'Invalid batch' using errcode='22023'; end if;
 for e in select value from jsonb_array_elements(p_batch) loop
  if e->>'v' <> '1' then raise exception 'Unsupported schema' using errcode='22023'; end if;
  sid := e->>'site';
  select config into cfg from analytics_private.sites where id=sid and enabled;
  if cfg is null then raise exception 'Unknown site' using errcode='22023'; end if;
  eid := (e->>'event_id')::uuid; pid := (e->>'page_id')::uuid; sess := (e->>'session_id')::uuid;
  ts := (e->>'at')::timestamptz; nm := e->>'name'; test := coalesce((e->>'internal')::boolean,false);
  if eid is null or pid is null or sess is null or ts is null or nm is null
     or ts < now()-interval '24 hours' or ts > now()+interval '5 minutes' then
    raise exception 'Invalid identity/time' using errcode='22023';
  end if;
  -- Stable event ID makes offline/retry and unload delivery idempotent.
  if exists(select 1 from analytics_private.events where id=eid) then
    accepted := accepted+1; continue;
  end if;
  -- Serialize one session's budget; this limits accidents, not determined bot traffic.
  perform pg_advisory_xact_lock(hashtextextended(sid||sess::text,0));
  select count(*) into n from analytics_private.events ev join analytics_private.pages p on p.id=ev.page_id
   where p.site_id=sid and p.session_id=sess and ev.received_at > now()-interval '1 minute';
  if n >= 240 then raise exception 'Session rate limit' using errcode='PT429'; end if;
  c := coalesce(e->'context','{}');
  if coalesce(c->>'path','') <> '/' then raise exception 'Unsupported page' using errcode='22023'; end if;
  normalized := jsonb_build_object('path','/',
   'source',analytics_private.clean_text(c->>'source'), 'medium',analytics_private.clean_text(c->>'medium'),
   'campaign',analytics_private.clean_text(c->>'campaign'), 'content',analytics_private.clean_text(c->>'content'),
   'term',analytics_private.clean_text(c->>'term'),
   'ref_host',case when c->>'ref_host' ~ '^[a-zA-Z0-9.-]{1,160}$' then c->>'ref_host' else '' end,
   'browser',case when c->>'browser' in ('Safari','Chrome','Firefox','Edge','Instagram','Facebook','Other') then c->>'browser' else 'Other' end,
   'device',case when c->>'device' in ('mobile','tablet','desktop') then c->>'device' else 'unknown' end,
   'language',left(regexp_replace(coalesce(c->>'language',''),'[^a-zA-Z-]','','g'),12),
   'release',analytics_private.clean_text(c->>'release',40));
  insert into analytics_private.sessions values(sid,sess,test,ts,ts)
   on conflict(site_id,id) do update set last_at=greatest(analytics_private.sessions.last_at,excluded.last_at);
  if exists(select 1 from analytics_private.sessions where site_id=sid and id=sess and internal<>test) then
    raise exception 'Session classification mismatch' using errcode='22023'; end if;
  insert into analytics_private.pages values(pid,sid,sess,ts,normalized) on conflict(id) do nothing;
  if not exists(select 1 from analytics_private.pages where id=pid and site_id=sid and session_id=sess) then
    raise exception 'Page ownership mismatch' using errcode='22023'; end if;
  card := nullif(e->>'card','');
  if card is not null and not (cfg->'cards' ? card) then raise exception 'Unknown card' using errcode='22023'; end if;
  if nm in ('card_view','slide_view','card_time') and card is null then raise exception 'Missing card' using errcode='22023'; end if;
  detail := '{}';
  if nm='performance' then
   detail := jsonb_strip_nulls(jsonb_build_object(
    'load_ms',case when e->'detail' ? 'load_ms' then least(120000,greatest(0,(e->'detail'->>'load_ms')::integer)) end,
    'lcp_ms',case when e->'detail' ? 'lcp_ms' then least(120000,greatest(0,(e->'detail'->>'lcp_ms')::integer)) end));
  elsif nm='error' then
   detail := jsonb_build_object('kind',case when e->'detail'->>'kind' in ('script','resource','promise') then e->'detail'->>'kind' else 'other' end);
  elsif nm='link_click' then
   detail := jsonb_strip_nulls(jsonb_build_object('transitioning',coalesce((e->'detail'->>'transitioning')::boolean,false),
    'journey',case when card='insomnio' and e->'detail'->>'journey' in ('sales','quiz') then e->'detail'->>'journey' end));
  end if;
  insert into analytics_private.events(id,page_id,name,occurred_at,card_id,slide,active_ms,scroll_pct,detail)
   values(eid,pid,nm,ts,card,(e->>'slide')::integer,
    case when nm in ('heartbeat','card_time') then coalesce((e->>'active_ms')::integer,0) else 0 end,
    case when nm='scroll' then (e->>'scroll_pct')::integer else null end,detail)
   on conflict(id) do nothing;
  get diagnostics ins = row_count;
  added := added+ins; accepted := accepted+1;
 end loop;
 return jsonb_build_object('accepted',accepted,'inserted',added);
end $function$
;
CREATE OR REPLACE FUNCTION analytics_private.studio_report(p_module text DEFAULT 'bio'::text, p_days integer DEFAULT 7, p_internal boolean DEFAULT false, p_source text DEFAULT NULL::text, p_device text DEFAULT NULL::text, p_browser text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb; zone text; from_date date;
begin
 if not exists(select 1 from analytics_private.viewers where user_id=auth.uid()) then
  raise exception 'Panel access not authorized' using errcode='42501'; end if;
 if p_days is null or p_days not between 1 and 90 then
  raise exception 'Period must be 1..90 days' using errcode='22023'; end if;
 select config->>'timezone' into zone from analytics_private.sites where id='bio';
 result:=jsonb_build_object('checked_at',now(),'refresh_seconds',15,'timezone',zone,'module',p_module);
 if p_module='bio' then
  return result||jsonb_build_object('bio',analytics_private.report(p_days,p_internal,p_source,p_device,p_browser),
   'live',analytics_private.studio_live(p_internal,p_source,p_device,p_browser));
 elsif p_module='journey' then
  return result||jsonb_build_object('bio',analytics_private.report(p_days,p_internal,p_source,p_device,p_browser),
   'journey',analytics_private.journey_report(p_days,p_internal,p_source,p_device,p_browser));
 elsif p_module='insomnia' then
  if p_source is not null or p_device is not null or p_browser is not null then
   raise exception 'Bio filters do not apply to the legacy quiz' using errcode='22023'; end if;
  from_date:=(now() at time zone zone)::date-(p_days-1);
  -- Legacy aggregate adapters stay isolated. No answers, contacts or session IDs are returned.
  return result||jsonb_build_object('funnel',jsonb_build_object(
   'config',public.painel_config('pt'),
   'data',public.painel_funil(from_date,null,p_internal),
   'live',public.painel_agora(p_internal,'pt')));
 else
  raise exception 'Unsupported module' using errcode='22023';
 end if;
end $function$
;
