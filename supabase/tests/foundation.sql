-- Run with psql -X -v ON_ERROR_STOP=1 -f supabase/tests/foundation.sql
-- against a DISPOSABLE migrated database as its owner/superuser, never production.
\set ON_ERROR_STOP on
begin;
\ir fixtures.sql

set local role anon;
do $$ begin
  if (select count(*) from public.spaces) <> 1 then raise exception 'RLS: spaces leaked'; end if;
  if (select count(*) from public.sensory_reports) <> 1 then raise exception 'RLS: report leaked'; end if;
  if (select count(*) from public.space_features) <> 3 then raise exception 'RLS: feature or stale value leaked'; end if;
  if exists (select 1 from public.public_space_features where feature = 'quiet_room') then raise exception 'RLS: stale facility passed'; end if;
  if not exists (select 1 from public.public_space_features where feature = 'seating' and value = false) then raise exception 'Verified false was lost'; end if;
  if not exists (select 1 from public.public_space_features where feature = 'step_free_access' and value is null) then raise exception 'Unknown was lost'; end if;
  begin
    insert into public.sensory_reports(space_id, noise, observed_at, status, moderated_at)
      values ('10000000-0000-4000-8000-000000000001', 1, now(), 'approved', now());
    raise exception 'Client insert unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.sensory_reports set status = 'approved', moderated_at = now();
    raise exception 'Client moderation unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.spaces;
    raise exception 'Client delete unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000001', now(), 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Client RPC unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
do $$ begin
  if (select count(*) from public.sensory_reports) <> 1 then raise exception 'Authenticated report leak'; end if;
  if (select count(*) from public.spaces) <> 1 then raise exception 'Authenticated venue leak'; end if;
  begin
    update public.spaces set published = true;
    raise exception 'Authenticated publish allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.sensory_reports(space_id, noise, observed_at)
      values ('10000000-0000-4000-8000-000000000001', 1, now());
    raise exception 'Authenticated direct insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000001', now(), 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Authenticated RPC allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
do $$ begin
  perform public.submit_sensory_report('10000000-0000-4000-8000-000000000001', now(), 1::smallint, null::smallint, null::smallint, null::smallint);
  begin
    insert into public.sensory_reports(space_id, noise, observed_at, status, moderated_at)
      values ('10000000-0000-4000-8000-000000000001', 1, now(), 'approved', now());
    raise exception 'Service direct insert unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000002', now(), 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Submission to unpublished venue allowed';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000003', now(), 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Submission to stale venue allowed';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000001', now() + interval '1 hour', 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Future observation allowed';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_sensory_report('10000000-0000-4000-8000-000000000001', now() - interval '61 days', 1::smallint, null::smallint, null::smallint, null::smallint);
    raise exception 'Stale observation allowed';
  exception when invalid_parameter_value then null; end;
  begin
    update public.sensory_reports set status = 'approved', moderated_at = now();
    raise exception 'Service role direct moderation unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

do $$ begin
  if (select count(*) from public.sensory_reports where status = 'pending' and not is_fixture) <> 2 then raise exception 'RPC did not create exactly one pending row'; end if;
  begin
    insert into public.sensory_reports(space_id, noise, observed_at) values ('10000000-0000-4000-8000-000000000001', 0, now());
    raise exception 'Zero accepted';
  exception when check_violation then null; end;
  begin
    insert into public.sensory_reports(space_id, scent, observed_at) values ('10000000-0000-4000-8000-000000000001', 6, now());
    raise exception 'Six accepted';
  exception when check_violation then null; end;
  begin
    insert into public.sensory_reports(space_id, observed_at) values ('10000000-0000-4000-8000-000000000001', now());
    raise exception 'All-null report accepted';
  exception when check_violation then null; end;
  begin
    insert into public.sensory_reports(space_id, noise, observed_at) values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 1, now());
    raise exception 'Broken FK accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.spaces set time_zone = 'Mars/Olympus' where slug = 'sample-public';
    raise exception 'Invalid timezone accepted';
  exception when check_violation then null; end;
  begin
    update public.spaces set latitude = 91, longitude = 0 where slug = 'sample-public';
    raise exception 'Bad coordinate accepted';
  exception when check_violation then null; end;
  begin
    update public.spaces set published = true where slug = 'sample-private';
    raise exception 'Unverified fixture publication accepted';
  exception when check_violation then null; end;
  begin
    update public.space_features set value = true where feature = 'step_free_access';
    raise exception 'Unknown boolean accepted';
  exception when check_violation then null; end;
end $$;

-- A moderation change must immediately remove formerly public evidence.
update public.sensory_reports set status = 'rejected' where status = 'approved' and not is_fixture;
set local role anon;
do $$ begin
  if exists (select 1 from public.sensory_reports) then raise exception 'Moderation invalidation failed'; end if;
end $$;
reset role;
rollback;
\echo 'PASS: transactional RLS, constraints and server-only submission checks'
