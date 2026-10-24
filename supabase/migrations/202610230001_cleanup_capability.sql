-- Narrow cleanup capability for the long-running PostgreSQL application worker.
-- No row access or arbitrary deletion is granted; the function deletes only events older than 24h.
begin;
grant execute on function public.purge_report_abuse_events() to service_role;
commit;
