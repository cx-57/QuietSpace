# QuietSpace product contract

Version 3 — 2026-10-23 (release candidate). Requirements: the repository's staged prompt, section B. This contract freezes the P0 target; implementation and unverified real-service gates are distinguished below and in the phase sign-offs.

“Find a place that feels right.” Help people explore public venues against personal noise, crowd, brightness and scent preferences without medical disclosure. Conditions vary. Source facts, community observations and unknowns must be distinguishable.

## Routes and ownership

| Route | Target behavior | Data / components | Current implementation |
| --- | --- | --- | --- |
| `/` | List-first discovery with filters, sources and uncertainty | Server-published spaces → filters/list/cards | Search, strict facility filters, stable ranking and sourced cards |
| `/preferences` | Optional local sensory preferences, reset, required facilities | Browser local storage only → preference form | Optional versioned local preferences, persistence/reset/recovery |
| `/spaces/[id]` | Venue, sources, facility verification, approved evidence, explanation | Public space/features/approved reports → detail | Sourced detail, unknown facilities, shared matching and evidence |
| `/spaces/[id]/report` | Structured anonymous intensity observation, pending confirmation | Server-only write boundary → report RPC | Working direct-PostgreSQL flow; public deployment still gated |

The default curated mode is a read-only directory of 11 actual source-reviewed Boston records across libraries, parks and a museum, with no reports or fake scores. Its stable URLs use source slugs; it does not invent database UUIDs. Explicit postgres or supabase mode uses validated anonymous-role public reads and bounded queries; connection failures never silently fall back to curated records. A privileged key is used only for the report RPC. Report submission requires explicit enabling. Local loopback development uses a shared bucket; production requires verified trusted ingress. Real local database acceptance has passed. No public moderation UI exists.

## P0 journey and non-goals

Choose an optional sensory profile, venue type and verified facilities → browse sourced venues → inspect evidence and unknowns → optionally report → moderator approves → later evidence refresh includes that report. Choosing no preferences must still allow browsing. No device location is required.

P0 includes filters, 11 real public venues, details, explainable matching, anonymous moderated reports, accessible navigation and honest no-data states. P1: venue-local historical patterns and optional map. Excluded: accounts, diagnoses, predictions, notifications, social features, automatic geolocation, live occupancy/noise claims, medical recommendations.

## Cross-layer semantics

- Ratings: integers 1–5 represent **intensity** (1 low, 5 high); `null` means not observed. Zero, strings, booleans, fractions and out-of-range values are invalid. At least one dimension is required for a report.
- Dimensions: `noise`, `crowds`, `brightness`, `scent`. Noise, crowd and scent preferences are maximum intensities; brightness is a preferred level. All accept `null` for no preference. The existing `maximumIntensities` property name is retained for schema-v1 browser compatibility; brightness semantics are explicitly closeness. No preference must not silently mean 1.
- Coordinates are a nullable pair. No approximate geocoding is presented as source verification.
- Dates: ISO 8601 with explicit offset in interchange; `timestamptz` in storage. `checked_at` is source review time; `observed_at` is the visit observation; `created_at` is receipt time. They are different facts.
- Venue time zone: IANA identifier (`America/New_York` for the Boston dataset). Never derive observation bins from the visitor's device zone.
- Facilities: `verified + true`, `verified + false`, or `unknown + null` with no claim. Verified values require a specific HTTPS source, short evidence note and timestamp. A stale verified value must be presented as unknown, never used to pass a strict required-feature filter. Evidence expires after 90 days. “Accessible entrance” does not establish step-free routes, accessible toilets, or whole-building access.
- Venue provenance: `verified` means source-reviewed identity/address/public venue status, not a field inspection or sensory certification. `needs_review` and `unverified` cannot be public. Only genuine, reviewed, explicitly public, non-fixture venues may be published. Publication expires 90 days after source review.
- Initial venues have no report observations. Venue sourcing must never create report counts, intensity averages or quietness claims.

## Matching and reliability

Weights: noise 0.40, crowds 0.25, brightness 0.20, scent 0.15. Eligibility is per dimension: at least 3 approved, non-fixture observations in the rolling last 60 days, neither future nor stale, and a non-null preference. When a visitor selects exactly one sensory dimension, a labeled **single-sense fit** is allowed after 3 approved, recent reports for that dimension. It describes only that sense, not overall suitability. When a visitor selects multiple dimensions, a numeric fit still requires at least two eligible dimensions including noise. Otherwise `score: null` with `insufficient_evidence` or `no_preferences`.

