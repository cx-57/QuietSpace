# ADR 001: a small server-first application with offline data preparation

Status: adopted for phases 00–04; runtime verification pending. Date: 2026-10-20.

## Context and decision

The repo had no starter or package conventions. Use Next.js App Router + React + strict TypeScript, Tailwind via PostCSS, and PostgreSQL/Supabase SQL migrations. npm is selected because no package manager or lockfile existed. Use Node 24 LTS when later provisioned. User requested work without installing Node or PostgreSQL in this session.

Next.js and React pins are taken from the npm registry on 2026-10-20: [Next 16.4.2](https://registry.npmjs.org/next/latest), [React 19.3.1](https://registry.npmjs.org/react/latest). TypeScript remains on 5.9.3 to use the established Next TypeScript configuration rather than introduce the newer native compiler. Supporting packages have compatible bounded major versions; a genuine lockfile requires a provisioned install and review. Do not invent one.

Scaffold only four informational routes. A future accessible shell is phase 05; preferences/scoring/discovery/submission are phases 06 onward. No database SDK until queries exist. No map, external font, icon library, image service, analytics, auth or UI dependency is necessary. Server components are the default. Validation is dependency-free because the initial input surface is small.

Use Python 3.11+ standard library for the curated import command and executable checks: available without Node/DB, no pip dependencies, deterministic validation and SQL output. The importer has no network/database credentials and does not execute SQL. SQL is a reviewable artifact applied later only to a selected disposable/test database. It uses PostgreSQL UPSERT and transactions, not string-built shell commands. Text literals are escaped centrally with backslash interpretation disabled. Tests exercise malicious content and repeat-generation determinism. Actual database idempotence remains an explicit SQL test pending PostgreSQL.

## Data ownership and security

- Public database roles: SELECT only, constrained by RLS. Revoke implicit Supabase table/function grants explicitly. Policies also check parent publication, provenance, freshness and fixture flags.
- `spaces` owns sourced venue identity/publication; `space_features` owns specific facility facts; `sensory_reports` owns structured observations and moderation. Keys, check constraints and foreign keys enforce shared semantics.
- No accounts or personal medical data. No free-text report fields in this initial schema, reducing moderation/PII exposure. Venue evidence notes are maintainer-authored source summaries, never user comments.
- A narrow `submit_sensory_report` SECURITY DEFINER function is executable only by `service_role`, has a fixed search path, validates parent/input and hardcodes pending. Service role is not a browser credential and has no direct table mutation grants in this migration. Trusted database operators moderate. Abuse controls in the future HTTP handler are a release gate; SQL validation alone is not anti-spam.
- Read freshness is enforced for venue publication. Feature freshness is represented by a view with `security_invoker = true`: expired verified features become unknown. Future UI/filter queries consume this view, not stale raw booleans.
- Local preferences belong to the browser only in a later phase. The server never needs a diagnosis or exact device location.

## Verification and operational consequences

The application has a readable setup state without env values. No source records are automatically loaded into the UI before discovery work. `.env.example` has empty public values and separately documented server-only placeholders, with all real env files ignored. No secret is accessed in this batch.

CI has an immediately runnable Python job. The Node job performs first install only when no lock exists, checks lint/type/tests/build, and uploads the generated lockfile for review; once a reviewed lock is committed it uses `npm ci`. This is an honest bootstrap bridge, not a deterministic-install claim. Database integration is a separate explicit `psql` gate and never silently skipped by an npm script claiming DB success.

SQL policies follow the distinction between grants and RLS in [Supabase's official guide](https://supabase.com/docs/guides/database/postgres/row-level-security). Next uses standalone ESLint; [Next documentation](https://nextjs.org/docs/app/getting-started/installation) notes builds do not run lint. Destructive rollback is restricted to disposable local databases; deployed recovery uses forward migrations and backups.

Rejected alternatives: fabricated lockfile/results; SQLite pretending to validate PostgreSQL RLS; invented venue noise observations; a browser service key; premature report endpoint without abuse controls; silently completing phases 05 onward.
