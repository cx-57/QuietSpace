# Database setup and verification

No PostgreSQL, Supabase CLI, Docker or database account is available in this session. **No migration, RLS test, rollback or import has executed against PostgreSQL.** Python checks verify artifact structure and importer behavior only. Database acceptance remains conditional until the commands below pass.

## Disposable PostgreSQL 15+ test database

Use a new empty database whose owner can create roles and `SET ROLE`; never select production. Set `DATABASE_URL` locally using your credential manager; do not paste it into chat, commit it, or print it. `psql` automatically reads it only when passed as a connection argument; the examples below use the standard `PGSERVICE=quietspace_test` service configured locally instead, avoiding credentials on command lines.

```powershell
# First configure a local pg_service.conf entry named quietspace_test.
$env:PGSERVICE = 'quietspace_test'
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/bootstrap_roles.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/migrations/202610200001_foundation.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/migrations/202610220001_report_abuse_controls.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/foundation.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/reports.sql
python tools/import_venues.py --output artifacts/venues.sql
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/import_replay.sql
```

Use a clean disposable database for replay tests (the suite assumes no existing reports). All fictitious fixture inserts happen within the `foundation.sql` transaction and are rolled back, even on success. If a failing test leaves a session open, issue `ROLLBACK` and close that disposable connection. The import replay suite intentionally persists real sourced rows in the disposable database only.

For Supabase, the standard roles already exist: **omit bootstrap_roles.sql**. Apply the migration to a new test project with the platform migration mechanism or `psql`; do not apply fixtures to hosted production. Verify the Data API anonymously returns published fresh real venues only; query `sensory_reports` before/after trusted moderation and attempt RPC/privileged writes with the anon key. These HTTP checks remain unexecuted and are required before release.

## Invariants and capability table

| Actor | Venues/features | Reports | Submission RPC | Moderation |
| --- | --- | --- | --- | --- |
| anon/authenticated | Published, verified, fresh, real public only | Approved, non-fixture, public parent only | Denied | Denied |
| application service_role | SELECT capability only, bypasses RLS; never use for public reads | No direct table grants | Execute narrow pending-only function | Denied |
| trusted database operator | Administrative | Administrative | Administrative | Explicit status + moderated_at update |

No browser report insert policy exists. Stage 10 adds a server endpoint with streamed body-size checks, exact payload validation, Origin checks and a persistent rate-limited RPC wrapper. It is disabled by default; see [report setup and moderation](reporting.md) for ingress, cleanup and runtime gates. CREATE on the exposed schema is revoked from client/application roles to prevent object shadowing. Trusted owners/platform administrators are outside the public threat boundary; they can override RLS and must protect credentials. Apply the migrations as the trusted schema owner/superuser with BYPASSRLS privileges; function owners need that capability under FORCE RLS.

`public_space_features` is an invoker view, so it cannot bypass parent policies. Public policy hides expired features; missing rows map to unknown. Read freshness uses database time, not client time. Raw storage keeps source history available to operators. Stale venues automatically disappear from public queries after 90 days. No hours are stored; link to official sources instead.

## Replay and rollback strategy

The versioned migration is applied **once**, not re-executed on an existing schema. Import SQL is idempotent by unique slug and `(space_id, feature)`, with a transaction and stable original IDs/creation timestamps. Rerun the import to update reviewed facts; it never deletes venues or reports. The importer resets the entire supported feature set for imported venues, preventing old facts surviving a later unknown entry. Older source data cannot overwrite newer rows.

For a fresh reproducibility check, discard/recreate only the explicitly selected disposable database through your database tooling, then reapply the migration and tests. No destructive rollback command is shipped for an unknown user's database. In production, back up, use additive forward migrations, rehearse recovery on a copy, and verify public-role behavior after every privilege change. CI currently does not certify PostgreSQL behavior.
