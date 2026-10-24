# QuietSpace

Find a place that feels right. A calm neighborhood guide to public places, with private sensory preferences, source-reviewed facilities and moderated observations.

The app includes discovery, strict access filters, local preference persistence, explainable matching, venue details, real PostgreSQL report submission, operator moderation, evidence reliability and historical periods. **Community** includes an evidence-based participation dashboard, structured approved sensory reviews (not fake testimonials), places awaiting observations, and public GitHub templates for proposing venues and providing usability feedback. With a low-noise preference (1–2/5), default suggested ordering prioritizes fresh, source-listed quiet/study spaces among unscored venues. This is a **facility signal, never a noise measurement or fit score**; numeric matches still require sufficient approved reports. The curated directory now covers **11 real Boston places: eight public libraries, two parks/gardens, and one museum**. Visitors can choose six sensory starting points, filter by place type, require source-verified facilities, and fine-tune noise, crowds, brightness and scent individually. Presets describe **user preferences**, not verified sensory attributes of venues. Their unknown sensory conditions remain unknown; no community observations were invented for these venues.

## Quick start on macOS

See **[Mac quickstart and final-run checklist](docs/quickstart-macos.md)** for curated read-only mode, Python 3, Chromium, optional local PostgreSQL, moderated report checks and the updated demo. You do not need a database to review the initial guide.

## Run the complete local app

Node 24, npm, Python 3.11+, and PostgreSQL tools are required. On this machine PostgreSQL is installed under `C:/Program Files/PostgreSQL/18/bin`; set `PG_BIN` if yours is elsewhere.

