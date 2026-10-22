-- Phase 03. Apply once through a migration runner to a disposable/test project first.
-- PostgreSQL 15+ / Supabase roles anon, authenticated, service_role are prerequisites.
begin;

create type public.provenance_status as enum ('verified', 'needs_review', 'unverified');
create type public.feature_verification as enum ('verified', 'unknown');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.feature_key as enum (
  'accessible_entrance', 'step_free_access', 'accessible_toilet', 'seating', 'quiet_room'
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  name text not null check (length(btrim(name)) between 1 and 160),
  address text not null check (length(btrim(address)) between 1 and 300),
  category text not null check (category in ('library', 'park', 'community_centre', 'museum')),
  latitude double precision,
  longitude double precision,
  time_zone text not null,
  public_access text not null default 'unknown' check (public_access in ('public', 'restricted', 'unknown')),
  source_url text not null check (length(source_url) <= 2048 and source_url ~ '^https://[A-Za-z0-9][A-Za-z0-9.-]+(/|$)'),
  source_evidence text not null check (length(btrim(source_evidence)) between 1 and 1000),
  checked_at timestamptz,
  provenance_status public.provenance_status not null default 'unverified',
  published boolean not null default false,
  is_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  constraint coordinates_pair check ((latitude is null) = (longitude is null)),
  constraint coordinates_range check (latitude between -90 and 90 and longitude between -180 and 180),
  constraint verified_source_has_time check (provenance_status <> 'verified' or checked_at is not null),
  constraint checked_time_not_future check (checked_at is null or checked_at <= now()),
  constraint honest_publication check (not published or (
    provenance_status = 'verified' and public_access = 'public' and not is_fixture and checked_at is not null
  ))
);

create function public.validate_space_time_zone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone)
     or (new.time_zone <> 'UTC' and position('/' in new.time_zone) = 0) then
    raise exception 'Invalid IANA time zone' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger spaces_validate_time_zone before insert or update of time_zone on public.spaces
for each row execute function public.validate_space_time_zone();

create table public.space_features (
  space_id uuid not null references public.spaces(id) on delete cascade,
  feature public.feature_key not null,
  value boolean,
  verification public.feature_verification not null default 'unknown',
  source_url text,
  checked_at timestamptz,
  evidence text,
  primary key (space_id, feature),
  constraint facility_evidence_shape check (
    (verification = 'unknown' and value is null and source_url is null and checked_at is null and evidence is null)
    or
    (verification = 'verified' and value is not null and source_url is not null and
      length(source_url) <= 2048 and source_url ~ '^https://[A-Za-z0-9][A-Za-z0-9.-]+(/|$)' and
      checked_at is not null and checked_at <= now() and evidence is not null and
      length(btrim(evidence)) between 1 and 500)
  )
);

create table public.sensory_reports (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  noise smallint check (noise between 1 and 5),
  crowds smallint check (crowds between 1 and 5),
  brightness smallint check (brightness between 1 and 5),
  scent smallint check (scent between 1 and 5),
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  status public.moderation_status not null default 'pending',
  is_fixture boolean not null default false,
  moderated_at timestamptz,
  constraint at_least_one_intensity check (num_nonnulls(noise, crowds, brightness, scent) >= 1),
  constraint observation_not_future check (observed_at <= created_at + interval '5 minutes'),
  constraint moderation_timestamp check (
    (status = 'pending' and moderated_at is null) or
    (status in ('approved', 'rejected') and moderated_at is not null and moderated_at >= created_at)
  )
);

create index spaces_public_idx on public.spaces(category, name) where published and not is_fixture;
create index reports_approved_recent_idx on public.sensory_reports(space_id, observed_at desc)
  where status = 'approved' and not is_fixture;
create index reports_pending_idx on public.sensory_reports(created_at) where status = 'pending';

alter table public.spaces enable row level security;
alter table public.space_features enable row level security;
alter table public.sensory_reports enable row level security;
alter table public.spaces force row level security;
alter table public.space_features force row level security;
alter table public.sensory_reports force row level security;

-- Remove Supabase default privileges as well as PUBLIC inheritance.
revoke all on public.spaces, public.space_features, public.sensory_reports from public, anon, authenticated, service_role;
revoke create on schema public from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.spaces, public.space_features, public.sensory_reports to anon, authenticated;
grant select on public.spaces, public.space_features to service_role;

create policy published_spaces_only on public.spaces for select to anon, authenticated using (
  published and not is_fixture and public_access = 'public' and provenance_status = 'verified'
  and checked_at >= now() - interval '90 days' and checked_at <= now()
);
create policy published_features_only on public.space_features for select to anon, authenticated using (
  exists (select 1 from public.spaces s where s.id = space_id)
  and (verification = 'unknown' or (checked_at >= now() - interval '90 days' and checked_at <= now()))
);
create policy approved_reports_only on public.sensory_reports for select to anon, authenticated using (
  status = 'approved' and not is_fixture
  and exists (select 1 from public.spaces s where s.id = space_id)
);

-- Invoker view retains parent RLS; stale raw evidence is hidden by the feature policy.
-- Missing rows must be mapped to unknown by the future app read adapter.
create view public.public_space_features with (security_invoker = true) as
select space_id, feature,
  case when verification = 'verified' and checked_at between now() - interval '90 days' and now() then value else null end as value,
  case when verification = 'verified' and checked_at between now() - interval '90 days' and now() then 'verified' else 'unknown' end as verification,
  case when verification = 'verified' and checked_at between now() - interval '90 days' and now() then source_url else null end as source_url,
  case when verification = 'verified' and checked_at between now() - interval '90 days' and now() then checked_at else null end as checked_at,
  case when verification = 'verified' and checked_at between now() - interval '90 days' and now() then evidence else null end as evidence
from public.space_features;
revoke all on public.public_space_features from public, anon, authenticated, service_role;
grant select on public.public_space_features to anon, authenticated;

-- This RPC is for the future protected server handler ONLY. Never grant to clients.
create function public.submit_sensory_report(
  p_space_id uuid,
  p_observed_at timestamptz,
  p_noise smallint,
  p_crowds smallint,
  p_brightness smallint,
  p_scent smallint
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare receipt uuid;
begin
  if p_observed_at is null or p_observed_at < now() - interval '60 days'
      or p_observed_at > now() + interval '5 minutes' then
    raise exception 'Invalid observation time' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.spaces where id = p_space_id and published and not is_fixture
      and provenance_status = 'verified' and public_access = 'public'
      and checked_at between now() - interval '90 days' and now()
  ) then
    raise exception 'Venue unavailable' using errcode = '22023';
  end if;
  insert into public.sensory_reports(space_id, observed_at, noise, crowds, brightness, scent, status, is_fixture)
    values (p_space_id, p_observed_at, p_noise, p_crowds, p_brightness, p_scent, 'pending', false)
    returning id into receipt;
  return receipt;
end;
$$;

revoke all on function public.submit_sensory_report(uuid, timestamptz, smallint, smallint, smallint, smallint)
  from public, anon, authenticated, service_role;
grant execute on function public.submit_sensory_report(uuid, timestamptz, smallint, smallint, smallint, smallint) to service_role;
revoke all on function public.validate_space_time_zone() from public, anon, authenticated, service_role;

comment on table public.sensory_reports is 'Structured anonymous observations. No personal, medical or free-text input. Public only after trusted moderation.';
comment on function public.submit_sensory_report(uuid, timestamptz, smallint, smallint, smallint, smallint)
  is 'Server-only submission capability. Pending only; HTTP abuse controls are a separate required gate.';
commit;
