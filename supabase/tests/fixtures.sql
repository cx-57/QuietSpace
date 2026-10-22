-- TEST ONLY, FICTITIOUS SAMPLE. Included only in a transaction rolled back by foundation.sql.
-- The non-fixture row below simulates production RLS in an isolated test; it is NOT real venue data.
insert into public.spaces(id, slug, name, address, category, time_zone, public_access, source_url, source_evidence, checked_at, provenance_status, published, is_fixture)
values
('10000000-0000-4000-8000-000000000001', 'sample-public', 'SAMPLE Fictional Public Library', 'SAMPLE fictional address', 'library', 'America/New_York', 'public', 'https://example.org/sample-public', 'TEST ONLY synthetic publication evidence', now(), 'verified', true, false),
('10000000-0000-4000-8000-000000000002', 'sample-private', 'SAMPLE Fictional Unpublished Library', 'SAMPLE fictional address', 'library', 'America/New_York', 'unknown', 'https://example.org/sample-private', 'TEST ONLY unknown access', null, 'unverified', false, true),
('10000000-0000-4000-8000-000000000003', 'sample-stale', 'SAMPLE Fictional Stale Library', 'SAMPLE fictional address', 'library', 'America/New_York', 'public', 'https://example.org/sample-stale', 'TEST ONLY stale evidence', now() - interval '91 days', 'verified', true, false);

insert into public.space_features(space_id, feature, value, verification, source_url, checked_at, evidence) values
('10000000-0000-4000-8000-000000000001', 'accessible_entrance', true, 'verified', 'https://example.org/sample-public', now(), 'TEST ONLY synthetic entrance fact'),
('10000000-0000-4000-8000-000000000001', 'seating', false, 'verified', 'https://example.org/sample-public', now(), 'TEST ONLY negative fact'),
('10000000-0000-4000-8000-000000000001', 'step_free_access', null, 'unknown', null, null, null),
('10000000-0000-4000-8000-000000000001', 'quiet_room', true, 'verified', 'https://example.org/sample-public', now() - interval '91 days', 'TEST ONLY stale facility'),
('10000000-0000-4000-8000-000000000002', 'seating', true, 'verified', 'https://example.org/sample-private', now(), 'TEST ONLY hidden parent');

insert into public.sensory_reports(space_id, noise, observed_at, status, is_fixture, moderated_at) values
('10000000-0000-4000-8000-000000000001', 2, now() - interval '1 hour', 'approved', false, now()),
('10000000-0000-4000-8000-000000000001', 3, now() - interval '1 hour', 'pending', false, null),
('10000000-0000-4000-8000-000000000001', 4, now() - interval '1 hour', 'rejected', false, now()),
('10000000-0000-4000-8000-000000000001', 1, now() - interval '1 hour', 'approved', true, now()),
('10000000-0000-4000-8000-000000000002', 2, now() - interval '1 hour', 'approved', false, now()),
('10000000-0000-4000-8000-000000000003', 2, now() - interval '1 hour', 'approved', false, now());
