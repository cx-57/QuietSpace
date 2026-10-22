-- Phase 10. Persistent, atomic submission limits; no raw network addresses stored.
begin;
create table public.report_abuse_events (
  id bigint generated always as identity primary key,
  abuse_key text not null check (abuse_key ~ '^[a-f0-9]{64}$'),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp()
);
create index report_abuse_key_time on public.report_abuse_events(abuse_key, created_at desc);
create index report_abuse_time on public.report_abuse_events(created_at);
alter table public.report_abuse_events enable row level security;
alter table public.report_abuse_events force row level security;
revoke all on public.report_abuse_events from public, anon, authenticated, service_role;
revoke all on sequence public.report_abuse_events_id_seq from public, anon, authenticated, service_role;

create function public.purge_report_abuse_events() returns void
language sql security definer set search_path = '' as $$
  delete from public.report_abuse_events where created_at < clock_timestamp() - interval '24 hours';
$$;
revoke all on function public.purge_report_abuse_events() from public, anon, authenticated, service_role;

create function public.submit_rate_limited_report(
  p_space_id uuid, p_observed_at timestamptz, p_noise smallint, p_crowds smallint,
  p_brightness smallint, p_scent smallint, p_abuse_key text, p_fingerprint text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare receipt uuid;
begin
  if p_abuse_key is null or p_abuse_key !~ '^[a-f0-9]{64}$' or
     p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid abuse token' using errcode = '22023';
  end if;
  -- A single transaction lock makes both per-network and global limits race-safe.
  perform pg_catalog.pg_advisory_xact_lock(71022026);
  perform public.purge_report_abuse_events();
  if (select count(*) from public.report_abuse_events where created_at > clock_timestamp() - interval '1 hour') >= 100
    or (select count(*) from public.report_abuse_events where abuse_key = p_abuse_key and created_at > clock_timestamp() - interval '1 hour') >= 5
    or exists (select 1 from public.report_abuse_events where abuse_key = p_abuse_key and
      (created_at > clock_timestamp() - interval '30 seconds' or fingerprint = p_fingerprint)) then
    raise exception 'Submission limited' using errcode = 'P0429';
  end if;
  receipt := public.submit_sensory_report(p_space_id, p_observed_at, p_noise, p_crowds, p_brightness, p_scent);
  insert into public.report_abuse_events(abuse_key, fingerprint) values (p_abuse_key, p_fingerprint);
  return receipt;
end;
$$;
revoke all on function public.submit_rate_limited_report(uuid, timestamptz, smallint, smallint, smallint, smallint, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_rate_limited_report(uuid, timestamptz, smallint, smallint, smallint, smallint, text, text) to service_role;
comment on table public.report_abuse_events is 'Daily HMAC network pseudonyms and payload fingerprints. Never raw IPs. Purge hourly through trusted scheduler and on submissions; no public grants.';
commit;