For eligible dimensions use median observed intensity. Noise/crowd/scent fit is `max(0, 1 - max(0, median - preferredMaximum) / 4)`. Brightness fit is `max(0, 1 - abs(median - preferredLevel) / 4)`, following the explicit Stage 07 prompt. Renormalize eligible weights, compute weighted fit × 100, round only at the end. Lower noise, crowds and scent are not penalized; brightness is penalized for distance in either direction. Explain dimension values, sample counts, excluded dimensions and effective weights. This is a documented heuristic, never a clinical measure or a promise about current conditions. This clarifies the earlier all-maximum equation to follow the now-authorized Stage 07 requirement.

Reliability is separate from fit: approved sample counts per dimension, recency and distinct observation dates; no fabricated confidence percentages. Pending/rejected, stale, future and fixture reports never contribute. More-supported evidence requires at least 6 eligible reports across 3 venue-local dates, a visit within 14 days, and at least 3 noise values plus another eligible dimension. One or two reports are insufficient; other evidence is limited. No observation means “No community observations yet.”

For optional historical patterns: venue-local weekday/weekend × morning 06:00–11:59, afternoon 12:00–17:59, evening 18:00–23:59; overnight 00:00–05:59 is omitted unless separately designed. Only approved observations from last 60 days, at least 3 per group, median noise. Explicitly historical; never real-time.

## Moderation and privacy boundary

Clients cannot insert/update/delete database rows or execute the submission RPC. The same-origin server handler validates an exact allowlist, body size, ISO timestamp (last 60 days, at most 5 minutes clock skew), published parent, and intensity semantics; applies HMAC network pseudonyms and a persistent atomic rate-limited RPC wrapper before pending storage. The SQL RPC repeats data checks, hardcodes pending, and accepts no status, sample flag, identity, publication or moderator fields. It returns only receipt ID/status to the trusted server. Enabled for the isolated loopback PostgreSQL development app; disabled by default in public deployment templates.

Pending/rejected reports are invisible to public roles, including on unpublished parents. Moderation is restricted to a trusted operator via database tooling; no public admin route. Moderation requires a timestamp. The application service role gets no direct report table writes. Store no names, email, diagnosis, exact user location, raw IP or free-text report fields. Abuse records expire after 24 hours with required hourly operator cleanup (physical retention approximately 25 hours maximum if scheduling is healthy), plus on-submit cleanup. Network tokens rotate daily. Limits and setup gates are documented in docs/engineering/reporting.md. No analytics or third-party requests are needed for setup pages.

## Typed and error contracts

`src/lib/contracts.ts` defines shared app interfaces. SQL uses snake_case; validated public read adapters map explicitly to camelCase and must not cast unchecked network responses. `src/lib/validation.ts` validates report inputs and facility evidence; the offline Python import validator owns curated venue-file validation. Tests must compare shared enum/range/null semantics to the migration.

Errors are a discriminated code + safe message + optional field errors: `setup_required`, `unavailable`, `not_found`, `invalid_input`, `rate_limited`. Never expose SQL, credentials, pending rows or internal stack traces. Distinguish empty from failed queries. Success/error/loading announcements must be readable without color.

## Contract review journeys

1. Noise-sensitive visitor with a required step-free route: sourced venue with only “accessible entrance” evidence stays unknown for step-free access and fails strict filtering. No reports means no numeric match.
2. Visitor with preferred brightness 3 and no noise preference: browse works with unknown sensory conditions until at least 3 approved brightness observations exist. Then a clearly labeled **single-sense fit** may appear, without claiming overall suitability. A null scent observation does not become zero.
3. Anonymous contributor submits noise 2, other dimensions null: accepted only via the enabled protected server route, remains pending and contributes nothing until trusted approval. Sending `status: approved` is invalid.
4. Empty/unconfigured database in supabase mode: explicit setup/empty state; no demo observations or scores injected. Database outage shows a recoverable unavailable state, never a fabricated empty successful query.

Review scope: types/lint/unit tests, production build and automated browser journeys, including axe and keyboard checks. Connected journeys use a loopback test double, not a PostgreSQL service. Real PostgreSQL/RLS/moderation/cleanup and concurrent tests now pass; no real user/screen-reader study or hosted deployment is claimed. See stage 05?10 sign-offs for exact evidence and remaining gates.
