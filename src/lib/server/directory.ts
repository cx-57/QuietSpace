import "server-only";
import venueData from "../../../data/venues/boston-libraries.json";
import { FEATURE_KEYS } from "../contracts.ts";
import type { Directory, Result } from "../contracts.ts";
import { adaptFacility, adaptReport, adaptSpace, object, SLUG_PATTERN, UUID_PATTERN } from "../public-data.ts";
import { loadPostgresDirectory } from "./postgres.ts";
import { communityStore } from "./accounts.ts";

export function publicConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const parsed = new URL(url);
  if ((parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) || parsed.username || parsed.password) throw new Error("Invalid configuration");
  return { url: parsed.origin, key };
}

async function readRows(config: { url: string; key: string }, table: string, query: URLSearchParams): Promise<unknown[]> {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, Prefer: "count=exact" },
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Public read unavailable");
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error("Malformed public read");
  // Fail explicitly if the bounded query cannot represent all matching observations.
  const range = response.headers.get("content-range");
  const total = range?.split("/")[1];
  if (total && total !== "*" && Number(total) > result.length) throw new Error("Public result exceeds configured bounds");
  return result;
}

export async function loadDirectory(now = new Date(), identifier?: string): Promise<Result<Directory>> {
  const result = await loadSourceDirectory(now, identifier);
  if (result.ok) {
    const summaries = communityStore().ratingSummaries(now);
    for (const space of result.value.spaces) space.visitorRatings = summaries[space.slug];
  }
  return result;
}

async function loadSourceDirectory(now = new Date(), identifier?: string): Promise<Result<Directory>> {
  try {
    const mode = process.env.QUIETSPACE_DATA_MODE ?? "curated";
    if (identifier && !(UUID_PATTERN.test(identifier) || (identifier.length <= 120 && SLUG_PATTERN.test(identifier)))) return { ok: false, error: { code: "not_found", message: "Venue not found." } };
    if (mode === "curated") {
      const spaces = venueData.venues.filter(r => !identifier || r.slug === identifier).flatMap(row => {
        const space = adaptSpace(row, now, true);
        if (!space) return [];
        const features = object(row.features);
        for (const key of FEATURE_KEYS) if (features[key]) space.features[key] = adaptFacility(features[key], now);
        return [space];
      });
      return { ok: true, value: { mode, spaces, asOf: now.toISOString() } };
    }
    if (mode === "postgres") {
      if (!process.env.DATABASE_URL) return { ok: false, error: { code: "setup_required", message: "The directory connection has not been configured." } };
      return { ok: true, value: await loadPostgresDirectory(now, identifier) };
    }
    if (mode !== "supabase") throw new Error("Invalid data mode");
    const config = publicConfig();
    if (!config) return { ok: false, error: { code: "setup_required", message: "The public directory connection has not been configured." } };
    const query = new URLSearchParams({ select: "*", published: "eq.true", is_fixture: "eq.false", provenance_status: "eq.verified", public_access: "eq.public", order: "name.asc,id.asc", limit: "100" });
    if (identifier) query.set(UUID_PATTERN.test(identifier) ? "id" : "slug", `eq.${identifier}`);
    const rows = await readRows(config, "spaces", query);
    const spaces = rows.flatMap(row => { const space = adaptSpace(row, now); return space ? [space] : []; });
    if (!spaces.length) return { ok: true, value: { mode, spaces, asOf: now.toISOString() } };
    const ids = new Set(spaces.map(s => s.id));
    const inIds = `in.(${[...ids].join(",")})`;
    const [features, reports] = await Promise.all([
      readRows(config, "public_space_features", new URLSearchParams({ select: "*", space_id: inIds, limit: "500" })),
      readRows(config, "sensory_reports", new URLSearchParams({ select: "id,space_id,noise,crowds,brightness,scent,observed_at,created_at,status,is_fixture", space_id: inIds, status: "eq.approved", is_fixture: "eq.false", observed_at: `gte.${new Date(now.getTime() - 60 * 86_400_000).toISOString()}`, order: "observed_at.desc,id.asc", limit: "10000" })),
    ]);
    for (const raw of features) {
      const row = object(raw);
      const space = spaces.find(s => s.id === row.space_id);
      const feature = FEATURE_KEYS.find(f => f === row.feature);
      if (!space || !feature) throw new Error("Invalid feature parent/key");
      space.features[feature] = adaptFacility(row, now);
    }
    for (const raw of reports) {
      const report = adaptReport(raw, ids, now);
      if (report) spaces.find(s => s.id === report.spaceId)!.reports.push(report);
    }
    return { ok: true, value: { mode, spaces, asOf: now.toISOString() } };
  } catch {
    return { ok: false, error: { code: "unavailable", message: "We could not load the directory. Please try again later." } };
  }
}
