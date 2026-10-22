import { DIMENSIONS, FEATURE_KEYS } from "./contracts.ts";
import type { ApprovedReport, FacilityEvidence, Intensities, PublicSpace } from "./contracts.ts";
import { effectiveFacility } from "./validation.ts";

export const UNKNOWN_FACILITY: FacilityEvidence = { verification: "unknown", value: null, sourceUrl: null, checkedAt: null, evidence: null };
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid public data");
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2048): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid public text");
  return value;
}
export function safeSource(value: unknown): string {
  const url = new URL(text(value));
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Unsafe source");
  return url.href;
}
function date(value: unknown): string {
  const result = text(value, 50);
  if (!Number.isFinite(Date.parse(result))) throw new Error("Invalid public date");
  return result;
}
export function adaptFacility(value: unknown, now: Date): FacilityEvidence {
  const row = object(value);
  if (row.verification === "unknown") return UNKNOWN_FACILITY;
  if (row.verification !== "verified" || typeof row.value !== "boolean") throw new Error("Invalid facility");
  return effectiveFacility({ verification: "verified", value: row.value, sourceUrl: safeSource(row.source_url), checkedAt: date(row.checked_at), evidence: text(row.evidence, 500) }, now);
}

/** Public network data is validated and mapped explicitly. No unchecked casts to domain rows. */
export function adaptSpace(value: unknown, now: Date, curated = false): PublicSpace | null {
  const row = object(value);
  if (row.published !== true || row.is_fixture !== false || row.provenance_status !== "verified" || row.public_access !== "public") return null;
  const checkedAt = date(row.checked_at);
  if (Date.parse(checkedAt) > now.getTime() || Date.parse(checkedAt) < now.getTime() - 90 * 86_400_000) return null;
  const slug = text(row.slug, 120);
  if (!SLUG_PATTERN.test(slug)) throw new Error("Invalid slug");
  const id = curated ? slug : text(row.id, 36);
  if (!curated && !UUID_PATTERN.test(id)) throw new Error("Invalid ID");
  if (!["library", "park", "community_centre", "museum"].includes(String(row.category))) throw new Error("Invalid category");
  const timeZone = text(row.time_zone, 100);
  new Intl.DateTimeFormat("en", { timeZone }).format(now);
  const lat = row.latitude, lon = row.longitude;
  if (!((lat === null && lon === null) || (typeof lat === "number" && typeof lon === "number" &&
      Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180))) throw new Error("Invalid coordinates");
  return {
    id, slug, name: text(row.name, 160), address: text(row.address, 300), category: row.category as PublicSpace["category"],
    latitude: lat as number | null, longitude: lon as number | null, timeZone,
    source: { sourceUrl: safeSource(row.source_url), checkedAt, provenanceStatus: "verified", evidence: text(row.source_evidence, 1000) },
    features: Object.fromEntries(FEATURE_KEYS.map(f => [f, UNKNOWN_FACILITY])) as PublicSpace["features"], reports: [],
  };
}

export function adaptReport(value: unknown, spaceIds: Set<string>, now: Date): ApprovedReport | null {
  const row = object(value);
  if (row.status !== "approved" || row.is_fixture !== false || !spaceIds.has(String(row.space_id))) return null;
  const id = text(row.id, 36);
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid report ID");
  const intensities = {} as Intensities;
  for (const d of DIMENSIONS) {
    const rating = row[d];
    if (rating !== null && !(typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5)) throw new Error("Invalid report intensity");
    intensities[d] = rating as Intensities[typeof d];
  }
  if (DIMENSIONS.every(d => intensities[d] === null)) throw new Error("Empty report");
  const observedAt = date(row.observed_at), createdAt = date(row.created_at);
  if (Date.parse(observedAt) > now.getTime() || Date.parse(createdAt) > now.getTime() ||
      Date.parse(observedAt) < now.getTime() - 60 * 86_400_000 || Date.parse(observedAt) > Date.parse(createdAt) + 300_000) return null;
  return { id, spaceId: String(row.space_id), intensities, observedAt, createdAt, status: "approved", isFixture: false };
}
