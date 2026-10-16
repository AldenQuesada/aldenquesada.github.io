-- Additive read model only: no event, identity, collection or permission changes.
CREATE OR REPLACE FUNCTION analytics_private.report(p_days integer DEFAULT 7, p_internal boolean DEFAULT false, p_source text DEFAULT NULL::text, p_device text DEFAULT NULL::text, p_browser text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg jsonb; zone text; from_at timestamptz; until_at timestamptz; previous_from timestamptz; result jsonb;
begin
 if not exists(select 1 from analytics_private.viewers where user_id=auth.uid()) then
   raise exception 'Panel access not authorized' using errcode='42501'; end if;
 if p_days not between 1 and 90 then raise exception 'Period must be 1..90 days' using errcode='22023'; end if;
 select config into cfg from analytics_private.sites where id='bio'; zone := cfg->>'timezone';
 until_at := now(); from_at := ((now() at time zone zone)::date-(p_days-1))::timestamp at time zone zone;
 previous_from := from_at - make_interval(days=>p_days);
 with legacy_context as (
  select distinct on(session_id) session_id, jsonb_build_object(
   'source',coalesce(metadata->'utm'->>'utm_source',''), 'campaign',coalesce(metadata->'utm'->>'utm_campaign',''),
   'device',case metadata->>'dispositivo' when 'movil' then 'mobile' when 'escritorio' then 'desktop' else metadata->>'dispositivo' end,
   'browser','unknown') context
  from public.quiz_events where tipo='bio_view' order by session_id,created_at
 ), all_events as (
  select ev.name, ev.occurred_at at, ev.received_at, 'v1:'||p.session_id sess, p.id::text page,
   s.internal, p.context, ev.card_id card, ev.slide, ev.active_ms,ev.detail,false legacy
  from analytics_private.events ev join analytics_private.pages p on p.id=ev.page_id
  join analytics_private.sessions s on s.site_id=p.site_id and s.id=p.session_id
  where p.site_id='bio' and ev.occurred_at>=previous_from and ev.occurred_at<=until_at
  union all
  select case e.tipo when 'bio_view' then 'page_view' when 'bio_click' then 'link_click' when 'bio_bloco' then 'card_view' else 'legacy_other' end,
   e.created_at,e.created_at,'legacy:'||e.session_id,e.session_id,coalesce(e.metadata->>'interno','false')='true',
   coalesce(l.context,'{}'), coalesce(nullif(e.metadata->>'id',''),e.metadata->>'bloco'),null,0,'{}',true
  from public.quiz_events e left join legacy_context l using(session_id)
  where e.tipo in ('bio_view','bio_click','bio_bloco') and e.created_at>=previous_from and e.created_at<=until_at
 ), filtered as (
  select * from all_events where (p_internal or not internal)
   and (p_source is null or coalesce(nullif(context->>'source',''),'(sem origem)')=p_source)
   and (p_device is null or context->>'device'=p_device) and (p_browser is null or context->>'browser'=p_browser)
 ), cur as (select * from filtered where at>=from_at), prev as (
  select * from filtered where at>=previous_from and at < until_at-make_interval(days=>p_days)
 ), periods as (
  select 'current' period,* from cur union all select 'previous',* from prev
 ), per_session as (
  select period,sess, bool_or(name='page_view') visited, bool_or(name='link_click') clicked,
   bool_or(name='heartbeat') timed, sum(active_ms) filter(where name='heartbeat') active_ms
  from periods group by period,sess
 ), summary as (
  select period, count(*) filter(where visited) sessions, count(*) filter(where clicked and visited) click_sessions,
   count(*) filter(where timed and visited) timed_sessions,
   round((percentile_cont(.5) within group(order by active_ms) filter(where timed and visited)/1000)::numeric,1) median_active_seconds
  from per_session group by period
 ), card_sessions as (
  select card,sess,bool_or(name='card_view') exposed,bool_or(name='link_click') clicked,
   count(*) filter(where name='link_click') clicks,sum(active_ms) filter(where name='card_time') active_ms
  from cur where card is not null group by card,sess
 ), card_stats as (
  select card,count(*) filter(where exposed) exposed_sessions,count(*) filter(where clicked) click_sessions,
   count(*) filter(where clicked and exposed) exposed_click_sessions,sum(clicks) clicks,
   round((percentile_cont(.5) within group(order by active_ms) filter(where active_ms>0)/1000)::numeric,1) median_active_seconds
  from card_sessions group by card
 ), days as (
  select g::date AS day from generate_series((from_at at time zone zone)::date,(until_at at time zone zone)::date,interval '1 day') g
 ), hourly as (select generate_series(0,23) AS hour), daily_counts as (
  select (at at time zone zone)::date AS day,count(*) filter(where name='page_view') views,
    count(distinct sess) filter(where name='page_view') sessions,count(*) filter(where name='link_click') clicks
  from cur group by 1
 ), hour_counts as (
  select extract(hour from at at time zone zone)::integer AS hour,count(*) filter(where name='page_view') views,
   count(*) filter(where name='link_click') clicks from cur group by 1
 ), timed_cohorts as (
  -- One observation per measured session, matching the existing KPI. Allocate
  -- the complete in-period duration to its first in-period visit (Brasilia).
  select sess,min(at) filter(where name='page_view') started_at,
   bool_or(name='heartbeat') timed,sum(active_ms) filter(where name='heartbeat') active_ms
  from cur where not legacy group by sess having bool_or(name='page_view')
 ), engagement_days as (
  select (started_at at time zone zone)::date AS day,count(*) sessions,
   count(*) filter(where timed) timed_sessions,
   round((percentile_cont(.5) within group(order by active_ms) filter(where timed)/1000)::numeric,1) median_active_seconds
  from timed_cohorts group by 1
 ), duration_bands(position,label,min_seconds,max_seconds) as (
  values (1,'Menos de 10 s',0,10),(2,'10 a 29 s',10,30),
   (3,'30 a 59 s',30,60),(4,'1 a 2 min 59 s',60,180),(5,'3 min ou mais',180,null::integer)
 ), sources as (
  select coalesce(nullif(context->>'source',''),'(sem origem)') source,
   coalesce(nullif(context->>'campaign',''),'(sem campanha)') campaign,
   count(distinct sess) filter(where name='page_view') sessions,count(distinct sess) filter(where name='link_click') clicking_sessions
  from cur group by 1,2
 ), browsers as (
  select coalesce(context->>'browser','unknown') browser,coalesce(context->>'device','unknown') device,
   count(distinct sess) filter(where name='page_view') sessions,count(*) filter(where name='error') errors
  from cur group by 1,2
 )
 select jsonb_build_object(
  'config',cfg,'period',jsonb_build_object('from',from_at,'to',until_at,'previous_from',previous_from,'previous_to',until_at-make_interval(days=>p_days),'days',p_days,'internal',p_internal),
  'current',coalesce((select to_jsonb(s)-'period' from summary s where period='current'),'{}') || jsonb_build_object('views',(select count(*) from cur where name='page_view'),'clicks',(select count(*) from cur where name='link_click')),
  'previous',coalesce((select to_jsonb(s)-'period' from summary s where period='previous'),'{}') || jsonb_build_object('views',(select count(*) from prev where name='page_view'),'clicks',(select count(*) from prev where name='link_click')),
  'days',(select jsonb_agg(jsonb_build_object('day',d.day,'views',coalesce(c.views,0),'sessions',coalesce(c.sessions,0),'clicks',coalesce(c.clicks,0)) order by d.day) from days d left join daily_counts c using(day)),
  'hours',(select jsonb_agg(jsonb_build_object('hour',h.hour,'views',coalesce(c.views,0),'clicks',coalesce(c.clicks,0)) order by h.hour) from hourly h left join hour_counts c using(hour)),
  'cards',(select jsonb_agg(jsonb_build_object('id',k.key,'title',k.value,'exposed_sessions',coalesce(s.exposed_sessions,0),'click_sessions',coalesce(s.click_sessions,0),'exposed_click_sessions',coalesce(s.exposed_click_sessions,0),'clicks',coalesce(s.clicks,0),'median_active_seconds',s.median_active_seconds) order by coalesce(s.clicks,0) desc,k.key) from jsonb_each_text(cfg->'cards') k left join card_stats s on s.card=k.key),
  'slides',coalesce((select jsonb_agg(to_jsonb(x)) from (select card,slide,count(distinct sess) filter(where name='slide_view') exposed_sessions,count(*) filter(where name='link_click') clicks,count(*) filter(where name='link_click' and detail->>'transitioning'='true') transition_clicks from cur where slide is not null group by card,slide order by card,slide) x),'[]'),
  'sources',coalesce((select jsonb_agg(to_jsonb(s) order by sessions desc) from sources s),'[]'),
  'browsers',coalesce((select jsonb_agg(to_jsonb(b) order by sessions desc) from browsers b),'[]'),
  'filters',jsonb_build_object('sources',(select jsonb_agg(distinct coalesce(nullif(context->>'source',''),'(sem origem)')) from all_events),'devices',(select jsonb_agg(distinct coalesce(context->>'device','unknown')) from all_events),'browsers',(select jsonb_agg(distinct coalesce(context->>'browser','unknown')) from all_events)),
  'engagement',jsonb_build_object(
   'cohort','first_visit_in_period','timed_sessions',(select count(*) from timed_cohorts where timed),
   'unmeasured_sessions',(select count(*) from per_session where period='current' and visited and not timed),
   'days',(select jsonb_agg(jsonb_build_object('day',d.day,'sessions',coalesce(e.sessions,0),
    'timed_sessions',coalesce(e.timed_sessions,0),'median_active_seconds',e.median_active_seconds) order by d.day)
    from days d left join engagement_days e using(day)),
   'buckets',(select jsonb_agg(jsonb_build_object('label',b.label,'min_seconds',b.min_seconds,'max_seconds',b.max_seconds,
    'sessions',(select count(*) from timed_cohorts t where t.timed and t.active_ms>=b.min_seconds*1000
     and (b.max_seconds is null or t.active_ms<b.max_seconds*1000))) order by b.position) from duration_bands b)),
  'quality',jsonb_build_object('legacy_views',(select count(*) from cur where legacy and name='page_view'),
   'modern_views',(select count(*) from cur where not legacy and name='page_view'),
   'modern_sessions',(select count(distinct sess) from cur where not legacy and name='page_view'),
   'errors',(select count(*) from cur where name='error'),
   'unidentified_clicks',(select count(*) from cur where name='link_click' and (card is null or not (cfg->'cards' ? card))),
   'last_received',(select max(received_at) from cur),'lcp_ms',(select percentile_cont(.5) within group(order by (detail->>'lcp_ms')::integer) from cur where name='performance' and detail ? 'lcp_ms'),
   'load_ms',(select percentile_cont(.5) within group(order by (detail->>'load_ms')::integer) from cur where name='performance' and detail ? 'load_ms'))
 ) into result;
 return result;
end $function$
;
