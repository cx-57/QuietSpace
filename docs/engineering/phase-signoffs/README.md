# Implementation evidence

Latest: [Stages 11-18 release candidate](11-18.md), October 23, 2026. The local PostgreSQL app, RLS/moderation/concurrency suites, redesigned UI and browser demo are verified. Public deployment/submission remain external gates.

Latest batch: [Stages 05-10](05-10.md), implemented 2026-10-22. Application/build/browser checks pass; real database/RLS/reporting acceptance is still pending. Execution stopped after Stage 10.

The rest of this file is the historical 00-04 handoff, recorded on 2026-10-20. Its runtime availability statements describe that earlier session; see the latest batch for current state.

## Phases 00–04: evidence and review handoff

Date: 2026-10-20. Implementer: Codex. Starting commit: `4484ced`. No commit, push, external write, deployment or human approval was performed.

The user authorized the first five numbered phases together, then directed work **without Node and PostgreSQL**. This batch stops after phase 04. Source preparation is complete to the extent possible in that environment; runtime-dependent acceptance is explicitly pending.

| Phase | Deliverable | Acceptance status |
| --- | --- | --- |
| [00](00.md) | Actual baseline, dependency graph, risk register | Inventory complete; ready for review |
| [01](01.md) | Product contract, architecture, typed contracts and validation | Contract/desk review complete; TypeScript execution pending |
| [02](02.md) | Four setup routes, Next/Tailwind/TypeScript config, env template, scripts and CI | Prepared; npm install/lock/lint/types/tests/build/browser blocked by missing Node |
| [03](03.md) | Three-table migration, constraints, RLS/grants, server-only RPC and adversarial SQL suite | Prepared; migration and RLS runtime acceptance blocked by missing PostgreSQL |
| [04](04.md) | Five official-source venue records, offline import and tests | Python checks and SQL generation pass; database replay pending |

## Executed evidence

| Command / action | Actual result |
| --- | --- |
| Initial `node --version`, `npm --version` | Command not found |
| Python version | 3.14.6 |
| First `python -m unittest discover -s tests -p "test_*.py" -v` | 26 tests: 25 passed, 1 error because a system TEMP test directory was inaccessible |
| Same suite after moving that fixture to a bounded workspace artifact file | **26 passed**, exit 0 |
| `python tools/import_venues.py` | Validated 5 real venue records; no database writes; exit 0 |
| `python tools/import_venues.py --as-of 2026-10-20T23:59:59Z --output artifacts/venues.sql` | Generated reviewable SQL for 5 venues and 25 explicit facility states; no DB execution; exit 0 |
| `git diff --check` | Exit 0 |
| `git status --short`, untracked-file inventory | New project files plus original untracked prompt; existing `text.txt` deletion preserved |
| Official BPL source review via web tool | Five location pages with address/entrance facts reviewed; source URLs and limits recorded in venue sheet |
| Manual source review by Codex | Grants, policies, timestamp/null semantics, freshness, SQL escaping, client credential references, setup copy inspected |

The Python suite covers malformed/unknown fields, bad/partial/nonfinite coordinates, duplicate identity/source data, missing/unsafe sources, public access, fictional flags, stale/future evidence, verified false versus unknown, malicious SQL text escaping, duplicate JSON keys, deterministic output, CLI safety, Git ignores and static cross-layer/security checks. Static SQL checks are not RLS execution evidence.

## Unexecuted checks and reproducible next verification

- With Node 24/npm available: `npm install`, review/commit generated lockfile, `npm run check`, then a production-mode/browser deep-link, keyboard and resize review. Thereafter use `npm ci`.
- With disposable PostgreSQL 15+ available: follow [database instructions](../database.md) for role bootstrap (vanilla only), migration, transactional `foundation.sql` tests and `import_replay.sql` tests.
- Supabase Data API public-role checks, actual moderator workflow, real deployment, browser screenshots, automated accessibility scans, screen reader/user study and production performance: **not performed**. They cannot be inferred from source inspection.
- Report HTTP endpoint and abuse controls: not implemented, so do not enable public submissions. No public write route exists.

## Skeptical review and fixes

- Removed dependence on system TEMP for an executable test after the actual permission failure; its single workspace artifact is checked before cleanup.
- Rejected uppercase URL schemes to keep Python imports aligned with SQL's source URL constraint.
- Added calendar/time and offset bounds to reject normalized impossible dates, `24:00` and malformed/out-of-range offsets.
- Generated SQL disables backslash interpretation, doubles quotes and avoids identifier interpolation; hostile text is exercised by tests.
- Freshness and parent visibility are enforced by public database policies; facility view uses invoker security. Source review is never described as sensory evidence.
- Import replay preserves IDs and creation times; newer evidence is protected against older batches. Actual DB execution remains required to confirm this behavior.
- Source page's “accessible entrance” wording stays narrower than whole-building or toilet access; other facilities and all observations remain unknown.
- No third-party requests, secrets, analytics or automatic data seed are introduced to setup routes.

GO for human review of prepared sources. **NO-GO for release or any claim of a verified running application/database.** Phase 05 was not started. Runtime/credential gaps are documented instead of seeking permission to install tools contrary to the user's instruction.
