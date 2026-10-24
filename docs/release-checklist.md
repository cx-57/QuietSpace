# QuietSpace release candidate

Updated October 23, 2026. This is a previously locally tested application and a prepared production package. Recent quiet-first and Community changes have been committed to the repository, but **the modified branch has not passed new automated tests** because GitHub-hosted jobs are currently failing before a runner starts. The earlier October 23 main-branch browser failure was traced to the preference persistence portion of the browser-to-PostgreSQL test; hydration readiness and a persistence assertion have been added, but still need execution. No public deployment or Devpost submission has been verified.

## Verified locally

- Five source-reviewed Boston Public Library records are imported into PostgreSQL with 25 explicit facility states and zero fabricated sensory reports. The list and details use real anonymous-role database reads.
- Preferences persist locally, recover from malformed/blocked storage, and enforce fresh verified-true required facilities.
- Scoring and historical bins share approved, recent, non-fixture observations. Thresholds, missing values, venue-local dates, DST, sparse evidence and reliability are tested.
- Real browser submission persists pending; operator CLI approval changes public evidence; rejection removes it. Anonymous writes/moderation are denied. Concurrent submissions share a transactional limiter.
- PostgreSQL foundation, report/limit, cleanup and import replay suites pass in disposable databases. Tests never add synthetic observations to the real directory.
- Lint, types, Node tests, Python checks, production build, mobile reflow, keyboard, axe, reduced motion and forced colors have recorded evidence in the [final sign-off](engineering/phase-signoffs/11-18.md).
- Production assets are self-hosted. Runtime configuration stays server-only; the standalone artifact includes local static assets and excludes environment files. Security response headers and `/api/health` are present.

## Local use

```powershell
npm ci
npm run setup:local
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://localhost:3000`, matching the generated canonical Origin. The setup command uses an isolated loopback PostgreSQL cluster on port 55432, a restricted application login, and an ignored `.env.local`. PostgreSQL must already be installed; set `PG_BIN` if its tools are elsewhere. This development cluster uses loopback trust authentication and must never be exposed or deployed.

Operator commands: `npm run moderate -- pending`, `npm run moderate -- approve UUID`, `npm run moderate -- reject UUID`, `npm run moderate -- purge`. The operator URI is never consumed by the application. Approval is an explicit human decision; do not approve invented observations to fill empty scores.

## Production package and hosting

```powershell
npm run check
npm run check:release
npm start
```

`npm start` uses the generated standalone server and supports `--port`. Runtime assets live under `.next/standalone`; build on the deployment OS because native dependencies and Windows junctions are not portable deployment artifacts. Set runtime secrets through the host, never through public env names or committed files.

The [Dockerfile](../Dockerfile) builds on Linux and runs as the non-root Node user. [Compose](../compose.yaml) provides a dedicated PostgreSQL database, ordered initial migrations, restricted app role and reviewed venue seed. Docker is unavailable in this session, so the container workflow is supplied but **not executed**. Generate the seed first:

```powershell
python tools/import_venues.py --output artifacts/venues.sql
# Configure APP_ORIGIN, QUIETSPACE_OWNER_PASSWORD, QUIETSPACE_APP_PASSWORD,
# REPORT_ABUSE_SECRET in an ignored deployment .env. Use different random hex passwords.
docker compose up --build -d
```

Compose publishes only the application on loopback; the database has no public port. Fresh-volume initialization runs once. Existing databases require forward migrations explicitly; do not reset a persistent volume to apply a migration.

Choose either direct PostgreSQL (`QUIETSPACE_DATA_MODE=postgres`) or the existing Supabase REST adapter. Direct PostgreSQL requires a non-superuser NOINHERIT login with SET membership in `anon` and `service_role`, all three migrations, verified TLS/database networking and a protected operator account. Public reads run `SET LOCAL ROLE anon` inside read-only transactions; writes use only the pending RPC as `service_role`. The long-running PostgreSQL application purges expired abuse records on startup and hourly. Serverless/Supabase deployments need an external scheduler, as described in [reporting](engineering/reporting.md).

Keep public reporting disabled until the deployed canonical HTTPS Origin, overwritten trusted IP header, direct-origin access restrictions, backups and cleanup monitoring are verified. The [nginx example](../deploy/nginx.conf) shows body limits and an overwritten IP header; adapt it inside a TLS-enabled virtual host for the actual domain. Its loopback HTTP server is an example, not a complete TLS deployment. Hosting credentials/domain were not available here, so no cloud service was modified.

## QuietSpace / Community launch-specific acceptance

1. Check the one-click quiet action on desktop and mobile; verify Central/Bates Hall and East Boston receive facility-only priority at noise preferences 1–2 without a fabricated sensory fit number.
2. Apply the current reviewed venue import SQL to any **already-existing connected database** before testing the quiet-study source signal. Updating JSON alone does not update production PostgreSQL or Supabase rows. Verify both quiet_room records are visible through anonymous RLS reads.
3. Visit `/community`: confirm counts begin at 0 without real approved reports; a pending or rejected report must not appear in the community review cards or participation statistics.
4. Enable reporting only after ingress protection, exact origin, rate limiting and cleanup are verified. Submit a legitimate observation to one real space, approve it as a trusted operator, and confirm it appears on the venue and community page without a fake testimonial. Check rejection withdraws it immediately.
5. Make the repository public after a full secret/license audit so the GitHub issue templates for **Suggest a public space** and **Community feedback** work for residents. Both require GitHub sign-in and create public issues.
6. Record a **new** demo covering quiet-first discovery and the Community route; the earlier video predates these changes. Disclose the synthetic test database whenever showing populated sample reviews.
7. Run `npm run check`, Python unittest, real database tests, browser E2E and `npm run check:release` after any change. Current GitHub Actions outcomes do not certify the updated tree.

## Deployed acceptance still required

1. HTTPS and deep links work from a public mobile network; `/api/health` is healthy and invalid/unpublished venue URLs return 404.
2. Production anonymous reads cannot see pending/rejected/fixture/private rows. A valid real observation is pending; trusted operator approval alone publishes it.
3. A forged client IP header cannot bypass ingress limits. Direct application access is blocked. Repeated/rapid and concurrent submissions return safe limits.
4. Cleanup succeeds hourly, logs/backups follow the privacy policy, restore is rehearsed, and no operator/service secret is in public assets or the image.
5. Check actual screen-reader use and real devices; automated tests do not establish accessibility certification or a user study.

## Recovery

Disable reporting first if submission or moderation is suspect. Retain the database and take a backup. Roll back the application image to the previous verified image; use forward database fixes, never destructive schema rollback on live reports. Restore backups to a separate database and verify RLS, role grants, publication and source freshness before redirecting traffic. Keep operator access separate from application credentials.
