# Reporting and moderation, Stage 10

Prepared 2026-10-22. Application boundary tests run against controlled sinks and a loopback PostgREST test double. **No PostgreSQL migration, policy, persistent limit, or real moderation transaction has executed in this session. Reporting remains disabled by default.**

## Connect a test environment

1. Use a disposable PostgreSQL 15+/Supabase project and follow [database setup](database.md). Apply `202610200001_foundation.sql`, then `202610220001_report_abuse_controls.sql`. Run `foundation.sql` and `reports.sql` as the trusted owner. The foundation test still exercises the earlier narrow RPC; the application now uses the rate-limited wrapper. Both capabilities remain server-only.
2. Import the five real source-reviewed venues with the offline importer. Do not import SAMPLE test fixtures into a hosted directory. Source and facility facts expire after 90 days.
3. In a local ignored `.env.local`, choose `QUIETSPACE_DATA_MODE=supabase`, set the public project URL and anonymous key. **Public reads always use the anonymous key**, never the service role. The current adapter expects Supabase's legacy anonymous/service-role JWT pair for its API `Authorization` header; do not substitute a user's access token or a secret/publishable key pair without updating the auth adapter.
4. Only after the tests below pass, set the server-only service-role key, a random `REPORT_ABUSE_SECRET` of at least 32 characters, the exact `APP_ORIGIN`, a verified `REPORT_TRUSTED_IP_HEADER`, and `REPORTS_ENABLED=true`. Restart the server. Production requires HTTPS for the canonical app origin and data service. Local HTTP loopback is supported only in development. No key needs to be pasted into chat.
5. The ingress must **overwrite** the selected single-IP header and prevent direct access to the origin. Check an external request supplying a forged header does not change the IP delivered to the app. Lists/unknown IPs cause 503 without writes. Do not guess a hosting provider's header. Until verified, keep reporting off. Apply upstream request/body limits as well; application limits are not a full DDoS defense.
6. Schedule `select public.purge_report_abuse_events();` **hourly**, as a trusted operator via the database's scheduler. Supabase projects with pg_cron already enabled can schedule `select cron.schedule('quietspace-abuse-purge', '0 * * * *', 'select public.purge_report_abuse_events();');`. Check for an existing job before creating one. No scheduler/extension is installed by this repo. If pg_cron is absent, use your secured operator scheduler. Verify job success and deletion of expired test events before enabling reports.

The test-double server in `tests/support/` is loopback-only test infrastructure. It provides no database or RLS assurance and is never used by `dev`, `build` or `start`.

## Boundary and limits

`POST /api/reports` accepts only `spaceId`, `observedAt`, and the four exact intensity keys. It rejects extra status, fixture, publication, personal, or privileged fields; strings/booleans/fractions/zero/6 are not ratings. Null stays null, and at least one dimension is required. Timestamps must have an explicit offset, be real calendar dates within 60 days, with at most 5 minutes of clock skew. IDs, timestamps and dimension order are canonicalized before fingerprinting. Scores exclude any future observation, including allowed clock skew, until its time arrives.

The handler checks the configured exact Origin, content type and trusted ingress address, then bounds the **actual streamed body** to 2,048 bytes. It never forwards raw headers, IPs or user identity to the database, and never logs submitted bodies or backend errors. The browser form is disabled until hydrated and uses POST as its native fallback, so form fields cannot fall back to a URL query. Without JavaScript, reporting is unavailable and source pages remain readable.

The server HMACs UTC date + network using the secret; IPv6 interface addresses share a /64 limit. It separately fingerprints the canonical payload. The database serializes submission checks and inserts within one transaction, storing pending only. Limits: 30-second cooldown, 5 accepted reports/network/hour, repeated identical payload/network denied within retention, and 100 accepted reports globally/hour. Network pseudonyms rotate daily, so per-network hourly allowance can reset across UTC midnight; the global hourly ceiling remains. Shared networks may hit limits together. Determined attackers may change networks; this is a lightweight abuse control, not proof of unique people.

Abuse events expire at 24 hours. On-submit cleanup and the required hourly scheduler remove them; with an hourly schedule physical retention can reach approximately 25 hours. No abuse tokens or fingerprints are public. Secret rotation invalidates pseudonyms; do not rotate it per request. Align database backups/log retention and hosting access-log redaction with your privacy policy before release. No free text, names, diagnosis, device location, raw address or user account is stored by the report flow.

## Trusted operator procedure

Only the database owner/operator reviews reports, using a secured connection/service configuration. The application service role has no direct report mutation or moderation privileges. No public approval HTTP route exists.

```powershell
$env:PGSERVICE = 'quietspace_test'
psql -X -v ON_ERROR_STOP=1 -f supabase/operations/pending_reports.sql
# Review one exact report and its parent; replace UUID with the receipt being reviewed.
psql -X -v ON_ERROR_STOP=1 -v report_id=UUID -v decision=approved -f supabase/operations/moderate_report.sql
# Or use decision=rejected. Only a single pending report may change.
```

Review for valid venue, plausible observation time/intensity and duplicates. Do not assume a library is quiet; do not manufacture observations to populate scores. Approval requires a current published public parent, a non-fixture row, and a recent, non-future visit. Rejection is possible for stale-parent submissions. The script uses quoted psql variables, UUID/enum checks, a transaction and an exact-row change assertion. It deliberately cannot approve a whole queue or silently modify an already moderated record. If an approved report must later be withdrawn, the trusted operator can reject that exact row with a parameterized administrative update and record the decision in their restricted operational audit; do not create a public route.

Reload discovery/detail after moderation. Public reads use no-store, and the adapter excludes pending/rejected/fixture rows even if returned by a faulty backend. At least 3 approved observations per eligible dimension and 2 dimensions including noise are still required before any fit number appears. Rejection must remove the row on the next fetch.

## Required real-service acceptance (not yet executed)

- Fresh migrated disposable database: both SQL suites pass, including public denial of RPC/table writes and the application's denial of direct moderation.
- Valid HTTP observation inserts exactly one pending row. Public anonymous query returns no receipt row. A second rapid or duplicate request is 429; verify concurrent requests across two app workers also share limits.
- Operator approves one exact pending row; anonymous read then includes it. Rejection removes it on refetch. Pending/rejected/unpublished/stale-parent/fixture rows never appear in public results.
- Invalid body, arbitrary ID, injected status, future/stale date, all-null or out-of-range ratings cause no stored report. Unavailable DB returns safe errors and preserves browser fields.
- Ingress spoofing test passes; service-role key is absent from client assets; cleanup runs hourly; protected monitoring does not record raw submission bodies/IPs.

References consulted: [Next route handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), installed Next 16.4.2 guides under `node_modules/next/dist/docs/`, and the existing migration/contract. The database tests, not the test double, are the approval-publication acceptance gate.
