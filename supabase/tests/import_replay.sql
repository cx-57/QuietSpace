-- Generate artifacts/venues.sql first, then run on a disposable migrated database.
\set ON_ERROR_STOP on
\ir ../../artifacts/venues.sql
create temporary table before_replay as select id, slug, created_at from public.spaces;
create temporary table features_before_replay as select * from public.space_features;
\ir ../../artifacts/venues.sql
do $$ begin
  if exists (select id, slug, created_at from public.spaces except select id, slug, created_at from before_replay)
    or exists (select id, slug, created_at from before_replay except select id, slug, created_at from public.spaces)
  then raise exception 'Venue replay changed IDs, count or creation times'; end if;
  if (select count(*) from public.spaces) <> 11 then raise exception 'Expected eleven imported venues'; end if;
  if (select count(*) from public.spaces where slug like 'bpl-%') <> 8 then raise exception 'Expected eight imported BPL libraries'; end if;
  if (select count(*) from public.space_features) <> 55 then raise exception 'Expected five explicit feature states across eleven venues'; end if;
  if exists (select * from public.space_features except select * from features_before_replay)
    or exists (select * from features_before_replay except select * from public.space_features)
  then raise exception 'Feature replay changed data or duplicated rows'; end if;
  if exists (select 1 from public.sensory_reports) then raise exception 'Import must not create reports'; end if;
end $$;
\echo 'PASS: import replay preserves rows and IDs, creates no reports'
