# Curated real venue sheet

`boston-libraries.json` contains five real Boston Public Library venues. Boston is an explicit initial demo region selected because no region was specified. These are publicly listed library buildings, not restricted refuges, individual rooms or school-only locations. **Source verification is not an on-site audit or proof of quietness.** None has community observations in this dataset.

Reviewed 2026-10-20 through the official location pages. Kept only names, public street addresses, source notes and narrowly supported entrance evidence; no images, scraped descriptions, hours, geocoded coordinates, report counts or sensory ratings are copied. Coordinates and unverified facilities remain null/unknown. All public listings still depend on runtime RLS validation before deployment.

| Venue | Official evidence | Review limits |
| --- | --- | --- |
| Central | [Location and Facilities](https://www.bpl.org/locations/central/) | Address: 700 Boylston Street. Entrance evidence and separately sourced Bates Hall study-space evidence. |
| Brighton | [Location and Facilities](https://www.bpl.org/locations/brighton/) | Address: 40 Academy Hill Road. Entrance evidence only. |
| Connolly | [Location and Facilities](https://www.bpl.org/locations/connolly/) | Address: 433 Centre Street. Page retained a past October 15 closure notice; no opening promise imported. |
| East Boston | [Location and Facilities](https://www.bpl.org/locations/east-boston/) | Address: 365 Bremen Street. Official quiet/study room(s) listing; no measured noise. |
| South Boston | [Location and Facilities](https://www.bpl.org/locations/south-boston/) | Address: 646 East Broadway. Events listed; no sensory inference. |

The pages identify these as public-library locations and list accessible entrance facilities. Separate source reviews on October 23 verified **Bates Hall at Central Library** as a quiet-study reading room ([official description](https://www.bpl.org/central-library-points-of-interest/)) and **East Boston** as listing quiet/study rooms ([official facility list](https://www.bpl.org/locations/east-boston/)). The existing `quiet_room` key is labeled `Quiet/study space` in the UI: it denotes a source-listed quiet-use facility, not an enclosed silent room or a sensory reading. When someone selects a low noise preference (1–2), fresh verified study-space evidence prioritizes otherwise unscored venues. Missing listings stay unknown, and **no sensory intensity or matching score is generated** by this fallback. This is not evidence of accessible toilets, a step-free internal route, available seating, room reservation rights, current opening, scent levels, light intensity or crowd/noise conditions. Unknown facilities omitted from JSON expand into explicit null rows in SQL.

No bulk harvesting is implemented. This is a hand-curated factual inventory with attribution. The linked [BiblioCommons terms](https://bpl.bibliocommons.com/info/terms) were inspected on 2026-10-20: they address linking, content rights and limits on automated harvesting. This is not a claim of a broad reuse license; no catalog entries, user contributions, photographs or descriptive prose are republished. Source links accompany the factual records. No endorsement is implied.

## Format and offline commands

Python 3.11+ standard library only:

```powershell
python tools/import_venues.py
python tools/import_venues.py --output artifacts/venues.sql
python -m unittest discover -s tests -p "test_*.py" -v
```

The default command **validates only**; no credentials or network requests. `--output` generates a transactional PostgreSQL file for review. It cannot connect to a database. For reproducible historical test evidence use `--as-of 2026-10-20T23:59:59Z`; this does not renew source verification or permit bypassing database-time freshness rules. Normal imports use the actual clock and reject stale published rows.

Every venue field is explicit; extra fields are rejected, preventing invented observation metadata entering through the import. `checked_at` is source-review time, not visit time. Supported categories and feature keys align with the SQL/TypeScript contracts. The initial source allowlist and region time zone live in the importer and must be reviewed before a new region is added.

Duplicate slugs, normalized names, normalized addresses and canonical source URLs fail the whole batch rather than silently merge. Unknown/restricted access, fixtures, missing/bad sources, invalid or partial coordinates, future source checks, stale published facts and malformed feature evidence fail closed. For stale/broken sources: set venue `provenance_status` to `needs_review`, `published` to false, and expired features to unknown/null; retain the last actual review timestamp. A live source health check is manual; this offline tool cannot detect a URL that has stopped working.

UPSERT preserves existing IDs/creation dates and does not touch reports. An older batch cannot downgrade more recent venue/feature checks. Newer unknown features explicitly clear older claims. Before first database application read [database setup](../../docs/engineering/database.md). Database replay tests are supplied but were not run here.
