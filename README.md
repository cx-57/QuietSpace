# QuietSpace

Find a place that feels right. A list-first sensory preference directory for public venues, built without requiring a diagnosis or device location.

**Current state:** phases **00–04** have prepared the product contract, Next.js scaffold, database migration/security test suite and five sourced Boston public-library records with an offline importer. The four routes are informational setup pages. Discovery, preference controls, scoring, report submission and moderation workflows begin in later phases. This is not a released MVP.

Node/npm and PostgreSQL are unavailable in the current development session. No dependencies were installed, no lockfile generated, and no app build, browser test or database execution is claimed. See [phase evidence](docs/engineering/phase-signoffs/README.md).

## Run checks without Node or PostgreSQL

Python 3.11+ and Git, no third-party packages:

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
python tools/import_venues.py
python tools/import_venues.py --output artifacts/venues.sql
git diff --check
```

The importer validates only unless `--output` is specified. Generated SQL is ignored by Git and never executed automatically. Venue source facts expire; if validation later reports stale evidence, review official sources rather than changing timestamps without review. Dataset and attribution: [venue sheet](data/venues/README.md).

## Application bootstrap when Node becomes available

Use Node 24 LTS and npm. There was no original lockfile, so the **first** real install is:

```powershell
npm install
npm run check
npm run dev
```

Review the generated `package-lock.json` and dependency audit output; commit the genuine lockfile before relying on reproducible installs. Thereafter use `npm ci` and `npm run check`. CI includes a documented initial install bridge and uploads the generated lockfile. CI has not run in this session. `npm test` runs Node's test runner against pure TypeScript contract checks; it does not imply database tests.

Open `http://localhost:3000`. No env file or Supabase keys are needed for setup pages. No external font/image/map requests are configured. The first dependency resolution, lint, typecheck and production build still need validation on that provisioned runtime.

## Database and boundaries

[Database setup and verification](docs/engineering/database.md) describes a **disposable PostgreSQL 15+** workflow, role tests, migration replay and recovery. No hosted service has been contacted or changed. Do not apply test fixtures to production. Future public reads use RLS; future writes pass through a protected server path and pending-only RPC. No browser role can submit or moderate directly.

`.env.example` separates public URL/anonymous configuration from future server-only service credentials. All values are blank. Never prefix an administrative secret with `NEXT_PUBLIC_`. No credentials are necessary for the offline import or existing setup pages.

Read the [product contract](docs/product-contract.md), [architecture decision](docs/engineering/adr-001-architecture.md), [original staged prompt](prompt/QuietSpace_Copyable_Meta_Prompt_and_Codex_Stages.md), and [implementation evidence](docs/engineering/phase-signoffs/README.md) before continuing with phase 05. Existing user deletion of `text.txt` and the supplied prompt are preserved.
