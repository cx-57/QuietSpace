-- Trusted database operator ONLY. No application/browser endpoint.
-- psql -X -v ON_ERROR_STOP=1 -v report_id=UUID -v decision=approved -f supabase/operations/moderate_report.sql
-- decision may be approved or rejected. Review the exact row before executing.
\set ON_ERROR_STOP on
begin;
select set_config('quietspace.report_id', :'report_id', true);
select set_config('quietspace.decision', :'decision', true);
do $$
declare changed integer;
begin
  if current_setting('quietspace.decision') not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  update public.sensory_reports r
    set status = current_setting('quietspace.decision')::public.moderation_status, moderated_at = clock_timestamp()
    where r.id = current_setting('quietspace.report_id')::uuid and r.status = 'pending' and not r.is_fixture
      and (current_setting('quietspace.decision') = 'rejected' or (
        r.observed_at <= clock_timestamp() and r.observed_at >= clock_timestamp() - interval '60 days'
        and exists (select 1 from public.spaces s where s.id = r.space_id and s.published and not s.is_fixture
          and s.public_access = 'public' and s.provenance_status = 'verified'
          and s.checked_at between clock_timestamp() - interval '90 days' and clock_timestamp())
      ));
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'No eligible pending report changed; review ID, parent and age'; end if;
end $$;
select id, status, moderated_at from public.sensory_reports where id = current_setting('quietspace.report_id')::uuid;
commit;
