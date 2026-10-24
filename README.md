# QuietSpace

Find a place that feels right. A calm neighborhood guide to public places, with private sensory preferences, source-reviewed facilities and moderated observations.

The directory includes **29 Boston places: 23 libraries, five parks and one museum**. Search by place or neighborhood, choose preferences for instant suggestions, and open a place to plan a visit or write a review.

## Run locally

Use Node.js 24 and npm:

```bash
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open [localhost:3000](http://localhost:3000). No PostgreSQL setup is required for browsing, accounts, saved preferences or written reviews.

## Accounts and reviews

Create an account at `/account` with a username, display name and a password of at least 12 characters. Passwords are salted and hashed; sessions use HTTP-only cookies. Account data, saved preferences and written reviews persist in `artifacts/community/community.sqlite` (ignored by Git). Set `QUIETSPACE_STORAGE_DIR` to an absolute persistent directory when running a server elsewhere. Back up that directory to preserve accounts and reviews. This SQLite setup is for one server with durable disk; it is not shared storage for ephemeral or multiple server instances. Email-based recovery is not implemented.

Choose a place from `/community` or click **Write a review** on any place. Signed-in visitors can publish overall stars, optional quietness/personal-space/soft-lighting/low-fragrance stars and text, then delete their own review. Each attribute has its own average and count over reviews posted in the last 60 days. Unrated attributes are excluded; deleting a review recalculates the averages. Written reviews are labeled unverified visitor experiences and do not become moderator-approved sensory observations. Preferences save automatically in the browser; **Save to my account** also stores them on the server and restores them on sign-in.

## Suggestions

Sensory presets prioritize actual visitor attribute averages when available, with category/facility suggestions as a fallback. Five attribute stars mean quieter, more personal space, softer/dimmer lighting or less fragrance; matching converts these to the intensity scale used by preferences. Brightness is compared to the preferred level; noise, crowds and scent are compared to the preferred maximum. Overall satisfaction stars are never used as a sensory measurement. Each card explains the recommendation, and partial ratings are labeled. These are recommendations to explore, not measurements of current noise, crowding, lighting or scent. Required facilities still exclude unverified locations. Numeric sensory scores retain the evidence requirements of the existing scoring system.

## Optional moderated sensory observations

The existing PostgreSQL/Supabase adapters, structured-report validation and moderation tools remain available. See [database setup](docs/engineering/database.md) and [reporting setup](docs/engineering/reporting.md). `REPORTS_ENABLED` controls this separate structured observation pipeline; it does not disable account-based written reviews.

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
