-- Trusted operator ONLY. At most 50 structured reports; no submitter identities exist.
\set ON_ERROR_STOP on
select r.id, s.name, r.observed_at, r.created_at, r.noise, r.crowds, r.brightness, r.scent
from public.sensory_reports r join public.spaces s on s.id = r.space_id
where r.status = 'pending' and not r.is_fixture
order by r.created_at, r.id limit 50;
