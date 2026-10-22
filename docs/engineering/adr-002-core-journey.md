# ADR 002: implementation through Stage 10

Date: 2026-10-22. Extends [ADR 001](adr-001-architecture.md), which records the initial 00-04 environment. User explicitly authorized continuing through Stage 10, superseding per-stage stop gates for this batch. No stages after 10 were started.

Node 24.20.0 and npm 11.19.0 are now installed on the host. The genuine dependency install produced `package-lock.json`; future clean installs use `npm ci`. PostgreSQL and real Supabase credentials remain unavailable. No runtime or database was installed at the OS level by this batch.

## Choices

- Server components own public reads and configuration. Native fetch calls Supabase REST with the anonymous role, never service-role public reads. Responses are mapped/validated; unsafe sources, malformed ratings and identities fail closed. Reports are approved-only, non-fixture and recent. Exact-count headers detect truncated bounded queries instead of presenting partial evidence as complete. Current bounds are 100 venues, 500 facility rows and 10,000 reports; exceeding a bound is explicitly unavailable, not silently truncated.
- Default curated mode shows the five actual source-reviewed venue records from Stage 04. It is visibly read-only, expires source/feature evidence, contains no community reports and uses source slugs as stable identifiers. It never invents DB UUIDs. Explicit supabase mode never falls back silently to local records on failure. The JSON importer and source-validation tests remain authoritative for curation; no network scraping runs at startup.
- Version-1 optional local preferences retain `maximumIntensities` as the storage key shape. Brightness now uses closeness to a selected level, as explicitly required by Stage 07; other dimensions use maximum tolerance. This supersedes the earlier all-maximum equation. Shared pure scoring uses approved observations, medians, 60 days, at least 3 per eligible dimension and noise plus another dimension. Counts/recency are separate from compatibility, with no confidence percentage.
- A small external browser store uses `useSyncExternalStore` for hydration-safe local preferences, corrupted-data recovery, cross-tab changes and memory fallback when storage is blocked. Nothing sends preferences to analytics, reports or the server.
- Reusable semantic fields, cards, evidence labels and snapshots share contracts. Neutral CSS tokens, system fonts, underlines, reduced motion, high-contrast focus and responsive list-first layouts require no image/font/map library or third-party assets.
- Discovery alone owns a Suspense loading boundary. Keeping a root loading boundary caused streamed missing-venue responses to be HTTP 200; removing it from detail/report routes restores actual 404 responses, verified in production-mode browser tests. See installed Next 16.4.2 `not-found.md` and `loading.md` guidance.
- Reporting uses a guarded server-only module and an independently testable Request/Response boundary. A narrow persistent SQL wrapper serializes rate checks and pending insertion. Daily HMAC network pseudonyms avoid retaining raw addresses; setup requires verified ingress and scheduled deletion. No public moderation endpoint exists; trusted operators use exact-row transactional SQL. Details: [reporting](reporting.md).
- No-JavaScript report submission is unavailable. A hydration gate disables submit before handlers attach and native fallback is POST, preventing accidental URL query disclosure. Errors retain fields and move focus to a named summary; successful receipts say pending.

## Dependencies and checks

One small production addition, `server-only`, prevents privileged module imports in client components. Development-only additions, Playwright and axe, exercise real browser flows and accessibility. No Supabase SDK, state-management library, icon set, map or extra validation runtime was added. Pure tests use Node's TypeScript support with `--test-isolation=none` to avoid unsupported worker spawning inside the restricted Windows sandbox. Next build/browser processes ran with approved sandbox escalation after actual EPERM failures.

Browser suites use production curated mode and a separate development server connected to a loopback test double. The test double is strictly test infrastructure; simulated approval is not database acceptance evidence. Its output directory is isolated so localhost:3000 can remain open during checks. Next automatically generates `AGENTS.md`, `next-env.d.ts` and type include entries; these changes are expected for the installed version.

CI now uses the real lockfile and adds Chromium browser checks. Local checks used installed headless Edge. CI itself has not been executed from this session. Source-reviewed records were not changed or re-dated.

## Release limits

Database migrations, anonymous RLS enforcement, persistent concurrent rate limits and real approval/publication remain unexecuted. Reporting stays disabled by default. No deployment, live URL, contest submission, user study, screen-reader study or performance certification is claimed. The next requested implementation phase would be 11; this batch stops at 10.
