# QuietSpace architecture

```mermaid
flowchart LR
  V[Visitor browser] --> P[Versioned preferences in local storage]
  V --> N[Next.js pages and report endpoint]
  N --> A[Read-only transaction as anon]
  A --> D[(PostgreSQL: sourced venues, facilities, reports)]
  N --> S[Validate body, origin, time, ratings and abuse token]
  S --> R[Rate-limited pending-only RPC as service_role]
  R --> D
  O[Trusted operator CLI] --> M[Review one pending report]
  M --> D
  D --> E[Published venues and approved observations only]
  E --> V
  V --> H[Shared fit, reliability and historical utilities]
  N --> C[Startup and hourly time-bounded abuse cleanup]
  C --> D
```

The app can also use Supabase REST with anonymous-role reads and a protected server RPC. Its explicit curated mode reads the five source-reviewed JSON records and is read-only. A connection failure never silently becomes curated success.

Anonymous public reads are governed by RLS, source freshness, real/public venue flags and approved-report status. PostgreSQL application transactions drop into the selected fixed role; query values are parameterized. Server credentials cannot be imported into client code. The operator connection remains separate and is not in the deployed application container.

The browser receives only public, validated records and applies its private preferences using shared pure utilities. No preference profile, diagnosis or device geolocation is sent to the server. Report payloads contain only a venue, visit time and nullable 1–5 intensities. Pending receipts do not imply publication.

See [product semantics](product-contract.md), [security/performance](engineering/security-performance.md) and [release procedure](release-checklist.md).
