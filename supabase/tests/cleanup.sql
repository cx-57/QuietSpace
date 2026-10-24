\set ON_ERROR_STOP on
begin;
insert into public.report_abuse_events(abuse_key,fingerprint,created_at) values
(repeat('a',64),repeat('b',64),clock_timestamp()-interval '25 hours'),
(repeat('c',64),repeat('d',64),clock_timestamp());
set local role service_role;
select public.purge_report_abuse_events();
reset role;
do $$ begin
  if (select count(*) from public.report_abuse_events)<>1 then raise exception 'Cleanup did not preserve exactly the fresh event'; end if;
  if exists(select 1 from public.report_abuse_events where abuse_key=repeat('a',64)) then raise exception 'Expired event survived'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform public.purge_report_abuse_events(); raise exception 'Anonymous cleanup capability leaked';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo 'PASS: service cleanup is time-bounded and anonymous cleanup is forbidden'
