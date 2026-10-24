# Curated Boston venue sheet

`boston-libraries.json` is a historical file name retained for compatibility. It now contains **11 real, sourced public places** across Boston: **8 BPL libraries, 2 city parks/gardens and 1 ticketed art museum**. Reviewed public venue facts and facilities come from official Boston Public Library, City of Boston or Museum of Fine Arts websites; a listing is **not** a sensory observation.

Each place has publicly verifiable identity, address and source links. We store **no invented noise, crowd, brightness, scent, opening status, hours, coordinates, popularity metrics or visitor reviews**. Only facility attributes explicitly listed by sources are marked verified; absence of a listing remains unknown, not false. A public park is not necessarily quiet or uncrowded, and a museum may require a paid ticket.

## Official venue sources

| Place | Category | Verified facility information |
| --- | --- | --- |
| [Central Library / Bates Hall](https://www.bpl.org/central-library-points-of-interest/) | Library | Officially described reading/study hall; [accessible entrance](https://www.bpl.org/locations/central/) |
| [Brighton Branch](https://www.bpl.org/locations/brighton/) | Library | Accessible entrance |
| [Connolly Branch](https://www.bpl.org/locations/connolly/) | Library | Accessible entrance |
| [East Boston Branch](https://www.bpl.org/locations/east-boston/) | Library | Quiet/study room listing; accessible entrance |
| [South Boston Branch](https://www.bpl.org/locations/south-boston/) | Library | Accessible entrance |
| [Grove Hall Branch](https://www.bpl.org/locations/grove-hall/) | Library | Quiet/study room listing; entrance accessibility unverified in reviewed facilities list |
| [Jamaica Plain Branch](https://www.bpl.org/locations/jamaica-plain/) | Library | Quiet/study room listing; accessible entrance |
| [Mattapan Branch](https://www.bpl.org/locations/mattapan/) | Library | Quiet/study room listing; accessible entrance |
| [Boston Common](https://content.boston.gov/parks/boston-common) | Park | [Benches and shaded seating listed by the City](https://content.boston.gov/departments/disabilities-commission/accessible-and-sensory-friendly-features-boston-parks) |
| [Boston Public Garden](https://content.boston.gov/parks/public-garden) | Park | [Benches and shaded seating listed by the City](https://content.boston.gov/departments/disabilities-commission/accessible-and-sensory-friendly-features-boston-parks) |
| [Museum of Fine Arts, Boston](https://www.mfa.org/visit) | Museum | [Ramped, power-assisted Huntington Avenue entrance](https://www.mfa.org/visit/getting-here); check ticket requirements and prices with MFA |

The noise preference (1–2) puts **verified library study areas** ahead of other unscored venues. Other sensory choices remain meaningful as private preferences but do not invent empirical rankings when community evidence is missing. Visitors can explore libraries, outdoor parks/gardens and museums separately. Required facilities remain strict: unknown never passes. Official park listings for **specific stair-free destinations** must not be misrepresented as a guarantee that every path is step-free.

The source timestamp is the review time, not the time a visitor experienced the space. Facts expire after 90 days. This is a small, manually reviewed inventory, not a claim of a citywide audit or sponsor endorsement. No coordinates or third-party photographs are embedded in the venue dataset.

## Format and offline commands

Python 3.11+ standard library only:

```powershell
python tools/import_venues.py
python tools/import_venues.py --output artifacts/venues.sql
python -m unittest discover -s tests -p "test_*.py" -v
```

The default command **validates only**; no credentials or network requests. `--output` generates a transactional PostgreSQL file for review. It cannot connect to a database. For reproducible historical test evidence use `--as-of 2026-10-23T23:59:59Z`; this does not renew source verification or permit bypassing database-time freshness rules. Normal imports use the actual clock and reject stale published rows.

Every venue field is explicit; extra fields are rejected, preventing invented observation metadata entering through the import. `checked_at` is source-review time, not visit time. Supported categories and feature keys align with the SQL/TypeScript contracts. The explicit Boston source-host allowlist and region time zone live in the importer; adding new hosts/regions requires a source review, not a blind whitelist.

Duplicate slugs, normalized names, normalized addresses and canonical source URLs fail the whole batch rather than silently merge. Unknown/restricted access, fixtures, missing/bad sources, invalid or partial coordinates, future source checks, stale published facts and malformed feature evidence fail closed. For stale/broken sources: set venue `provenance_status` to `needs_review`, `published` to false, and expired features to unknown/null; retain the last actual review timestamp. A live source health check is manual; this offline tool cannot detect a URL that has stopped working.

UPSERT preserves existing IDs/creation dates and does not touch reports. An older batch cannot downgrade more recent venue/feature checks. Newer unknown features explicitly clear older claims. Before first database application read [database setup](../../docs/engineering/database.md). Database replay tests are supplied but were not run here.
