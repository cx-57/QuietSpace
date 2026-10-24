"""Executable importer/security tests; no Node or database required."""
from copy import deepcopy
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

from tools.import_venues import (
    DEFAULT_SOURCE, FEATURE_KEYS, UNKNOWN, ValidationError,
    main, read_document, render_sql, sql_literal, timestamp, validate_document,
)

ROOT = Path(__file__).resolve().parents[1]
AS_OF = datetime(2026, 10, 23, 23, 59, 59, tzinfo=timezone.utc)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.document = json.loads(DEFAULT_SOURCE.read_text(encoding="utf-8"))

    def validate(self):
        return validate_document(self.document, AS_OF)

    def test_real_curated_batch_has_multiple_venue_types_no_sensory_observations(self):
        venues = self.validate()
        self.assertEqual(len(venues), 11)
        self.assertTrue(all(venue["public_access"] == "public" and not venue["is_fixture"] for venue in venues))
        self.assertTrue(all(venue["latitude"] is None and venue["longitude"] is None for venue in venues))
        self.assertEqual({v["category"] for v in venues}, {"library", "park", "museum"})
        self.assertEqual(sum(v["features"]["quiet_room"]["value"] is True for v in venues), 5)
        self.assertTrue(all(v["features"]["accessible_entrance"]["value"] is True
                            for v in venues if v["slug"] in {"bpl-central", "bpl-east-boston", "mfa-boston"}))
        self.assertTrue(all(v["features"]["seating"]["value"] is True
                            for v in venues if v["category"] == "park"))
        self.assertTrue(all(venue["features"]["step_free_access"] == UNKNOWN for venue in venues))

    def test_unknown_and_verified_false_are_distinct(self):
        entrance = self.document["venues"][0]["features"]["accessible_entrance"]
        entrance["value"] = False
        venue = next(v for v in self.validate() if v["slug"] == "bpl-central")
        self.assertIs(venue["features"]["accessible_entrance"]["value"], False)
        self.assertIsNone(venue["features"]["accessible_toilet"]["value"])

    def test_validator_does_not_mutate_source(self):
        original = deepcopy(self.document)
        self.validate()
        self.assertEqual(self.document, original)

    def test_duplicate_slug_name_address_or_source_fails_entire_batch(self):
        for field in ("slug", "name", "address", "source_url"):
            with self.subTest(field=field):
                document = deepcopy(self.document)
                document["venues"][1][field] = document["venues"][0][field]
                with self.assertRaisesRegex(ValidationError, "duplicate"):
                    validate_document(document, AS_OF)
        self.document["venues"][1]["name"] = self.document["venues"][0]["name"].upper().replace("—", "-")
        with self.assertRaisesRegex(ValidationError, "duplicate"):
            self.validate()

    def test_missing_or_unsupported_fields_rejected(self):
        for field in ("source_url", "address", "checked_at", "is_fixture"):
            with self.subTest(field=field):
                document = deepcopy(self.document)
                del document["venues"][0][field]
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)
        for key in ("noise", "report_count", "currently_quiet", "hours", "diagnosis"):
            with self.subTest(key=key):
                document = deepcopy(self.document)
                document["venues"][0][key] = "unsupported"
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_malformed_documents_fail_closed(self):
        for document in (None, [], {}, {"format_version": True, "venues": []}, {"format_version": 1, "venues": []}):
            with self.subTest(document=document), self.assertRaises(ValidationError):
                validate_document(document, AS_OF)

    def test_coordinates_reject_partial_out_of_range_nonfinite_or_coerced(self):
        for lat, lon in ((91, 0), (0, -181), (None, 1), (1, None), (True, 1), ("42", 0), (float("nan"), 0), (0, float("inf"))):
            with self.subTest(lat=lat, lon=lon):
                document = deepcopy(self.document)
                document["venues"][0].update(latitude=lat, longitude=lon)
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_restricted_unknown_or_fictional_venues_rejected(self):
        for changes in ({"public_access": "restricted"}, {"public_access": "unknown"}, {"is_fixture": True},
                        {"name": "DEMO public room"}, {"name": "SAMPLE library"}, {"is_fixture": "false"}):
            with self.subTest(changes=changes):
                document = deepcopy(self.document)
                document["venues"][0].update(changes)
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_sources_require_https_official_host_without_credentials(self):
        urls = (None, "", "http://www.bpl.org/", "https://example.com/", "https://www.bpl.org.evil.test/",
                "https://secret@www.bpl.org/", "https://www.bpl.org:443/", "https://www.bpl.org/?token=secret",
                "https://www.bpl.org/#claim", "https://www.bpl.org/\nforged", "javascript:alert(1)", "https://[invalid/", "HTTPS://www.bpl.org/")
        for url in urls:
            with self.subTest(url=url):
                document = deepcopy(self.document)
                document["venues"][0]["source_url"] = url
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_stale_published_sources_require_review(self):
        self.document["venues"][0]["checked_at"] = "2026-01-01T00:00:00Z"
        with self.assertRaisesRegex(ValidationError, "stale"):
            self.validate()
        self.document["venues"][0].update(published=False, provenance_status="needs_review")
        self.assertEqual(len(self.validate()), 11)

    def test_unverified_published_source_rejected(self):
        self.document["venues"][0]["provenance_status"] = "unverified"
        with self.assertRaises(ValidationError):
            self.validate()

    def test_timestamp_and_timezone_validation(self):
        for stamp in ("2026-02-30T12:00:00Z", "2026-10-20", "2026-10-20T18:00:00", "2026-10-24T00:00:00Z",
                      "2026-10-20T12:00:00+00:99", "2026-10-20T12:00:00+14:01", "2026-10-20T12:00:00-23:00", None):
            with self.subTest(stamp=stamp):
                document = deepcopy(self.document)
                document["venues"][0]["checked_at"] = stamp
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)
        for zone in ("Mars/Olympus", "UTC", "EST", "Europe/London"):
            with self.subTest(zone=zone):
                document = deepcopy(self.document)
                document["venues"][0]["time_zone"] = zone
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)
        self.assertEqual(timestamp("2026-10-20T14:00:00-04:00", "test").hour, 18)

    def test_feature_unknown_never_turns_into_zero_or_false(self):
        for value in (False, True, 0, "unknown"):
            with self.subTest(value=value):
                document = deepcopy(self.document)
                document["venues"][0]["features"]["step_free_access"] = {**UNKNOWN, "value": value}
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_feature_verification_requires_fresh_specific_evidence(self):
        for changes in ({"value": 1}, {"evidence": ""}, {"source_url": None}, {"checked_at": "2026-01-01T00:00:00Z"},
                        {"checked_at": "2026-10-24T00:00:00Z"}, {"verification": "community_reported"}):
            with self.subTest(changes=changes):
                document = deepcopy(self.document)
                document["venues"][0]["features"]["accessible_entrance"].update(changes)
                with self.assertRaises(ValidationError):
                    validate_document(document, AS_OF)

    def test_sql_is_deterministic_and_has_no_report_writes_or_fake_ids(self):
        sql = render_sql(self.validate())
        self.document["venues"].reverse()
        self.assertEqual(sql, render_sql(self.validate()))
        expected = len(self.validate())
        self.assertEqual(sql.count("INSERT INTO public.spaces ("), expected)
        self.assertEqual(sql.count("INSERT INTO public.space_features ("), expected * len(FEATURE_KEYS))
        self.assertNotIn("INSERT INTO public.sensory_reports", sql)
        self.assertIn("ON CONFLICT (slug) DO UPDATE", sql)
        self.assertIn("ON CONFLICT (space_id, feature) DO UPDATE", sql)
        self.assertIn("EXCLUDED.checked_at >= spaces.checked_at", sql)
        self.assertNotIn("DROP ", sql)
        self.assertIn("standard_conforming_strings = on", sql)
        self.assertTrue(sql.endswith("COMMIT;\n"))

    def test_sql_escapes_quotes_and_disables_backslash_injection(self):
        hostile = "A'; DELETE FROM public.spaces; --\\"
        self.document["venues"][0]["name"] = hostile
        sql = render_sql(self.validate())
        self.assertIn("'A''; DELETE FROM public.spaces; --\\'", sql)
        self.assertEqual(sql_literal(False), "false")
        self.assertEqual(sql_literal(None), "NULL")
        with self.assertRaises(ValidationError):
            sql_literal("NUL\x00")
        with self.assertRaises(ValidationError):
            sql_literal(float("nan"))

    def test_duplicate_json_keys_rejected_before_validation(self):
        artifacts = (ROOT / "artifacts").resolve()
        artifacts.mkdir(exist_ok=True)
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=artifacts, suffix=".json", delete=False) as handle:
            path = Path(handle.name).resolve()
            handle.write('{"format_version":1,"format_version":1,"venues":[]}')
        try:
            with self.assertRaisesRegex(ValidationError, "Duplicate JSON"):
                read_document(path)
        finally:
            if not path.is_relative_to(artifacts):
                raise AssertionError("Test output escaped the workspace artifacts directory")
            path.unlink()

    def test_cli_validate_has_no_database_side_effects(self):
        completed = subprocess.run([sys.executable, str(ROOT / "tools/import_venues.py"), "--as-of", AS_OF.isoformat()],
                                   cwd=ROOT, capture_output=True, text=True, check=False)
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("11 real venue records", completed.stdout)
        self.assertIn("no database writes", completed.stdout)

    def test_cli_fails_safely_and_does_not_print_malformed_data(self):
        output = io.StringIO()
        with redirect_stderr(output), redirect_stdout(output):
            code = main(["--as-of", AS_OF.isoformat(), "--output", str(ROOT / "supabase/migrations/overwrite.sql")])
        self.assertEqual(code, 1)
        self.assertIn("artifacts directory", output.getvalue())
        self.assertFalse((ROOT / "supabase/migrations/overwrite.sql").exists())


if __name__ == "__main__":
    unittest.main()
