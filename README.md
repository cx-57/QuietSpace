# QuietSpace

Find a place that feels right. A calm, list-first directory of public venues, with local sensory preferences and transparent evidence.

**Implemented through Stage 10:** accessible shell, versioned local preferences, deterministic matching, search and strict facility filters, venue detail/source pages, and a guarded pending-report flow with operator moderation tooling. Default mode is a **read-only sourced directory of five real Boston public-library venues**, with no invented sensory reports. Reporting is disabled until a real test database, trusted ingress, moderation and cleanup checks pass. This is not a released MVP.

## Open locally

Node 24 LTS and npm:

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No credentials or env file are needed for the curated directory. Change preferences, type a place/area, require verified facilities, and open venue details. Unknown facilities do not pass a strict filter. No observations means no numeric match. Source facts expire after 90 days; do not change review timestamps without checking the official source.

Routes: `/`, `/preferences`, `/spaces/bpl-brighton`, `/spaces/bpl-brighton/report`. All five directory slugs work for detail/report navigation; missing or unpublished venues return 404. Curated report pages clearly state that no observation is collected.

## Checks

```powershell
npm run check
python -m unittest discover -s tests -p "test_*.py" -v
python tools/import_venues.py
npm run test:e2e
git diff --check
```

`check` runs lint, TypeScript, 28 Node logic/boundary tests and a production build. The Python suite has 26 importer/cross-layer checks. Seven Playwright journeys cover curated production mode and an isolated development server connected to a **loopback test double**, including report validation/pending state, simulated approval, error recovery, storage recovery, keyboard interaction, 320px layouts and axe scans. They do not validate PostgreSQL or RLS.

Browser tests require a production build first and default to installed Microsoft Edge. For Chromium instead:

```powershell
npx playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:e2e
```

Browser tests manage ports 3100, 3101 and 3987 and stop those processes afterward. The connected test build directory is isolated from the normal development server. Next generates type declarations/include entries during builds and may rewrite `next-env.d.ts`. Screenshots are written to ignored `artifacts/stage-10-desktop.png` and `artifacts/stage-10-mobile.png`. No automated scan substitutes for a screen-reader or user study.

## Connect reporting

Copy `.env.example` to ignored `.env.local` and follow [reporting setup and moderation](docs/engineering/reporting.md) and [database verification](docs/engineering/database.md). Select `QUIETSPACE_DATA_MODE=supabase` for anonymous-role public reads. A failed/missing connection has an honest error state and never silently swaps to local data. No service-role key is used for public discovery.

The server report handler accepts exact structured inputs, validates time/rating/body limits, checks Origin and a verified ingress header, then calls the persistent rate-limited pending-only RPC. A trusted operator approves or rejects individual reports through secured database tooling; no public approval endpoint exists. Public adapters and scoring exclude unapproved, fixture, stale and future observations. API success means **pending**, not published.

**Still unverified:** real PostgreSQL migration/RLS, concurrent persistent limits, real submission/approval/rejection, deployed ingress spoofing resistance and cleanup scheduling. No hosted service was contacted or changed. Keep `REPORTS_ENABLED=false` until those gates pass. No deployment or contest submission has been performed.

## Evidence and design decisions

- [Stage 05-10 evidence and sign-offs](docs/engineering/phase-signoffs/05-10.md)
- [Product contract](docs/product-contract.md) and [current architecture](docs/engineering/adr-002-core-journey.md)
- [Venue sources and attribution](data/venues/README.md); optional offline SQL generation: `python tools/import_venues.py --output artifacts/venues.sql` (never executes SQL)
- [Original staged prompt](prompt/QuietSpace_Copyable_Meta_Prompt_and_Codex_Stages.md); execution stops after Stage 10

Dependency audit on 2026-10-22: production dependencies report **0 vulnerabilities**; the inherited ESLint dependency chain reports **5 high findings** from one unpatched `braces` advisory. No forced Next lint-config downgrade was applied. Details and the upstream advisory are recorded in the stage evidence. The lockfile is genuine and CI uses `npm ci`; CI changes have not been run remotely.
