# Security, privacy and performance review

October 23, 2026. Evidence applies to the local release candidate, not an untested hosted environment.

## Boundaries checked

| Boundary | Behavior and evidence |
| --- | --- |
| Public reads | Direct PostgreSQL uses a read-only transaction and SET LOCAL ROLE anon. Actual RLS suites reject private, stale-parent, pending/rejected and fixture exposure. REST remains anonymous-role only. |
| Contributions | Exact payload allowlist, integer/null semantics, real bounded visit times, published parent, Origin, JSON and actual streamed 2,048-byte limit. Node and real-browser invalid-payload checks pass. |
| Moderation | No public admin HTTP endpoint. Operator CLI changes one pending UUID in a transaction, with recent-parent approval checks. Actual browser-to-DB approval/publication and withdrawal checks pass. |
| Abuse | Daily HMAC network pseudonyms, IPv6 /64 grouping, canonical payload fingerprint, persistent cooldown, hourly/network/global caps. Eight concurrent real DB calls yield one accepted and seven limited. Tokens are not publicly readable. |
| Retention | Third migration grants a narrow service cleanup function, deleting only events older than 24h. Direct PostgreSQL runtime runs it on startup/hourly; actual SQL tests prove expiry and fresh-row preservation and deny anonymous execution. Serverless requires a separate monitored schedule. |
| Credentials | Operator URI is CLI-only. Client modules cannot import server-only adapters. Release check scans browser JS for the actual local private values and rejects packaged env files. Docker context excludes env and database files. |
| Injection and content | Query values are parameterized; identifiers/role switches are fixed or validated. Public responses map/validate types. Unsafe source schemes or embedded credentials fail closed. React renders plain text; report free text is not accepted. |
| Outage and query limits | Safe unavailable states, bounded waits, at most 100 venues/10,000 recent reports, explicit truncation failure. Pool idle errors cannot crash through an unhandled EventEmitter. Each populated direct directory read has three SELECTs, not a per-venue query loop. |
| Browser policy | nosniff, frame denial, restricted geolocation/camera/microphone, referrer policy and structural CSP restrictions. This is not described as a full nonce-based script CSP. |

Production ingress still needs its own real spoofing and network checks. The localhost development bucket is supplied by the server and shared across local requests; it is not accepted as a production fallback. The example loopback trust PostgreSQL cluster is for development only. Production credentials must use a restricted authenticated database role and protected networking.

## Performance sample actually measured

One headless Edge sample of the production standalone homepage, 1440×960, loopback HTTP, no network/CPU throttling, captured during the browser demo:

- Largest contentful paint observation: **184 ms**.
- Cumulative layout shift observation: **0.00065**.
- Navigation load event: approximately **190 ms**; response start approximately **19 ms**.
- Measured resource transfer bytes: **612,143**, plus the initial HTML transfer.

Raw evidence is `artifacts/performance.json`. The photograph is self-hosted WebP (~287 KB before responsive optimization), dimensions are reserved, fonts are self-hosted with swap, and no font/image/map/analytics CDN is contacted. Preferences/filtering run locally without extra backend queries. These are local lab observations, not field Core Web Vitals, a percentile, a mobile-network guarantee or an independent Lighthouse score. Public-network performance remains a deployment check.

## Limits retained honestly

Approved anonymous reports do not prove unique people. Shared networks can share limits, daily rotation can reset a network bucket across UTC midnight, and network switching remains possible. Global transaction limits still apply. No high numeric confidence is claimed.

Source review is not a sensory audit. All real venues still have zero invented observations. Coordinates are unverified, so the optional embedded map is deferred. No user study, screen-reader certification, clinical outcome or live-condition prediction is asserted.

Production npm audit reports zero vulnerabilities on this date. The prior development-only ESLint/braces finding is recorded in the earlier phase report and has not been hidden through a forced framework downgrade. Hosting logs, backups, restore rehearsal, TLS, monitoring and public rollout require the actual operator environment.
