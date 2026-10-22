# QuietSpace - Meta Prompt + Staged Codex Execution Prompts

**How to use:** The meta-prompt generates a new staged playbook. If you want to build now, copy only ONE phase at a time into Codex. Review and approve each phase before the next. No phase below has been executed.

## A. Meta-prompt to generate/refine a Codex playbook

```text
You are a principal full-stack engineer, accessibility specialist, application security reviewer, data architect, test lead, and pragmatic hackathon technical director. Your job is NOT to generate an entire app in one response. Your job is to generate an exceptionally detailed, PDF-ready STAGED CODEX IMPLEMENTATION PLAYBOOK for the project described below, with self-contained, copy-and-paste prompts that are executed ONE PHASE AT A TIME against a real repository.

PROJECT: QuietSpace - "Find a place that feels right." A low-stimulation, responsive web app that helps people identify publicly accessible places fitting personal noise, crowd, light, and scent preferences. People should be able to set preferences without medical disclosure, discover real spaces, inspect observational evidence and facility accessibility, and contribute moderated anonymous sensory reports. The initial blueprint proposes Next.js + TypeScript + Tailwind + Supabase/PostgreSQL, optional Leaflet map, and four primary routes: /, /preferences, /spaces/[id], /spaces/[id]/report. It proposes three MVP tables (spaces, space_features, sensory_reports), with ratings on a 1-5 scale, nullable unknowns, and pending/approved/rejected moderation.

PRODUCT NONNEGOTIABLES:
- Prioritize an exceptional end-to-end core product rather than flashy partial features. MVP P0: filters, verified sourced locations, detail pages, matching, reports, uncertainty, accessible navigation. Optional P1 after P0 passes: historic quiet periods and map. Out of scope for the initial hackathon: AI forecasts, accounts, notifications, social features.
- Build on existing repository code; never assume the repository, starter ZIP, migrations, or dependencies are present. Inspect first. Honor its actual package manager and scripts. Avoid unnecessary rewrites or extra dependencies.
- Preserve privacy and avoid collecting medical diagnoses, unnecessary exact user location, sensitive venue details, or personally identifying details from report submitters.
- Only legitimate public venues; 5-10 real sourced records for a demo. No fabricated "verified" reports, hours, features, noise observations, live status, user research, or acceptance-test results. Label fixtures as DEMO/SAMPLE.
- Community reports require server validation, abuse controls, a default pending moderation state, and publication only after approval. Never ship service-role keys to browser. Configure and verify row-level security.
- The 1-5 inputs represent sensory intensity, not medical judgments. Unknown must stay NULL. Match scores are an explainable preference heuristic, never a clinical diagnosis or a guarantee of current conditions.
- Proposed scoring weights: noise .40, crowds .25, brightness .20, scent .15; use only eligible dimensions and renormalize weights. At least three recent approved observations per scored dimension and at least two dimensions including noise before a number appears. A required accessibility feature with unknown verification should fail strict access filtering rather than be presumed available.
- Keep matching separate from evidence reliability. Quiet-hours use the venue time zone, weekday/weekend, morning/afternoon/evening bins, and the median of approved observations; do not show a historical pattern for a group with fewer than three observations from the last 60 days. Historic patterns are never real-time promises.
- Accessibility first: list view default, optional map only; readable high-contrast type, clear labels, keyboard and screen-reader flow, consistent navigation, visible focus, touch targets, reduced motion, no autoplay sound, no unexplained alert animations, informative empty/error/loading states, and no color-only meaning.
- Verify current contest rules, deadlines and demo-video restrictions from official sources; do not assume the original blueprint dates are still valid.

YOUR ASSIGNMENT: Create a substantial PDF-ready engineering playbook (aim for enough detail to support approximately 25-45 pages, not padded prose). Organize it into a cover, contents, product contract, architecture and security principles, execution protocol, phase dependency graph, priority schedule, full phase-by-phase Codex prompts, quality gates, test matrices, go/no-go demo release criteria, and a reusable sign-off template. You may also output plain Markdown so prompts are easy to copy.

For EACH PHASE, include ALL of these and make each distinct: phase ID and name; P0/P1 priority; why it exists; preconditions and exact files/data to inspect; intended changes and out-of-scope items; affected routes/components/database endpoints; dependencies on earlier phases; a FULL COPYABLE CODEX EXECUTION PROMPT addressed directly to the coding agent; integration contracts and upstream/downstream checks; test commands to discover and execute (never invent a pre-existing script); negative and edge-case tests; accessibility/privacy/security review; evidence or proof required; explicit acceptance criteria; and a STOP gate for human approval.

The Codex prompt of every phase MUST require Codex to: (1) inspect repository state and summarize it briefly, (2) make the smallest coherent set of production-grade changes, (3) keep types and validation aligned client/server/DB, (4) test both new and existing flows, (5) perform adversarial review and fix confirmed defects, (6) report modified files, tests, screenshots or manual steps, remaining risk, and (7) STOP WITHOUT AUTOSTARTING THE NEXT PHASE. Where secrets, production data, or external accounts are needed, provide exact safe setup instructions and a local fallback. Do not claim to have executed anything without command output.

Define phases in dependency order covering: audit and scope freeze, architecture, tooling/scaffold, schema/RLS, public venue sourcing, accessible shell/design system, local preferences, scoring, discovery, venue details, report submission and moderation, reliability, full workflow integration, accessibility, security/performance, deployment, optional quiet-hours, optional map, and demo/submission. Prefer independently testable vertical slices over a flood of disconnected UI files.

Provide a rigorous checkpoint rubric: functionality, integration, truthfulness of data, accessibility, security/privacy, maintainability, performance, and demo reliability. Explain hard blockers, regression tests, and when to defer stretch features. At the very end output a compact INDEX OF PROMPTS, an order-of-execution table, and a "Next Codex message" for PHASE 00 only. Do NOT implement the application or output a huge source code dump. Do NOT tell Codex to work on all phases at once. If you can generate a PDF, export a readable searchable PDF and a copyable Markdown companion; otherwise give structured Markdown suitable for PDF export.

OUTPUT QUALITY BAR: Not generic project management. Be specific to QuietSpace's routes, 1-5 data semantics, RLS/moderation, match thresholds, missing-data handling, venue provenance, source links, responsive accessibility, historical time zone logic, and authentic hackathon presentation. Each phase should result in a meaningful verified improvement, not just a promise.
```

