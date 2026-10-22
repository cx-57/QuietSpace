"""Static cross-layer/security checks, explicitly NOT PostgreSQL RLS execution."""
import json
from pathlib import Path
import re
import subprocess
import unittest

from tools.import_venues import CATEGORIES, FEATURE_KEYS, PROVENANCE

ROOT = Path(__file__).resolve().parents[1]
SQL = (ROOT / "supabase/migrations/202610200001_foundation.sql").read_text(encoding="utf-8")
TS = (ROOT / "src/lib/contracts.ts").read_text(encoding="utf-8")


class RepositoryContracts(unittest.TestCase):
    def test_feature_keys_align_across_importer_types_and_sql(self):
        enum = re.search(r"create type public.feature_key as enum \((.*?)\);", SQL, re.S).group(1)
        sql_keys = set(re.findall(r"'([^']+)'", enum))
        ts_array = re.search(r"FEATURE_KEYS = \[(.*?)\] as const", TS, re.S).group(1)
        ts_keys = set(re.findall(r'"([^"]+)"', ts_array))
        self.assertEqual(set(FEATURE_KEYS), sql_keys)
        self.assertEqual(sql_keys, ts_keys)

    def test_categories_and_provenance_align(self):
        category_check = re.search(r"category in \((.*?)\)", SQL).group(1)
        self.assertEqual(CATEGORIES, set(re.findall(r"'([^']+)'", category_check)))
        enum = re.search(r"create type public.provenance_status as enum \((.*?)\);", SQL).group(1)
        self.assertEqual(PROVENANCE, set(re.findall(r"'([^']+)'", enum)))
        for category in CATEGORIES:
            self.assertIn(f'"{category}"', TS)

    def test_schema_has_rating_null_and_moderation_guards(self):
        for dimension in ("noise", "crowds", "brightness", "scent"):
            self.assertIn(f"{dimension} smallint check ({dimension} between 1 and 5)", SQL)
        self.assertIn("status public.moderation_status not null default 'pending'", SQL)
        self.assertIn("num_nonnulls(noise, crowds, brightness, scent) >= 1", SQL)
        self.assertIn("constraint moderation_timestamp", SQL)
        self.assertNotRegex(SQL, r"(?i)\b(email|diagnosis|user_latitude|ip_address)\s+(text|varchar|inet|double)")

    def test_static_rls_capabilities_are_fail_closed(self):
        for table in ("spaces", "space_features", "sensory_reports"):
            self.assertIn(f"alter table public.{table} enable row level security;", SQL)
            self.assertIn(f"alter table public.{table} force row level security;", SQL)
        self.assertNotRegex(SQL, r"(?i)create policy[^;]+for\s+(insert|update|delete|all)")
        self.assertNotRegex(SQL, r"(?i)grant\s+(?:all|insert|update|delete)[^;]+to\s+(?:anon|authenticated)")
        self.assertIn("security_invoker = true", SQL)
        self.assertIn("status = 'approved' and not is_fixture", SQL)
        self.assertIn("revoke all on public.spaces, public.space_features, public.sensory_reports from public, anon, authenticated, service_role", SQL)
        self.assertIn("revoke create on schema public from public, anon, authenticated, service_role", SQL)
        self.assertRegex(SQL, r"security definer set search_path = ''")
        grants = re.findall(r"grant execute on function public.submit_sensory_report[^;]+;", SQL)
        self.assertEqual(len(grants), 1)
        self.assertTrue(grants[0].endswith("to service_role;"))

    def test_env_files_and_generated_artifacts_are_ignored(self):
        result = subprocess.run(["git", "check-ignore", ".env", ".env.local", ".env.production", "node_modules/example", ".next/example", "artifacts/venues.sql"],
                                cwd=ROOT, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(result.stdout.splitlines()), 6)
        public_secret_names = re.findall(r"^NEXT_PUBLIC_.*(?:SECRET|SERVICE_ROLE|DATABASE).*", (ROOT / ".env.example").read_text(), re.M)
        self.assertEqual(public_secret_names, [])

    def test_client_components_do_not_reference_privileged_credentials(self):
        for path in (ROOT / "src").rglob("*"):
            if path.suffix in (".ts", ".tsx"):
                text = path.read_text(encoding="utf-8")
                if re.search(r"^[\s\"']*use client", text):
                    self.assertNotIn("SUPABASE_SERVICE_ROLE_KEY", text)
                    self.assertNotIn("DATABASE_URL", text)
        # Page components keep configuration/credential access behind server-only adapters.
        for path in (ROOT / "src/app").rglob("*.tsx"):
            self.assertNotIn("process.env", path.read_text(encoding="utf-8"))

    def test_no_fixtures_or_imports_automatically_run_on_start_or_build(self):
        package = json.loads((ROOT / "package.json").read_text())
        self.assertEqual(package["scripts"]["build"], "next build")
        self.assertEqual(package["scripts"]["start"], "next start")
        self.assertNotIn("postinstall", package["scripts"])
        for route in ("page.tsx", "preferences/page.tsx", "spaces/[id]/page.tsx", "spaces/[id]/report/page.tsx"):
            self.assertTrue((ROOT / "src/app" / route).exists())


if __name__ == "__main__":
    unittest.main()
