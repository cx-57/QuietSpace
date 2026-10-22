-- DISPOSABLE database only, after both migrations. Transactional SAMPLE fixtures.
\set ON_ERROR_STOP on
begin;
\ir fixtures.sql
set local role anon;
do $$ begin
  begin
    perform public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('a',64), repeat('b',64));
    raise exception 'Anonymous rate RPC allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.report_abuse_events;
    raise exception 'Abuse metadata public';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
select public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('a',64), repeat('b',64));
do $$ begin
  begin
    perform public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('a',64), repeat('c',64));
    raise exception 'Rapid submission allowed';
  exception when sqlstate 'P0429' then null; end;
  begin
    update public.sensory_reports set status = 'approved', moderated_at = now();
    raise exception 'Application moderation allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.report_abuse_events(abuse_key,fingerprint) values(repeat('a',64),repeat('c',64));
    raise exception 'Service direct abuse write allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- A repeat is blocked after the short cooldown, too.
update public.report_abuse_events set created_at = clock_timestamp() - interval '1 minute';
set local role service_role;
do $$ begin
  begin
    perform public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('a',64), repeat('b',64));
    raise exception 'Duplicate allowed';
  exception when sqlstate 'P0429' then null; end;
end $$;
reset role;

-- Five events in the hour block a new payload even after the short cooldown.
insert into public.report_abuse_events(abuse_key, fingerprint, created_at)
select repeat('a',64), lpad(n::text,64,'0'), clock_timestamp() - interval '2 minutes' from generate_series(1,4) n;
set local role service_role;
do $$ begin
  begin
    perform public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('a',64), repeat('f',64));
    raise exception 'Per-network hourly cap bypassed';
  exception when sqlstate 'P0429' then null; end;
end $$;
reset role;

-- One hundred global events block an entirely new network.
insert into public.report_abuse_events(abuse_key, fingerprint, created_at)
select repeat('c',64), lpad(n::text,64,'0'), clock_timestamp() - interval '2 minutes' from generate_series(1,95) n;
set local role service_role;
do $$ begin
  begin
    perform public.submit_rate_limited_report('10000000-0000-4000-8000-000000000001', now(), 2::smallint, null::smallint, null::smallint, null::smallint, repeat('f',64), repeat('f',64));
    raise exception 'Global hourly cap bypassed';
  exception when sqlstate 'P0429' then null; end;
end $$;
reset role;

-- New pending report is hidden, then becomes public only after operator approval.
set local role anon;
do $$ begin
  if (select count(*) from public.sensory_reports) <> 1 then raise exception 'Pending leaked'; end if;
end $$;
reset role;
update public.sensory_reports set status = 'approved', moderated_at = now() where status = 'pending' and not is_fixture;
set local role anon;
do $$ begin
  if (select count(*) from public.sensory_reports) <> 3 then raise exception 'Approval did not publish exactly two pending SAMPLE rows'; end if;
end $$;
reset role;
update public.sensory_reports set status = 'rejected', moderated_at = now() where status = 'approved' and not is_fixture;
set local role anon;
do $$ begin
  if exists(select 1 from public.sensory_reports) then raise exception 'Rejection still visible'; end if;
end $$;
reset role;

insert into public.report_abuse_events(abuse_key,fingerprint,created_at) values(repeat('d',64),repeat('e',64),clock_timestamp() - interval '25 hours');
select public.purge_report_abuse_events();
do $$ begin
  if exists(select 1 from public.report_abuse_events where abuse_key=repeat('d',64)) then raise exception 'Expiry purge failed'; end if;
end $$;
rollback;
\echo 'PASS: pending/approval/rejection, private abuse data, cooldown, duplicates, retention'
