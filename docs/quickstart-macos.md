# Run QuietSpace on macOS

Use these instructions for the merged repository. **Default curated mode includes 29 real sourced public places**, six preference choices, accounts and written reviews. Accounts and reviews use Node 24 SQLite locally; moderated sensory observations use the optional database setup below. You do **not** need PostgreSQL to open and review that version.

## 1. Install prerequisites

You need **Node.js 24**, npm, Python 3.11+ and Git. With Homebrew:

```bash
brew install node@24 python
export PATH="$(brew --prefix node@24)/bin:$PATH"
node --version      # must be v24.x
python3 --version
```

Clone through your authenticated GitHub connection (the repository is currently private):

```bash
git clone https://github.com/cx-57/QuietSpace.git
cd QuietSpace
git checkout main
git pull --ff-only
npm ci
```

Never paste GitHub tokens into commands, commit credentials or include a local `.env.local` in a screen recording.

## 2. Verify and run the safe public-guide mode

```bash
npm run check
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 tools/import_venues.py
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
npm run check:release
```

`npm run check` includes lint, TypeScript, Node tests and a production build. The Playwright suite uses the production build plus a **loopback-only mock service**; it does not require a live database. It uses test ports 3100, 3101 and 3987, so close conflicting processes first. No real reviews or fit scores are manufactured.

To view the app:

```bash
QUIETSPACE_DATA_MODE=curated REPORTS_ENABLED=false npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000 and verify:

1. Six atmosphere choices appear: Focus & Study, Low Stimulation, Space to Yourself, Softer Lighting, Low Fragrance and Comfortable with Activity.
2. Place-type choices show **23 libraries, 5 parks/gardens, 1 museum**; `All spaces` shows 29.
3. Strict `Accessible entrance` returns only venues with source-verified entrance evidence, not all 29. `Listed quiet/study area` likewise requires official evidence.
4. Visit `/community`. Choose a place, sign in or create an account, and publish a written review. Written reviews are separate from moderator-approved sensory observations.
5. Check both desktop and mobile widths and the venue's source links. Missing sensory levels remain unknown.

## 3. Optional: test real moderated community reports

Do this on a **local disposable database only**. Install PostgreSQL 18:

```bash
brew install postgresql@18
export PATH="$(brew --prefix postgresql@18)/bin:$PATH"
which initdb pg_ctl psql
npm run setup:local
npm run test:database
node tools/prepare-browser-db.mjs
QUIETSPACE_REAL_DATABASE_TESTS=1 PLAYWRIGHT_CHANNEL=chromium npm run test:e2e
```

`setup:local` creates an isolated cluster under ignored `artifacts/pgdata` on `127.0.0.1:55432` and writes a protected ignored `.env.local`. It **does not** connect to or replace a remote database. If a custom `.env.local` exists, the setup script refuses to replace it. Do not run it against an existing production service.

To inspect local pending submissions, use `npm run moderate -- pending`; approving or rejecting requires a real report ID and the local operator database connection. Synthetic browser fixtures live in the isolated `quietspace_browser_test` database and must never be copied to the public directory.

After tests, run a local app with:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

A generated local `.env.local` defaults to PostgreSQL/reporting on localhost. To return to safe read-only mode, use the **explicit curated command** in section 2.

## 4. Record the updated demo (requires the test database)

```bash
npx playwright install ffmpeg
PLAYWRIGHT_CHANNEL=chromium npm run demo:record
```

After building and preparing `quietspace_browser_test`, this records a captioned WebM in ignored `artifacts/quietspace-demo.webm` with the new six-option discovery, place types, source provenance and **explicitly synthetic** test submissions/approvals. Review the footage before publishing—its creation is not a claim of real user participation.

**Time-limited fallback:** If PostgreSQL or automated recording is unavailable, start the read-only curated app from section 2, press **Shift–Command–5** on macOS, choose screen recording, and make a **2–6-minute real screen capture**. Show the six presets, place-type filters, source-backed facilities, one venue detail, and the honest `/community` zero state. State explicitly that real community reporting is not yet enabled. This is preferable to fabricating reviews or missing the submission deadline while debugging a demo tool.

## 5. Outstanding publishing steps

- GitHub Actions currently fails before runners start. These commands are the replacement executable verification until CI access is repaired; do **not** claim a green CI run until it exists.
- Vercel workspace authorization is blocked in the current connector. A live URL has **not** been verified. For manual dashboard deployment, go to [Vercel New Project](https://vercel.com/new), import `cx-57/QuietSpace` from GitHub (grant Vercel repository access if required), use **Next.js**, repo root, production branch `main`, and choose **read-only** environment variables `QUIETSPACE_DATA_MODE=curated` and `REPORTS_ENABLED=false`. Do not add production database secrets until reporting ingress/RLS/cleanup are verified. Check the resulting URL on desktop and phone.
- Verify the final live version's actual URL, basic routes (`/`, `/community`, `/spaces/bpl-central`, `/privacy`), and security/error states before linking it publicly.
- The repository is still private. Check secrets, license notices and commit history before making it public; public GitHub issue templates require public visibility and a GitHub login.
- Production report collection must remain **off** until HTTPS origin, ingress IP trust, RLS, rate limits, operator moderation and cleanup have been verified. See `docs/engineering/reporting.md`.
- The Neighborhood Hacks submission and demo upload are manual account actions and remain unverified.

If any verification step fails, stop and preserve the **exact error text**, the command used, and the first relevant failing stack trace. Avoid screenshots of secrets or files in `artifacts/pgdata`.
