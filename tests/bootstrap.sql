create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
insert into auth.users values ('11111111-1111-4111-8111-111111111111','contato@aldenquesada.org',now());
create table public.quiz_events(id bigserial primary key,quiz_id uuid,session_id text,tipo text,metadata jsonb,created_at timestamptz default now());
