-- Stage 1: authenticated read models only. No public renderer or collector changes.
create index if not exists analytics_events_occurred on analytics_private.events(occurred_at desc);

create function analytics_private.studio_live(p_internal boolean default false,
 p_source text default null,p_device text default null,p_browser text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from analytics_private.viewers where user_id=auth.uid()) then
  raise exception 'Panel access not authorized' using errcode='42501'; end if;
 with recent as (
  select e.name,e.occurred_at,e.received_at,e.card_id,e.slide,e.active_ms,p.session_id,p.context
  from analytics_private.events e join analytics_private.pages p on p.id=e.page_id
  join analytics_private.sessions s on s.site_id=p.site_id and s.id=p.session_id
  where p.site_id='bio' and e.occurred_at between now()-interval '5 minutes' and now()
   and (p_internal or not s.internal)
   and (p_source is null or coalesce(nullif(p.context->>'source',''),'(sem origem)')=p_source)
   and (p_device is null or p.context->>'device'=p_device)
   and (p_browser is null or p.context->>'browser'=p_browser)
 ), activity as (
  select * from recent where name in ('page_view','link_click','scroll','card_view')
   or (name='heartbeat' and active_ms>0)
 ), feed as (
  select name,occurred_at,received_at,card_id,slide,context->>'browser' browser,
   context->>'device' device,coalesce(nullif(context->>'source',''),'(sem origem)') source
  from recent where name in ('page_view','link_click','card_view','error')
  order by occurred_at desc limit 12
 )
 select jsonb_build_object('window_seconds',60,'feed_minutes',5,
  'active_sessions',(select count(distinct session_id) from activity where occurred_at>=now()-interval '60 seconds'),
  'views_5m',(select count(*) from recent where name='page_view'),
  'clicks_5m',(select count(*) from recent where name='link_click'),
  'events',coalesce((select jsonb_agg(to_jsonb(f) order by occurred_at desc) from feed f),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function analytics_private.studio_live(boolean,text,text,text) from public,anon;
grant execute on function analytics_private.studio_live(boolean,text,text,text) to authenticated,service_role;

create function analytics_private.studio_report(p_module text default 'bio',p_days integer default 7,
 p_internal boolean default false,p_source text default null,p_device text default null,p_browser text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
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
end $$;
revoke all on function analytics_private.studio_report(text,integer,boolean,text,text,text) from public,anon;
grant execute on function analytics_private.studio_report(text,integer,boolean,text,text,text) to authenticated,service_role;
create function public.analytics_studio_report(p_module text default 'bio',p_days integer default 7,
 p_internal boolean default false,p_source text default null,p_device text default null,p_browser text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select analytics_private.studio_report(p_module,p_days,p_internal,p_source,p_device,p_browser)
$$;
revoke all on function public.analytics_studio_report(text,integer,boolean,text,text,text) from public,anon;
grant execute on function public.analytics_studio_report(text,integer,boolean,text,text,text) to authenticated,service_role;
