-- Independent analytics aggregate. No changes to quiz, CRM, content or animation.
create schema if not exists analytics_private;
revoke all on schema analytics_private from public;
grant usage on schema analytics_private to anon, authenticated, service_role;

create table analytics_private.sites (
  id text primary key, enabled boolean not null default true,
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now()
);
create table analytics_private.viewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table analytics_private.sessions (
  site_id text not null references analytics_private.sites(id), id uuid not null,
  internal boolean not null, first_at timestamptz not null, last_at timestamptz not null,
  primary key(site_id,id)
);
create table analytics_private.pages (
  id uuid primary key, site_id text not null, session_id uuid not null,
  started_at timestamptz not null, context jsonb not null,
  foreign key(site_id,session_id) references analytics_private.sessions(site_id,id)
);
create index analytics_pages_session on analytics_private.pages(site_id,session_id);
create index analytics_pages_started on analytics_private.pages(site_id,started_at);
create table analytics_private.events (
  id uuid primary key, page_id uuid not null references analytics_private.pages(id),
  name text not null check(name in ('page_view','card_view','slide_view','card_time','link_click','scroll','heartbeat','performance','error')),
  occurred_at timestamptz not null, received_at timestamptz not null default now(),
  card_id text, slide integer check(slide between 1 and 20),
  active_ms integer not null default 0 check(active_ms between 0 and 15000),
  scroll_pct integer check(scroll_pct in (25,50,75,100)),
  detail jsonb not null default '{}'
);
create index analytics_events_page_time on analytics_private.events(page_id,occurred_at);
create index analytics_events_received on analytics_private.events(received_at);
create index analytics_events_name_time on analytics_private.events(name,occurred_at);
alter table analytics_private.sites enable row level security;
alter table analytics_private.viewers enable row level security;
alter table analytics_private.sessions enable row level security;
alter table analytics_private.pages enable row level security;
alter table analytics_private.events enable row level security;
revoke all on all tables in schema analytics_private from public, anon, authenticated;
-- No direct client table grants or policies: only constrained ingestion and aggregate reads.

create function analytics_private.clean_text(v text, lim integer default 100)
returns text language sql immutable set search_path = '' as $$
 select case when v ~ '@|[0-9]{9}' then '' else left(regexp_replace(coalesce(v,''),'[[:cntrl:]]','','g'),lim) end
$$;
revoke all on function analytics_private.clean_text(text,integer) from public,anon,authenticated;

create function analytics_private.ingest(p_batch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
   detail := jsonb_build_object('transitioning',coalesce((e->'detail'->>'transitioning')::boolean,false));
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
end $$;
revoke all on function analytics_private.ingest(jsonb) from public;
grant execute on function analytics_private.ingest(jsonb) to anon,authenticated,service_role;
create function public.analytics_ingest(p_batch jsonb) returns jsonb
 language sql security invoker set search_path = '' as $$ select analytics_private.ingest(p_batch) $$;
revoke all on function public.analytics_ingest(jsonb) from public;
grant execute on function public.analytics_ingest(jsonb) to anon,authenticated,service_role;

insert into analytics_private.sites(id,config) values ('bio','{"timezone": "America/Sao_Paulo", "session_minutes": 30, "idle_seconds": 30, "exposure_ms": 1000, "retention_days": 180, "cards": {"consulta": "Agenda tu consulta", "mentoria": "Mentoría", "conferencias": "Conferencias", "diabetes-es": "Diabetes Mellitus", "fin-diabetes-es": "El fin de la Diabetes Mellitus", "mujer-delgada": "Mujer Delgada & Saludable", "insomnio": "Venciendo el Insomnio en 7 días", "contacto": "Habla con mi equipo", "canal-youtube": "Dr. Alden J. Quesada", "instagram": "Instagram", "youtube": "YouTube", "tiktok": "TikTok"}, "minimum_exposures": 30, "version": 1}'::jsonb);
-- Existing verified owner of this panel; new Auth signups get no analytics access.
insert into analytics_private.viewers(user_id) select id from auth.users where lower(email)='contato@aldenquesada.org' and email_confirmed_at is not null;
