import "server-only";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import type { Directory, ReportInput, ReportReceipt, Result } from "../contracts.ts";
import { FEATURE_KEYS } from "../contracts.ts";
import { adaptFacility, adaptReport, adaptSpace, UUID_PATTERN } from "../public-data.ts";

const state = globalThis as typeof globalThis & { quietspacePool?: Pool };
function pool() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured");
  if (!state.quietspacePool) {
    state.quietspacePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 4000, idleTimeoutMillis: 10000, statement_timeout: 8000 });
    // Idle connection loss must not become an uncaught EventEmitter error or disclose connection details.
    state.quietspacePool.on("error", () => {});
  }
  return state.quietspacePool;
}
export async function withDatabaseRole<T>(role: "anon" | "service_role", action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query(role === "anon" ? "BEGIN READ ONLY" : "BEGIN");
    await client.query(role === "anon" ? "SET LOCAL ROLE anon" : "SET LOCAL ROLE service_role");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) { try { await client.query("ROLLBACK"); } catch { /* connection already lost */ } throw error; }
  finally { client.release(); }
}
function wire(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}
export async function loadPostgresDirectory(now: Date, identifier?: string): Promise<Directory> {
  return withDatabaseRole("anon", async client => {
    const filter = identifier ? UUID_PATTERN.test(identifier) ? "WHERE id = $1::uuid" : "WHERE slug = $1" : "";
    const rows = await client.query(`SELECT * FROM public.spaces ${filter} ORDER BY name, id LIMIT 101`, identifier ? [identifier] : []);
    if (rows.rows.length > 100) throw new Error("Directory exceeds bounds");
    const spaces = rows.rows.flatMap(row => { const space = adaptSpace(wire(row), now); return space ? [space] : []; });
    const ids = new Set(spaces.map(s => s.id));
    if (spaces.length) {
      const features = await client.query("SELECT * FROM public.public_space_features WHERE space_id = ANY($1::uuid[])", [[...ids]]);
      const reports = await client.query("SELECT * FROM public.sensory_reports WHERE space_id = ANY($1::uuid[]) AND observed_at >= $2 ORDER BY observed_at DESC, id LIMIT 10001", [[...ids], new Date(now.getTime() - 60 * 86400000)]);
      if (reports.rows.length > 10000) throw new Error("Evidence exceeds bounds");
      for (const raw of features.rows) {
        const row = wire(raw), feature = FEATURE_KEYS.find(f => f === row.feature);
        const space = spaces.find(s => s.id === row.space_id);
        if (!space || !feature) throw new Error("Unexpected feature");
        space.features[feature] = adaptFacility(row, now);
      }
      for (const raw of reports.rows) {
        const report = adaptReport(wire(raw), ids, now);
        if (report) spaces.find(s => s.id === report.spaceId)!.reports.push(report);
      }
    }
    return { mode: "postgres", spaces, asOf: now.toISOString() };
  });
}
export async function submitPostgresReport(input: ReportInput, key: string, fingerprint: string): Promise<Result<ReportReceipt>> {
  try {
    const id = await withDatabaseRole("service_role", async client => {
      const result = await client.query("SELECT public.submit_rate_limited_report($1::uuid,$2::timestamptz,$3::smallint,$4::smallint,$5::smallint,$6::smallint,$7::text,$8::text) AS id", [input.spaceId, input.observedAt, input.intensities.noise, input.intensities.crowds, input.intensities.brightness, input.intensities.scent, key, fingerprint]);
      return result.rows[0].id as string;
    });
    return { ok: true, value: { id, status: "pending" } };
  } catch (error) {
    const code = (error as { code?: string }).code;
    return { ok: false, error: code === "P0429" ? { code: "rate_limited", message: "This observation was repeated or the submission limit was reached. Please wait before sending another." } : code === "22023" ? { code: "not_found", message: "This venue or visit time is no longer available." } : { code: "unavailable", message: "We could not confirm submission. Your inputs are still here. Please try again later." } };
  }
}
