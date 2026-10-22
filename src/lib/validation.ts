import { DIMENSIONS } from "./contracts.ts";
import type { FacilityEvidence, Intensities, ReportInput, Result } from "./contracts.ts";

const DAY_MS = 86_400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

export function parseReportInput(input: unknown, now: Date = new Date()): Result<ReportInput> {
  const invalid = (field: string, message: string): Result<ReportInput> => ({
    ok: false, error: { code: "invalid_input", message: "Check your observation.", fields: { [field]: message } },
  });
  if (!record(input) || !exactKeys(input, ["spaceId", "observedAt", "intensities"])) {
    return invalid("form", "Only spaceId, observedAt and intensities are accepted.");
  }
  if (typeof input.spaceId !== "string" || !UUID.test(input.spaceId)) {
    return invalid("spaceId", "Choose a valid venue.");
  }
  if (typeof input.observedAt !== "string" || !TIMESTAMP.test(input.observedAt)) {
    return invalid("observedAt", "Provide an ISO timestamp with a time-zone offset.");
  }
  if (!input.observedAt.endsWith("Z")) {
    const [offsetHour, offsetMinute] = input.observedAt.slice(-5).split(":").map(Number);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) {
      return invalid("observedAt", "Provide a valid time-zone offset.");
    }
  }
  const observed = Date.parse(input.observedAt);
  if (!Number.isFinite(observed) || !Number.isFinite(now.getTime()) ||
      observed < now.getTime() - 60 * DAY_MS || observed > now.getTime() + 300_000) {
    return invalid("observedAt", "Use a visit from the last 60 days, not a future visit.");
  }
  // Date.parse normalizes impossible calendar dates on some engines; reject those explicitly.
  const [year, month, day] = input.observedAt.slice(0, 10).split("-").map(Number);
  const [hour, minute, second] = input.observedAt.slice(11, 19).split(":").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() ||
      hour > 23 || minute > 59 || second > 59) {
    return invalid("observedAt", "Provide a real calendar date.");
  }
  if (!record(input.intensities) || !exactKeys(input.intensities, DIMENSIONS)) {
    return invalid("intensities", "Provide all four dimensions; use null for unobserved dimensions.");
  }
  let observedDimensions = 0;
  for (const dimension of DIMENSIONS) {
    const rating = input.intensities[dimension];
    if (rating === null) continue;
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return invalid(dimension, "Choose a whole-number intensity from 1 to 5, or null.");
    }
    observedDimensions++;
  }
  if (observedDimensions === 0) return invalid("intensities", "Observe at least one dimension.");
  const validatedIntensities = input.intensities;
  return { ok: true, value: {
    spaceId: input.spaceId.toLowerCase(), observedAt: new Date(observed).toISOString(),
    intensities: Object.fromEntries(DIMENSIONS.map(d => [d, validatedIntensities[d]])) as Intensities,
  } };
}

/** Treat expired evidence as unknown before display or strict facility filtering. */
export function effectiveFacility(evidence: FacilityEvidence, now: Date = new Date()): FacilityEvidence {
  const unknown: FacilityEvidence = {
    verification: "unknown", value: null, sourceUrl: null, checkedAt: null, evidence: null,
  };
  if (evidence.verification === "unknown") return unknown;
  const checked = Date.parse(evidence.checkedAt);
  if (!Number.isFinite(checked) || !Number.isFinite(now.getTime()) || checked > now.getTime() ||
      checked < now.getTime() - 90 * DAY_MS) return unknown;
  return evidence;
}
