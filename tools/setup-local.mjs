import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import pg from "pg";
const root = resolve(import.meta.dirname, "..");
const envPath = join(root, ".env.local");
if (existsSync(envPath) && !readFileSync(envPath, "utf8").includes("# QuietSpace local setup")) throw new Error("Existing custom .env.local preserved. Configure a local database manually.");
const pgBin = process.env.PG_BIN ?? (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "");
const exe = name => pgBin ? join(pgBin, name + (process.platform === "win32" ? ".exe" : "")) : name;
const data = join(root, "artifacts/pgdata");
mkdirSync(join(root, "artifacts/database"), { recursive: true });
function run(name, args) {
  const result = spawnSync(exe(name), args, { cwd: root, stdio: "inherit", windowsHide: true });
  if (result.status !== 0) throw new Error(`${name} failed. Check its output above.`);
}
if (!existsSync(join(data, "PG_VERSION"))) run("initdb", ["-D", data, "-U", "quietspace_owner", "--auth-local=trust", "--auth-host=trust", "--encoding=UTF8", "--locale=C"]);
const ready = spawnSync(exe("pg_isready"), ["-h", "127.0.0.1", "-p", "55432"], { stdio: "ignore", windowsHide: true });
if (ready.status !== 0) run("pg_ctl", ["-D", data, "-l", join(root, "artifacts/database/postgres.log"), "-o", "-h 127.0.0.1 -p 55432", "start"]);
const owner = new pg.Client("postgresql://quietspace_owner@127.0.0.1:55432/postgres");
await owner.connect();
if (!(await owner.query("SELECT 1 FROM pg_database WHERE datname='quietspace_dev'")).rowCount) await owner.query("CREATE DATABASE quietspace_dev");
await owner.end();
const db = new pg.Client("postgresql://quietspace_owner@127.0.0.1:55432/quietspace_dev");
await db.connect();
await db.query(readFileSync(join(root, "supabase/tests/bootstrap_roles.sql"), "utf8"));
await db.query("CREATE TABLE IF NOT EXISTS public.quietspace_migrations(name text PRIMARY KEY)");
for (const migration of ["202610200001_foundation.sql", "202610220001_report_abuse_controls.sql", "202610230001_cleanup_capability.sql"]) {
  if (!(await db.query("SELECT 1 FROM public.quietspace_migrations WHERE name=$1", [migration])).rowCount) {
    await db.query(readFileSync(join(root, "supabase/migrations", migration), "utf8"));
    await db.query("INSERT INTO public.quietspace_migrations VALUES($1)", [migration]);
  }
}
const password = randomBytes(24).toString("hex");
const roleExists = (await db.query("SELECT 1 FROM pg_roles WHERE rolname='quietspace_app'")).rowCount;
const statement = await db.query(roleExists ? "SELECT format('ALTER ROLE quietspace_app PASSWORD %L', $1::text) AS sql" : "SELECT format('CREATE ROLE quietspace_app LOGIN NOINHERIT PASSWORD %L', $1::text) AS sql", [password]);
await db.query(statement.rows[0].sql);
await db.query("GRANT anon, service_role TO quietspace_app");
await db.query("REVOKE ALL ON public.quietspace_migrations FROM public, anon, authenticated, service_role, quietspace_app");
await db.end();
const imported = spawnSync("python", ["tools/import_venues.py", "--output", "artifacts/venues.sql"], { cwd: root, stdio: "inherit", windowsHide: true });
if (imported.status !== 0) throw new Error("Venue source validation failed; no review dates were changed.");
const seed = new pg.Client("postgresql://quietspace_owner@127.0.0.1:55432/quietspace_dev");
await seed.connect(); await seed.query(readFileSync(join(root, "artifacts/venues.sql"), "utf8")); await seed.end();
// A dedicated local cluster only. The owner URI is operator-only; the app uses a restricted login.
const env = {
  QUIETSPACE_DATA_MODE: "postgres", DATABASE_URL: `postgresql://quietspace_app:${password}@127.0.0.1:55432/quietspace_dev`,
  LOCAL_OPERATOR_DATABASE_URL: "postgresql://quietspace_owner@127.0.0.1:55432/quietspace_dev", REPORTS_ENABLED: "true",
  APP_ORIGIN: "http://localhost:3000", REPORT_ABUSE_SECRET: randomBytes(32).toString("hex"), NEXT_TELEMETRY_DISABLED: "1",
};
writeFileSync(envPath, "# QuietSpace local setup. Localhost only; never deploy this file.\n" + Object.entries(env).map(([key,value]) => `${key}=${value}`).join("\n") + "\n", { mode: 0o600 });
console.log("Local PostgreSQL ready; five sourced venues, no fabricated reports. Run npm run dev and open http://localhost:3000.");
