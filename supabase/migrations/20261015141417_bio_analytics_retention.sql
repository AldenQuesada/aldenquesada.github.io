-- Retain 180 days of the new event stream. Legacy data is outside this boundary.
create function analytics_private.prune() returns bigint language plpgsql security definer set search_path='' as $$
declare removed bigint;
begin
 delete from analytics_private.events e using analytics_private.pages p,analytics_private.sites s
 where e.page_id=p.id and p.site_id=s.id and e.received_at<now()-make_interval(days=>greatest(90,(s.config->>'retention_days')::integer));
 get diagnostics removed=row_count;
 delete from analytics_private.pages p where p.started_at<now()-interval '24 hours' and not exists(select 1 from analytics_private.events e where e.page_id=p.id);
 delete from analytics_private.sessions s where s.last_at<now()-interval '24 hours' and not exists(select 1 from analytics_private.pages p where p.site_id=s.site_id and p.session_id=s.id);
 return removed;
end $$;
revoke all on function analytics_private.prune() from public,anon,authenticated;
grant execute on function analytics_private.prune() to service_role;
-- Vanilla local PostgreSQL can test prune without installing a scheduler.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  execute 'create extension if not exists pg_cron';
  perform cron.schedule('bio-analytics-retention','35 6 * * *','select analytics_private.prune()');
 end if;
end $$;
