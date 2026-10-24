"""Validate curated real venues and generate reviewable PostgreSQL UPSERT SQL.

Python 3.11+, stdlib only. Never connects to a database or fetches a source URL.
Missing features become unknown. Fictitious fixtures are deliberately rejected.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import json
import math
from pathlib import Path
import re
import sys
import unicodedata
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data/venues/boston-libraries.json"
FEATURE_KEYS = ("accessible_entrance", "step_free_access", "accessible_toilet", "seating", "quiet_room")
CATEGORIES = {"library", "park", "community_centre", "museum"}
PROVENANCE = {"verified", "needs_review", "unverified"}
# This curated batch uses allowlisted Boston Library, City and Museum sites. Expand it only with
# a documented new region/source review; do not guess zones or trust an OS list.
REGION_TIME_ZONES = {
    "www.bpl.org": "America/New_York",
    "content.boston.gov": "America/New_York",
    "www.boston.gov": "America/New_York",
    "www.mfa.org": "America/New_York",
}
VENUE_FIELDS = {
    "slug", "name", "address", "category", "latitude", "longitude", "time_zone",
    "public_access", "source_url", "source_evidence", "checked_at", "provenance_status",
    "published", "is_fixture", "features",
}
FEATURE_FIELDS = {"verification", "value", "source_url", "checked_at", "evidence"}
UNKNOWN = {"verification": "unknown", "value": None, "source_url": None, "checked_at": None, "evidence": None}
STAMP = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})\Z")


class ValidationError(ValueError):
    """Safe, non-credential-bearing curated data validation error."""


def timestamp(value: object, label: str) -> datetime:
    if not isinstance(value, str) or not STAMP.fullmatch(value):
        raise ValidationError(f"{label}: ISO timestamp with offset required")
    if value[-1] != "Z":
        offset_hour, offset_minute = map(int, value[-5:].split(":"))
        if offset_hour > 14 or offset_minute > 59 or (offset_hour == 14 and offset_minute != 0):
            raise ValidationError(f"{label}: invalid time-zone offset")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError as exc:
        raise ValidationError(f"{label}: invalid date/time") from exc


def text(value: object, label: str, maximum: int) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValidationError(f"{label}: nonempty text up to {maximum} characters required")
    if value != value.strip() or any(ord(c) < 32 or ord(c) == 127 or 0xD800 <= ord(c) <= 0xDFFF for c in value):
        raise ValidationError(f"{label}: trim text and remove control characters")
    return value


def source_url(value: object, label: str) -> str:
    result = text(value, label, 2048)
    try:
        parsed = urlsplit(result)
        valid = (result.startswith("https://") and parsed.scheme == "https" and parsed.hostname in REGION_TIME_ZONES
                 and parsed.username is None and parsed.password is None and parsed.port is None
                 and not parsed.query and not parsed.fragment and "\\" not in result
                 and not any(c.isspace() for c in result))
    except ValueError as exc:
        raise ValidationError(f"{label}: invalid official source URL") from exc
    if not valid:
        raise ValidationError(f"{label}: HTTPS official venue-source URL without credentials/query required")
    return result


def canonical(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(re.sub(r"[^\w\s]", " ", normalized).split())


def validate_document(document: object, as_of: datetime) -> list[dict]:
    if as_of.tzinfo is None:
        raise ValidationError("as_of requires a time-zone offset")
    if not isinstance(document, dict) or set(document) != {"format_version", "venues"}:
        raise ValidationError("document: expected only format_version and venues")
    if type(document["format_version"]) is not int or document["format_version"] != 1:
        raise ValidationError("document: unsupported format version")
    if not isinstance(document["venues"], list) or not 1 <= len(document["venues"]) <= 100:
        raise ValidationError("document: expected 1–100 curated venues")
    venues = deepcopy(document["venues"])
    seen_slugs: set[str] = set()
    seen_names: set[str] = set()
    seen_addresses: set[str] = set()
    seen_sources: set[str] = set()
    for index, venue in enumerate(venues):
        label = f"venue[{index}]"
        if not isinstance(venue, dict) or set(venue) != VENUE_FIELDS:
            raise ValidationError(f"{label}: missing or unsupported fields")
        slug = text(venue["slug"], f"{label}.slug", 120)
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            raise ValidationError(f"{label}.slug: use lower-case slug characters")
        name = text(venue["name"], f"{label}.name", 160)
        address = text(venue["address"], f"{label}.address", 300)
        if slug in seen_slugs or canonical(name) in seen_names or canonical(address) in seen_addresses:
            raise ValidationError(f"{label}: duplicate slug, normalized name or address")
        seen_slugs.add(slug)
        seen_names.add(canonical(name))
        seen_addresses.add(canonical(address))
        if not isinstance(venue["category"], str) or venue["category"] not in CATEGORIES:
            raise ValidationError(f"{label}.category: unsupported venue category")
        if venue["public_access"] != "public":
            raise ValidationError(f"{label}: restricted or unknown-access venues are not importable")
        if type(venue["is_fixture"]) is not bool or venue["is_fixture"]:
            raise ValidationError(f"{label}: fixtures cannot enter the real venue import")
        if re.search(r"\b(sample|demo|fictional|fictitious)\b", f"{name} {address}", re.I):
            raise ValidationError(f"{label}: sample/fictional identity cannot enter real data")
        if type(venue["published"]) is not bool:
            raise ValidationError(f"{label}.published: boolean required")
        status = venue["provenance_status"]
        if not isinstance(status, str) or status not in PROVENANCE:
            raise ValidationError(f"{label}: invalid provenance status")
        url = source_url(venue["source_url"], f"{label}.source_url")
        url_key = url.rstrip("/").casefold()
        if url_key in seen_sources:
            raise ValidationError(f"{label}: duplicate canonical source URL")
        seen_sources.add(url_key)
        if venue["time_zone"] != REGION_TIME_ZONES[urlsplit(url).hostname]:
            raise ValidationError(f"{label}: time zone must match reviewed Boston region")
        text(venue["source_evidence"], f"{label}.source_evidence", 1000)
        checked = timestamp(venue["checked_at"], f"{label}.checked_at")
        if checked > as_of:
            raise ValidationError(f"{label}: source review cannot be in the future")
        if venue["published"] and (status != "verified" or checked < as_of - timedelta(days=90)):
            raise ValidationError(f"{label}: stale/unverified data must be unpublished and reviewed")
        lat, lon = venue["latitude"], venue["longitude"]
        if (lat is None) != (lon is None):
            raise ValidationError(f"{label}: coordinates must both be null or both present")
        if lat is not None:
            for value, bound in ((lat, 90), (lon, 180)):
                if type(value) not in (int, float) or not math.isfinite(value) or not -bound <= value <= bound:
                    raise ValidationError(f"{label}: invalid coordinates")
        if not isinstance(venue["features"], dict) or set(venue["features"]) - set(FEATURE_KEYS):
            raise ValidationError(f"{label}: invalid feature keys")
        complete_features = {}
        for key in FEATURE_KEYS:
            feature = venue["features"].get(key, deepcopy(UNKNOWN))
            if not isinstance(feature, dict) or set(feature) != FEATURE_FIELDS:
                raise ValidationError(f"{label}.{key}: invalid evidence fields")
            if feature["verification"] == "unknown":
                if feature != UNKNOWN:
                    raise ValidationError(f"{label}.{key}: unknown evidence must stay null")
            elif feature["verification"] == "verified":
                if type(feature["value"]) is not bool:
                    raise ValidationError(f"{label}.{key}: verified value must be boolean")
                source_url(feature["source_url"], f"{label}.{key}.source_url")
                text(feature["evidence"], f"{label}.{key}.evidence", 500)
                feature_time = timestamp(feature["checked_at"], f"{label}.{key}.checked_at")
                if not as_of - timedelta(days=90) <= feature_time <= as_of:
                    raise ValidationError(f"{label}.{key}: stale/future facility must become unknown")
            else:
                raise ValidationError(f"{label}.{key}: invalid verification state")
            complete_features[key] = feature
        venue["features"] = complete_features
    return sorted(venues, key=lambda item: item["slug"])


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if type(value) is bool:
        return "true" if value else "false"
    if isinstance(value, str):
        if "\x00" in value:
            raise ValidationError("NUL is not permitted in SQL text")
        return "'" + value.replace("'", "''") + "'"
    if type(value) in (int, float) and math.isfinite(value):
        return str(value)
    raise ValidationError("Unsupported SQL literal")


def render_sql(venues: list[dict]) -> str:
    """Accept only validate_document output. No execution or external side effects."""
    columns = (
        "slug", "name", "address", "category", "latitude", "longitude", "time_zone",
        "public_access", "source_url", "source_evidence", "checked_at", "provenance_status",
        "published", "is_fixture",
    )
    lines = [
        "-- GENERATED real sourced venues. No sensory observations. Review before applying.",
        "-- Schema prerequisite: 202610200001_foundation.sql. Apply only to your selected test database first.",
        "BEGIN;", "SET LOCAL standard_conforming_strings = on;",
    ]
    for venue in venues:
        lines.extend([
            "INSERT INTO public.spaces (" + ", ".join(columns) + ")",
            "VALUES (" + ", ".join(sql_literal(venue[key]) for key in columns) + ")",
            "ON CONFLICT (slug) DO UPDATE SET",
            ",\n".join(f"  {key} = EXCLUDED.{key}" for key in columns if key != "slug"),
            "WHERE spaces.checked_at IS NULL OR EXCLUDED.checked_at >= spaces.checked_at;",
        ])
        for key in FEATURE_KEYS:
            feature = venue["features"][key]
            values = [key, feature["value"], feature["verification"], feature["source_url"], feature["checked_at"], feature["evidence"]]
            lines.extend([
                "INSERT INTO public.space_features (space_id, feature, value, verification, source_url, checked_at, evidence)",
                "SELECT id, " + ", ".join(sql_literal(value) for value in values),
                f"FROM public.spaces WHERE slug = {sql_literal(venue['slug'])}",
                f"  AND checked_at <= {sql_literal(venue['checked_at'])}::timestamptz",
                "ON CONFLICT (space_id, feature) DO UPDATE SET",
                "  value = EXCLUDED.value, verification = EXCLUDED.verification, source_url = EXCLUDED.source_url,",
                "  checked_at = EXCLUDED.checked_at, evidence = EXCLUDED.evidence",
                # Do not replace independently reviewed newer facility evidence.
                "WHERE space_features.checked_at IS NULL OR EXCLUDED.checked_at >= space_features.checked_at",
                f"  OR (EXCLUDED.verification = 'unknown' AND space_features.checked_at <= {sql_literal(venue['checked_at'])}::timestamptz);",
            ])
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def read_document(path: Path) -> object:
    def no_duplicates(pairs: list[tuple[str, object]]) -> dict:
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValidationError("Duplicate JSON object key")
            result[key] = value
        return result
    if path.stat().st_size > 1_000_000:
        raise ValidationError("Curated import exceeds 1 MB")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=no_duplicates)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--as-of", help="ISO validation clock with offset; default is actual UTC now")
    parser.add_argument("--output", type=Path, help="Write SQL under artifacts/; default validates only")
    args = parser.parse_args(argv)
    try:
        as_of = timestamp(args.as_of, "as_of") if args.as_of else datetime.now(timezone.utc)
        venues = validate_document(read_document(args.source), as_of)
        if args.output:
            target = args.output.resolve()
            artifact_root = (ROOT / "artifacts").resolve()
            if not target.is_relative_to(artifact_root) or target.suffix.lower() != ".sql" or target == args.source.resolve():
                raise ValidationError("SQL output must be a .sql file under this project's artifacts directory")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(render_sql(venues), encoding="utf-8", newline="\n")
        print(f"Validated {len(venues)} real venue records ({sum(v['published'] for v in venues)} marked publishable); no database writes.")
        if args.output:
            print("SQL generated for review; application to PostgreSQL has NOT been performed.")
        return 0
    except (ValidationError, OSError, ValueError, TypeError) as exc:
        # Do not echo malformed data or filesystem/credential values in CLI output.
        if isinstance(exc, ValidationError):
            print(f"Validation failed: {exc}", file=sys.stderr)
        else:
            print("Import failed: check the input file format and local output permissions.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