## B. Copy/paste Codex execution prompts

### PHASE 00 - Repository reconnaissance and risk map (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 00: Repository reconnaissance and risk map. Outcome: A truthful inventory of what already exists and a constrained execution plan; NO premature feature coding. Dependencies: None. Priority: P0.

FIRST INSPECT:
1. Repository tree, git status, README, package/lockfiles, existing app routes, config, tests, database scripts, deployment notes.
2. Look for any attached starter SQL/TypeScript code, but do not assert it exists.

IMPLEMENT:
1. Create docs/engineering/00-repo-baseline.md summarizing real files, versions, scripts, commands, known failures and gaps.
2. Record a concrete P0/P1 dependency graph with one-verifiable-deliverable-per-stage planning.
3. Add a risk register prioritizing missing env keys, bad sample provenance, data access, moderation and accessibility.

INTEGRATE:
1. Inventory current API/UI/database contracts; mark missing ones as unimplemented.
2. Avoid reinstalling packages or modifying lockfiles simply for inventory.

VERIFY:
1. Run only safe existing checks discovered in repository; log actual command and result.
2. Confirm clean/readable git diff and that no unrelated file was changed.

RED-TEAM:
1. Challenge every assumed file, test script and dependency against the actual tree.
2. Check whether the README or demo suggests unsupported real-time claims.

