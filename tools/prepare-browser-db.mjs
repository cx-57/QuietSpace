// Explicit isolated test database. Never runs during application startup.
import pg from "pg";
import { readFileSync } from "node:fs";
const connection = "postgresql://quietspace_owner@127.0.0.1:55432/postgres";
const root = new pg.Client(connection); await root.connect();
if (!(await root.query("SELECT 1 FROM pg_database WHERE datname='quietspace_browser_test'")).rowCount) await root.query("CREATE DATABASE quietspace_browser_test");
await root.end();
const db = new pg.Client(connection.replace("/postgres", "/quietspace_browser_test")); await db.connect();
if (!(await db.query("SELECT to_regclass('public.spaces') AS name")).rows[0].name) {
  await db.query(readFileSync("supabase/tests/bootstrap_roles.sql","utf8"));
  for (const path of ["202610200001_foundation.sql","202610220001_report_abuse_controls.sql"]) await db.query(readFileSync(`supabase/migrations/${path}`,"utf8"));
}
await db.query(readFileSync('supabase/migrations/202610230001_cleanup_capability.sql','utf8'));
if(!(await db.query("SELECT 1 FROM pg_roles WHERE rolname='quietspace_app'")).rowCount){
  const sql=await db.query("SELECT format('CREATE ROLE quietspace_app LOGIN NOINHERIT PASSWORD %L',$1::text) AS sql",[process.env.PGPASSWORD??'SAMPLE-local-test-only']);await db.query(sql.rows[0].sql);
}
await db.query('GRANT anon,service_role TO quietspace_app');
await db.query("INSERT INTO public.spaces(id,slug,name,address,category,time_zone,public_access,source_url,source_evidence,checked_at,provenance_status,published,is_fixture) VALUES('10000000-0000-4000-8000-000000000001','sample-test-library','SAMPLE Test Library','SAMPLE Boston address','library','America/New_York','public','https://example.org/sample','SAMPLE fixture in isolated test database only',now()-interval '1 day','verified',true,false) ON CONFLICT(id) DO UPDATE SET checked_at=now()-interval '1 day'");
await db.end(); console.log("Isolated browser PostgreSQL database prepared with explicitly synthetic venue.");