```powershell
npm ci
npm run setup:local
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open **[http://localhost:3000](http://localhost:3000)**. Setup creates a dedicated loopback PostgreSQL cluster on port 55432, applies migrations, imports the currently reviewed sourced venues and writes an ignored `.env.local` with restricted application credentials. It preserves an existing custom env file. The development cluster uses loopback trust authentication; never expose or deploy it.

With no configuration, the app instead offers the sourced Boston places as a clearly labeled **read-only curated guide**. Community reviews show an honest zero state, and the submission CTA is hidden when reporting is disabled. The five verified quiet/study facilities are present in the curated dataset; for a connected database, rerun the reviewed venue importer and apply its SQL (see [database setup](docs/engineering/database.md)) so source-backed quiet results also appear there. Choose `QUIETSPACE_DATA_MODE=postgres` for direct role-constrained transactions or `supabase` for the existing REST adapter. A connected-service failure never silently substitutes local data.

## Browse different environments

The homepage now offers **Focus & study**, **Low stimulation**, **Space to yourself**, **Softer lighting**, **Low fragrance**, and **Comfortable with activity** as six optional starting points. The four individual intensity controls and strict verified-facility requirements remain available. Presets never erase facility requirements, and selecting a preset twice clears only its sensory levels. Venue-type controls cover the categories actually in the sourced directory. The museum may require admission; official links give visit requirements.

These choices do **not** predict real noise, crowds, scents or brightness where community evidence is absent. Only a low-noise preference has an official facility-only fallback: verified quiet/study areas are prioritized among unscored locations. Other preferences result in explicitly unknown sensory ratings and category/facility browsing until legitimate moderated reports are available.

## Community participation

Read the [community contribution guidelines](CONTRIBUTING.md) for trustworthy source requirements, moderated sensory check-ins, public GitHub feedback and privacy expectations.

- The `/community` route gives real counts of eligible approved observations, shows places that need firsthand reports, and links to public GitHub issue templates for suggesting new venues and improving the product. GitHub suggestions require the repository to be **public**, and users must sign in; issues and usernames are public.
- Venues display up to six structured **approved** community sensory check-ins. There are no star ratings, free-text testimonials, accounts or synthetic public reviews. The page rounds visit dates to the month; **approved exact timestamps remain available in the public data** used for scoring, as disclosed on the privacy page.
- Community report submission requires connected PostgreSQL/Supabase, trusted overwritten IP headers, a configured HTTPS origin, rate-limiting credentials and an operating moderator. Curated read-only mode never silently accepts data.
- Before enabling public submissions, verify production ingress, cleanup, RLS, moderation and data-retention requirements in [reporting setup](docs/engineering/reporting.md). Running the site in curated mode remains the safe fallback.

## Moderate observations

```powershell
npm run moderate -- pending
npm run moderate -- approve REPORT_UUID
npm run moderate -- reject REPORT_UUID
npm run moderate -- purge
```

Only a trusted operator uses these commands. `LOCAL_OPERATOR_DATABASE_URL` is separate from the application login. Every submission starts pending; only approval makes it public. Anonymous clients cannot write rows or approve reports. The PostgreSQL app purges expired abuse tokens on startup and hourly; Supabase/serverless deployments require an external schedule.

## Check the app

```powershell
npm run check
python -m unittest discover -s tests -p "test_*.py" -v
npm run test:database
node tools/prepare-browser-db.mjs
$env:QUIETSPACE_REAL_DATABASE_TESTS = '1'
npm run test:e2e
npm run check:release
```

`check` runs ESLint, TypeScript, the Node test suite and the packaged production build. Python supplies importer/cross-layer checks. Database tests create and remove an isolated verification database, exercising migrations, RLS, pending/approval/rejection, persistent limits, cleanup and import replay. Browser tests cover curated production mode, a controlled REST test double, and actual PostgreSQL, including concurrent submissions. Synthetic records are confined to separate test databases and ports.

Browser tests default to installed Edge. For Chromium, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. They manage ports 3100–3102 and 3987. Screenshots are under ignored `artifacts/release-desktop.png` and `artifacts/release-mobile.png`. Automated checks do not replace a screen-reader or user study. CI is configured for PostgreSQL and Chromium. GitHub Actions attempts on October 23–24 failed before assigning a runner; those jobs do not establish whether the current code passes or fails its tests. Check the latest run and run the commands above in a compatible environment before production use.

## Demo and release

```powershell
npx playwright install ffmpeg
npm run demo:record
```

This produces `artifacts/quietspace-demo.webm`: a silent, captioned 2–3 minute browser recording. Report scenes explicitly use synthetic data in a separate database. It also records a local production-build performance sample in `artifacts/performance.json`. No video has been uploaded or submitted.

`npm run build` creates a self-contained `.next/standalone` app with its local images/fonts. `npm start` serves that package and accepts `--port`. The [Dockerfile](Dockerfile), [Compose stack](compose.yaml) and [release checklist](docs/release-checklist.md) prepare a Linux deployment; containers and a public host have not been run from this session. Production reporting requires HTTPS, a verified overwritten ingress IP header, restricted database credentials and monitored cleanup.

## Design and evidence

- [Implementation and final evidence](docs/engineering/phase-signoffs/11-18.md)
- [Design direction and research](docs/engineering/design-direction.md)
- [Neighborhood Hacks submission draft](docs/submission/neighborhood-hacks.md) and [demo narration](docs/submission/demo-script.md)
- [Product contract](docs/product-contract.md), [database notes](docs/engineering/database.md), [reporting setup](docs/engineering/reporting.md)
- [Venue sourcing](data/venues/README.md) and [third-party notices](THIRD_PARTY_NOTICES.md)

The redesign uses a custom arch identity, self-hosted typography, indexed venue rows, quiet colors and an attributed public-domain archival photograph. The optional embedded map is deliberately deferred because all venue coordinates remain unverified. List navigation is complete without it.

Production dependency audit: **0 reported vulnerabilities** on October 23, 2026. The inherited development-only ESLint/braces advisory remains documented in the sign-off; no forced framework downgrade was applied. The lockfile is genuine. The code changes in [PR #1](https://github.com/cx-57/QuietSpace/pull/1) were committed through GitHub. No public deployment, Devpost submission, fabricated user research or current-conditions guarantee is claimed.