ACCEPTANCE:
1. A reproducible baseline and blocker list exist.
2. No features quietly implemented, no secrets printed, no invented test results.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 01 - Product contract and architecture decisions (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 01: Product contract and architecture decisions. Outcome: A stable source of truth for endpoints, data semantics, user journeys and scope. Dependencies: 00. Priority: P0.

FIRST INSPECT:
1. Read baseline, user-provided project brief and any current design/specification docs.
2. Inspect current routes/data contracts rather than imagining them.

IMPLEMENT:
1. Write docs/product-contract.md defining the four routes, main journey, P0 functionality and explicit non-goals.
2. Write docs/engineering/adr-001-architecture.md explaining stack choices, data ownership, validation boundaries and privacy.
3. Define typed contracts for space summary, details, features with verified/unknown metadata, reports, match result, reliability and error states.
4. Document design constraints: no diagnosis, no required geolocation, list-first and never real-time prediction.

INTEGRATE:
1. Map each planned component to its consuming route and database/API source.
2. Record time zone, moderation, null vs 0 and report approval policy as cross-layer invariants.

VERIFY:
1. Review contracts using 3 representative journeys and a no-data journey.
2. Check sample payloads against nullable fields and absence of credentials.

RED-TEAM:
1. Find any UI copy that could convert historical reports into certainty.
2. Check tri-state access features: verified true, verified false, unknown.

ACCEPTANCE:
1. Product contract is coherent and traceable to source brief.
2. Scope and interface ambiguities are documented as decisions, not silently fabricated.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 02 - Toolchain, environment and deterministic checks (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 02: Toolchain, environment and deterministic checks. Outcome: A runnable, maintainable Next.js stack with reliable local commands. Dependencies: 00, 01. Priority: P0.

FIRST INSPECT:
1. Read existing package manager, Next.js config, tsconfig, styling, lint, tests, env examples, hosting setup.

IMPLEMENT:
1. Scaffold only what is absent; prefer existing Next.js App Router + TypeScript + Tailwind conventions.
2. Add a checked-in .env.example with safe public names and server-only secrets clearly separated; never commit credentials.
3. Establish/repair lint, typecheck, test and build commands if actually supported by selected tooling.
4. Add simple CI workflow and a concise local bootstrap guide without overengineering.

INTEGRATE:
1. Make sure initial pages/build pass without real Supabase secrets by showing a clear setup state, not spoofed production data.
2. Avoid package churn; justify every new dependency in stage report.

VERIFY:
1. Run install using existing lockfile strategy, typecheck, lint and build where feasible.
2. Check gitignore handling for env files, generated output and logs.

RED-TEAM:
1. Search bundle source for service-role keys or admin credentials.
2. Verify CI does not require production credentials merely to lint/test.

ACCEPTANCE:
1. Documented clean install/build path exists or exact blocker is reported.
2. No high-risk new dependency or security regression.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 03 - Schema, migrations, row-level security and integrity (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 03: Schema, migrations, row-level security and integrity. Outcome: A robust data foundation that cannot publish unapproved reports. Dependencies: 01, 02. Priority: P0.

FIRST INSPECT:
1. Existing Supabase folder, migrations, schema, generated DB types and runtime queries.

IMPLEMENT:
1. Implement versioned SQL migrations for spaces, space_features and sensory_reports with valid foreign keys and useful indexes.
2. Store address, coordinates, venue time_zone, published flag, source references, checked_at and provenance/status; design facility values to preserve unknown.
3. Enforce ratings integer 1-5 or NULL; observed_at timestamps; moderation status default pending; prevent client-controlled approval.
4. Create least-privilege RLS/policies: public reads only published spaces and approved reports, limited safe report insert path, protected admin moderation.
5. Add deterministic sample fixtures for tests only, explicitly marked fictitious.

INTEGRATE:
1. Align SQL constraints to app type contracts and server validation.
2. Audit downstream read queries for approved-only data and unpublished spaces.

VERIFY:
1. Execute migrations in safe local/test environment, then verify rollback/replay strategy.
2. Test anonymous read of published/unpublished/pending records and attempts to write privileged columns.

RED-TEAM:
1. Try bypassing RLS and approval visibility with altered status/user-supplied fields.
2. Test null values, out-of-range numbers and broken foreign keys.

ACCEPTANCE:
1. No unauthorized public read/write of protected rows.
2. Schema reproducible and mismatched type semantics resolved.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 04 - Truthful venue sourcing and import pipeline (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 04: Truthful venue sourcing and import pipeline. Outcome: 5-10 legitimately public, attributable venue records rather than a misleading fake directory. Dependencies: 03. Priority: P0.

FIRST INSPECT:
1. Current seed/import scripts, sourced venue files, permissions, terms and existing fixture labels.

IMPLEMENT:
1. Design a small curated data sheet or import format with name, public address, source URL, observed/verified timestamps, publishing status and verified facility evidence.
2. Implement validation and deduplication and produce safe seed/import tooling appropriate to repo.
3. Populate only known, publicly accessible locations with sourced facts the maintainer can verify; if offline, provide a clearly marked unverified-import TODO rather than invented venues.
4. Keep development fixtures visibly separate from demo public data.

INTEGRATE:
1. Ensure detail pages and filters can tell verified, community-reported and unknown apart.
2. Treat stale hours, amenities or broken source URLs as unknown/needs review.

VERIFY:
1. Exercise bad coordinates, duplicate names, missing source URL, restricted place, stale timestamp and fictional flag.
2. Check database writes are idempotent on repeated imports.

RED-TEAM:
1. Reject private refuge rooms, school-only restricted spaces and locations with dubious public access.
2. Check no fabricated report counts or "currently quiet" claims are added as import metadata.

ACCEPTANCE:
1. An auditable venue sheet/import exists with source links and explicit verification states.
2. No unsourced claims promoted to verified.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 05 - Calm design system and accessible app shell (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 05: Calm design system and accessible app shell. Outcome: A polished low-stimulation experience with predictable navigation and semantic foundations. Dependencies: 02, 01. Priority: P0.

FIRST INSPECT:
1. Existing layouts/styles, design components, fonts, forms, color tokens, navigation and responsive breakpoints.

IMPLEMENT:
1. Implement consistent spacing, type scale, neutral/sensory-safe palette, contrast, responsive grid and predictable navigation.
2. Build accessible shell, header, skip link, loading/error/not-found and empty states for /, /preferences and /spaces/[id].
3. Create reusable SpaceCard, SensorySnapshot, ConfidenceLabel, form fields and status primitives, only as needed by real routes.
4. Honor prefers-reduced-motion, keyboard focus, semantic headings, large targets and screen-reader labels.

INTEGRATE:
1. Components consume the typed contracts instead of hardcoded invented backend values.
2. Keep list view primary and do not require map or geolocation for core navigation.

VERIFY:
1. Keyboard-only navigate all routes, verify focus, tab order, forms and 320px/mobile layouts.
2. Run automated accessibility tooling if present, plus human smoke checks.

RED-TEAM:
1. Check color is never the sole indicator and controls have meaningful empty/loading states.
2. Find any animation, auto-play audio or attention-grabbing notification.

ACCEPTANCE:
1. Navigation, design primitives and baseline a11y smoke checks work.
2. No fake recommendation content disguised as live data.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 06 - Preferences, persistence and strict accessibility filters (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 06: Preferences, persistence and strict accessibility filters. Outcome: A privacy-respecting preference system that updates the product without requiring an account. Dependencies: 01, 05. Priority: P0.

FIRST INSPECT:
1. Preference screen, existing browser storage helpers, default settings, type contracts.

IMPLEMENT:
1. Implement noise/crowd/scent tolerance 1-5, selected brightness 1-5 and optional verified facility requirements.
2. Persist preferences locally with schema/version validation, sensible defaults, reset and recoverable malformed-storage behavior.
3. Support route navigation without losing preferences; no diagnosis questions or mandatory precise location.
4. Make filtering semantics explicit: unknown required step-free access fails strict verification filter.

INTEGRATE:
1. Expose typed preference selectors consumed by discover results and matching logic.
2. Prevent preferences from being mistaken for public user reports or sent to analytics by default.

VERIFY:
1. First visit, updated input, persistence after reload, clear/reset, invalid local storage, disabled storage and keyboard use.
2. Test unknown facility versus verified false and verified true in strict filters.

RED-TEAM:
1. Verify no medical fields or hidden geo collection.
2. Check accessible labels, range descriptions and meaningful feedback for reset.

ACCEPTANCE:
1. Preferences remain stable across refresh and route changes.
2. Strict access filtering has no false positives from unknown data.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 07 - Deterministic matching engine and test oracle (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 07: Deterministic matching engine and test oracle. Outcome: An explainable score that is resistant to sparse data and false certainty. Dependencies: 03, 06. Priority: P0.

FIRST INSPECT:
1. Existing lib/sensory-score.ts or equivalent; current report selectors and proposed algorithm.

IMPLEMENT:
1. Implement pure typed scoring utilities isolated from UI and DB; only approved eligible recent observations count.
2. Apply weights noise .40, crowd .25, light .20, scent .15; score tolerated noise/crowd/scent and preferred light closeness; renormalize available eligible weights.
3. Require >=3 recent eligible reports per dimension and >=2 scored dimensions including noise; otherwise return explicit insufficient-data result.
4. Keep the score separate from evidence reliability; attach an explanation with contributing dimensions, eligible report counts, time window and caveat.

INTEGRATE:
1. Connect stable algorithm interface to card/detail components; no duplicate scoring math in React views.
2. Review whether each rating represents an observation at observed_at and null never contributes as zero.

VERIFY:
1. Pure unit tests: perfect/poor fit, brightness closeness, weight renormalization, no reports, stale only, pending only, multiple missing fields, noisy boundary cases.
2. Property/invariant tests: score within 0-100, ordering respects tolerance, deterministic for same inputs.

RED-TEAM:
1. Try to force 98% scores from only one or two observations.
2. Check malformed dates, venue time zones and nonfinite inputs cannot yield NaN in UI.

ACCEPTANCE:
1. Documented score equation and unit tests pass.
2. Not enough data never masquerades as a numeric score.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 08 - Discover page: search, filters, ranking and states (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 08: Discover page: search, filters, ranking and states. Outcome: A true vertical slice: visitors can find relevant verified public spaces. Dependencies: 04, 05, 06, 07. Priority: P0.

FIRST INSPECT:
1. Current / page, data loaders, typed card data, API/data access, preference and matching interfaces.

IMPLEMENT:
1. Create responsive list-first Discover experience with typed location/search text, preferences, accessibility filters and cards.
2. Integrate actual published-space records, match result and evidence labels; make sorting deterministic and explain what unknown means.
3. Add sensible empty/no-results/error states, filter clear, source visibility and realistic loading treatment.
4. Ensure search can work by typed area/name without asking for device location.

INTEGRATE:
1. Read through correct server-side public data boundary and reuse score service.
2. Detail links should resolve real ID/slug with graceful removed/unpublished handling.

VERIFY:
1. Type query, change preferences, strict facility filter, refresh, no match, disconnected database, malformed data and touch/mobile interaction.
2. Verify search and score pagination/order stable if future records are added.

RED-TEAM:
1. Check filters do not silently include unknown facilities.
2. Check no cards invent observed noise, verified source, "open now", or guaranteed quietness.

ACCEPTANCE:
1. First core journey works from preference change to accurate published results.
2. Error/loading/empty states are honest and accessible.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 09 - Venue detail pages and evidence provenance (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 09: Venue detail pages and evidence provenance. Outcome: A trustworthy explanation of why a place might fit and what is unknown. Dependencies: 04, 07, 08. Priority: P0.

FIRST INSPECT:
1. Current /spaces/[id] route, queries, facility verification fields, approved sensory reports and source metadata.

IMPLEMENT:
1. Build detail page with clear location, sources, verified facilities, visit requirements, ratings, match factors, report counts and evidence timestamps.
2. Show explicit unknown and not enough data states; match explanation + separate reliability indicator, not false percentages.
3. Display verified source links, last checked time when known, report submission entry and relevant accessible navigation.
4. Handle bad ID, unpublished venue, reportless venue and removed record without data leakage.

INTEGRATE:
1. Use same score and approved-report logic as Discover cards; do not calculate different values per route.
2. Link reports to actual venue id; preserve selected preferences.

VERIFY:
1. Compare displayed card and detail match outcomes for identical data.
2. Test reports empty, all pending, stale, verified access unknown and broken source href.

RED-TEAM:
1. Ensure no hidden moderation states or restricted private venue data exposed.
2. Review words such as "quiet now" and replace with historical/report-based descriptions.

ACCEPTANCE:
1. Venue detail answers "why this match, based on what evidence, and what remains unknown?".
2. No contradictory core details across routes.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 10 - Report form, validation, abuse resistance and moderation (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 10: Report form, validation, abuse resistance and moderation. Outcome: An end-to-end community contribution flow that is safe by default. Dependencies: 03, 05, 09. Priority: P0.

FIRST INSPECT:
1. Current report route, /api/reports endpoint, RLS policies, moderation tooling and rate limiting capabilities.

IMPLEMENT:
1. Create concise keyboard-friendly report form for space and observation time with nullable 1-5 noise/crowd/brightness/scent inputs.
2. Validate and normalize on server (bounds, timestamp reasonableness, valid published venue, payload size) and avoid diagnosis/identifiers.
3. Submit with pending state only; prevent mass submission with appropriate lightweight rate limits/abuse signals and errors that preserve user input.
4. Implement a safe minimal admin moderation procedure/tooling, not a public approval endpoint. Document who can review and how.

INTEGRATE:
1. Only approved records enter publicly visible cards, scores and history after moderator action.
2. Check client cannot alter moderation, space publishing or privileged timestamps by JSON tricks.

VERIFY:
1. Form valid/partial/empty/out-of-range, server failure, duplicate/rapid submit, pending approval, rejection, anonymous reads and forbidden privilege escalation.
2. Test keyboard, aria error messaging and submit success without claiming report is public immediately.

RED-TEAM:
1. Attempt injected moderation status, arbitrary space id, very old/future dates and automated spam-like repeats.
2. Review logging to avoid storing names, exact user location or medical details.

ACCEPTANCE:
1. Valid report stored pending; approved-only publication verified with a real test.
2. Unauthorized approval paths remain blocked.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 11 - Cross-route integration and regression pass (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 11: Cross-route integration and regression pass. Outcome: All core features behave as ONE app, not independent demos. Dependencies: 06-10. Priority: P0.

FIRST INSPECT:
1. Acceptance criteria from prior phases, migration state, reports API, data fetching, routes and current test suite.

IMPLEMENT:
1. Create end-to-end test flows: choose preferences -> discover -> detail -> submit report -> moderation -> updated evidence.
2. Align filter, score, reliability, time window and source descriptions across card, detail and persisted state.
3. Add robust UI handling of server disconnects, invalid route IDs, empty DB, slow responses and network retries.
4. Fix discovered contract mismatches rather than layering workarounds.

INTEGRATE:
1. Trace a report from browser input through server validation and RLS to public read after approval.
2. Trace venue data from source spreadsheet through importer, DB, Discover and details.

VERIFY:
1. Automated E2E via existing supported tool where feasible; otherwise reproducible human scripts with exact expected outcomes.
2. Repeat unit/integration checks and ensure clean build before progressing.

RED-TEAM:
1. Try to find contradictory observation counts and source/verification states across screens.
2. Check disabled storage, no reports, partial fields and unavailable Supabase.

ACCEPTANCE:
1. Two core vertical journeys have reproducible passing evidence.
2. No critical cross-feature contradictions or major dead-ends.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 12 - Reliability semantics and evidence UI (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 12: Reliability semantics and evidence UI. Outcome: Users understand how strong or limited the evidence is without statistical theater. Dependencies: 07, 09, 10, 11. Priority: P0.

FIRST INSPECT:
1. Proposed evidence model, thresholds and current ConfidenceLabel/component fields.

IMPLEMENT:
1. Implement evidence levels insufficient/limited/more-supported based on approved counts, recency and spread; write exact decision rules and tests.
2. Show timestamps, sample sizes, verified-source status and uncertainty independently of numeric match.
3. Explain that reports are subjective snapshots, not live conditions or medical assurance.
4. Avoid a fabricated "98% confidence" statistic or an unjustified precision level.

INTEGRATE:
1. Reuse one reliability function throughout card/detail pages.
2. Ensure pending/rejected, very old reports and sample fixtures never improve public evidence.

VERIFY:
1. Test zero, 1, 2, 3, many reports; single-day clusters vs spread; stale vs recent; changing moderation.
2. Check fallback labels and screen-reader descriptions for each evidence category.

RED-TEAM:
1. Try gaming confidence with duplicate or mass-submitted observations; describe unresolved anti-gaming risk honestly.
2. Ensure reliable evidence is not confused with high match.

ACCEPTANCE:
1. Separate, documented reliability and match concepts are visible everywhere relevant.
2. No unsupported certainty claims.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 13 - Accessible experience and inclusive usability testing (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 13: Accessible experience and inclusive usability testing. Outcome: A product whose accessibility is verified in use rather than asserted. Dependencies: 08-12. Priority: P0.

FIRST INSPECT:
1. Actual page screenshots, rendered DOM, keyboard paths, automated test output and UX feedback.

IMPLEMENT:
1. Audit every core route for headings, regions, input names, errors, contrast, readable zoom, focus, keyboard operation and reduced motion.
2. Test at mobile width, 200% zoom, desktop and with a screen reader when accessible.
3. Improve terminology and labels so individual sensory needs are respected without generic "best for everyone" claims.
4. Run a small consent-based user study with no diagnosis collection, if volunteers are genuinely available; never manufacture findings.

INTEGRATE:
1. Regression-test shared buttons, cards, filter widgets and reporting forms after fixes.
2. Ensure list-first flows remain fully usable without optional map.

VERIFY:
1. Keyboard-only Discover -> Preferences -> Detail -> Report -> Return.
2. Inspect auto-checker findings and manually validate focus, feedback, reduced motion, resize/zoom and tap targets.

RED-TEAM:
1. Try rapid tabbing, filter resets, validation errors and screen-reader review of "unknown" and evidence words.
2. Check high-contrast and forced-colors mode where supported.

ACCEPTANCE:
1. No unresolved critical keyboard, labeling or contrast blockers.
2. Real testing evidence recorded distinctly from assumptions.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 14 - Threat modeling, privacy and performance hardening (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 14: Threat modeling, privacy and performance hardening. Outcome: A credible public app with sensible protection and fast, stable pages. Dependencies: 10-13. Priority: P0.

FIRST INSPECT:
1. Server APIs, database privileges, RLS, env handling, request logs, asset/loading metrics and third-party scripts.

IMPLEMENT:
1. Review attack paths: public reports, moderation controls, injection, XSS, CSRF where relevant, rate limits, unbounded query, data leakage and secret exposure.
2. Tighten query bounds, indexes, safe errors, content sanitization and write protection without breaking accessibility.
3. Measure real performance: initial load, navigation, query volume, core vitals where tooling permits; optimize actual bottlenecks.
4. Write privacy summary: collected input, storage, retention choices, geolocation policy and known limitations.

INTEGRATE:
1. Retest core submit/moderate/score workflow after any security change.
2. Validate client-only and server-only environment variables are used in correct boundary.

VERIFY:
1. Attempt unauthenticated admin action, data exfil via public reads, oversized payload, rapid submissions and malformed IDs.
2. Run build and any security/performance checks actually present; record before/after if optimized.

RED-TEAM:
1. Audit telemetry and error logging for unintended personal data.
2. Check third-party tile/analytics integrations do not silently activate before consent or need.

ACCEPTANCE:
1. No known release-blocking auth/RLS/report exposure issue.
2. Performance baseline and residual risks are documented, not guessed.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 15 - Deployment and release candidate verification (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 15: Deployment and release candidate verification. Outcome: A reliably hosted, reproducible MVP with truthful demo behavior. Dependencies: 11-14. Priority: P0.

FIRST INSPECT:
1. Hosting config, Supabase prod/test configuration, secrets policies, CI checks and rollback plan.

IMPLEMENT:
1. Set up minimal deployment workflow using actual hosting service available; do not fabricate live URL or credentials.
2. Apply schema migrations safely and verify public read + pending report + approval in deployed environment when authorized.
3. Configure environment validation, secret separation, error states, source attribution and stable URLs for all four routes.
4. Write docs/release-checklist.md and a minimal rollback/recovery procedure.

INTEGRATE:
1. Run real mobile/public network smoke path from preferences to details to pending report.
2. Confirm production demo fixtures and real venues are unmistakably differentiated.

VERIFY:
1. Live smoke only when deployment access is present; otherwise supply exact manual instructions with unexecuted status.
2. Run existing CI, build and production-mode checks; validate deep links and 404s.

RED-TEAM:
1. Review whether production service role keys, secret env values or moderator tools are exposed.
2. Test behavior if the backing DB is unreachable and if the seed dataset is empty.

ACCEPTANCE:
1. Deployable core app + exact smoke-test evidence or a precisely explained credential blocker.
2. No unverified claim of a working public endpoint.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 16 - Stretch: historical quiet-period insights (P1 / OPTIONAL)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 16: Stretch: historical quiet-period insights. Outcome: Conservative historical insight added only after the core is stable. Dependencies: 03, 07, 10, 12, 15. Priority: P1 / OPTIONAL.

FIRST INSPECT:
1. Approved observations volume, observed_at time zone handling, venue time_zone, existing details page.

IMPLEMENT:
1. Group approved reports in each venue local time by weekday/weekend and morning/afternoon/evening.
2. For each group, use last-60-day observations, show median reported noise only if count >=3.
3. Display exact count, historical label and no-data fallback; make no "quiet right now" or forecast promise.
4. Cache carefully if needed; keep query behavior deterministic.

INTEGRATE:
1. Reuse approved-report selectors, provenance and empty state conventions.
2. Preserve page usefulness even when all historical groups are unknown.

VERIFY:
1. DST boundary, time zone differences, 2 vs 3 observations, all pending, stale only and malformed timestamps.
2. Verify history never shows sample data in real-public mode.

RED-TEAM:
1. Check local time conversion instead of UTC bucketing.
2. Search UI copy for prediction language and remove unsupported promises.

ACCEPTANCE:
1. Quiet periods are visibly historical and thresholded.
2. No core regression; if sparse data makes this unconvincing, defer it.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 17 - Stretch: optional map and spatial navigation (P1 / OPTIONAL)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 17: Stretch: optional map and spatial navigation. Outcome: A useful optional map without reducing accessibility or data credibility. Dependencies: 04, 08, 09, 13, 15. Priority: P1 / OPTIONAL.

FIRST INSPECT:
1. Actual verified coordinates, list UI, project bundle constraints and available map provider terms.

IMPLEMENT:
1. If value justifies it, add optional Leaflet map with linked list results, keyboard alternative and same filters.
2. Keep list default; markers link to real detail pages with descriptive labels.
3. Add OpenStreetMap/provider attribution and respect tile usage/rate requirements; never infer missing coordinates.
4. Avoid automatic device geolocation; obtain explicit permission if ever introduced.

INTEGRATE:
1. Map/list results must use the same filtered published record set.
2. Feature must lazy-load or stay behind a toggle to protect performance.

VERIFY:
1. Map disabled/unavailable, missing coordinates, mobile interaction, keyboard list fallback and filter consistency.
2. Verify attribution, requests and bounds on actual provider settings.

RED-TEAM:
1. Check potential location leakage and the temptation to add a misleading "near me" shortcut.
2. Confirm optional map does not block 200% zoom or screen reader list flows.

ACCEPTANCE:
1. Map improves discovery and is nonessential to successful task completion.
2. Otherwise omit the feature and preserve P0 stability.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

### PHASE 18 - Demo, evidence package and hackathon submission (P0)

```text
You are the implementing engineer for QuietSpace. Execute PHASE 18: Demo, evidence package and hackathon submission. Outcome: Judges see a polished product and evidence instead of promises. Dependencies: 15, optionally 16-17. Priority: P0.

FIRST INSPECT:
1. Working deployed routes, issue tracker, source URLs, validation observations, accessible UX results, current contest rules.

IMPLEMENT:
1. Verify contest deadlines, judging, repo/demo/AI disclosure rules on official current pages; record URLs and review date.
2. Script a concise 2-6-minute-style demo only if current rules permit: user preferences -> discovery -> evidence transparency -> moderated report -> why it matters.
3. Prepare truthful screenshots, README, architecture diagram, deployment instructions, attribution/license notes and user testing summary using real evidence only.
4. Create release-blocker triage: remove unstable P1 features rather than ship a broken journey.

INTEGRATE:
1. Run final deployed rehearsal and verify the narrated states exactly match current behavior.
2. Document what is implemented versus planned, and disclose AI assistance accurately.

VERIFY:
1. Final clean install/build checks, regression smoke, critical keyboard flow and link verification.
2. Rehearse with slow network, no report data and a failed optional service.

RED-TEAM:
1. Challenge every claim in presentation: counts, percentages, "real time," testing, impact and accessibility.
2. Verify no private data, credentials, fabricated testimonials or unsupported certification.

ACCEPTANCE:
1. Complete authentic demo and submission materials consistent with deployed app.
2. Any unresolved blocker is called out plainly or the affected feature is removed.

MANDATORY WORKING RULES:
1. Work in THIS repository; inspect actual files and installed scripts before modifying anything. Read docs/product-contract.md and relevant prior sign-offs if present.
2. Limit changes to the scope of this phase; preserve working behavior, and do not self-advance to later stages.
3. Maintain end-to-end type and validation consistency across UI, API, database and tests. Never represent missing evidence as verified facts.
4. Run the checks available in the repo and show command/result accurately. If blocked by absent keys or services, state unexecuted tests and give reproducible manual steps.
5. Perform a skeptical second-pass code review for security, accessibility, error states, regressions and data honesty; correct discovered high-impact issues.
6. Provide files changed, architecture decisions, tests run/passed/failed, manual verification, known risks, and acceptance criteria evidence. Finish by saying: "PHASE COMPLETE - AWAITING HUMAN REVIEW."
Do not start the next phase. Do not claim tools/tests ran unless you show their results. If blocked by missing credentials or repository state, make the best safe progress and explain exactly what is still needed.
```

## C. Universal hard blockers

- Unapproved reports publicly readable, RLS bypass, administrative key leakage.
- Public demo represents fictional data as real observations.
- Match score rendered with insufficient evidence or presented as a live guarantee.
- Keyboard-inaccessible user journey or broken core route.
- Deployment claims without executed public smoke tests.

## D. Stage completion report (paste into docs/engineering/phase-signoffs/)

```text
Phase / commit / reviewer:
Actual files changed:
Contracts affected:
Executed checks (command + result):
Manual checks (performed by whom):
Privacy/accessibility/security/data honesty findings:
Acceptance evidence:
Remaining risks and blocked items:
GO / NO-GO:
Next authorized phase (if GO):
```