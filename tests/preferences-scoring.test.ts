import assert from "node:assert/strict";
import test from "node:test";
import { DIMENSIONS } from "../src/lib/contracts.ts";
import type { ApprovedReport, Intensity, Intensities, Preferences, PublicSpace } from "../src/lib/contracts.ts";
import { DEFAULT_PREFERENCES, decodePreferences, meetsRequiredFeatures, parsePreferences } from "../src/lib/preferences.ts";
import { UNKNOWN_FACILITY } from "../src/lib/public-data.ts";
import { evidenceSummary, scoreSpace } from "../src/lib/sensory-score.ts";
import { discover } from "../src/lib/discovery.ts";

const now = new Date("2026-10-22T18:00:00Z");
const id = "10000000-0000-4000-8000-000000000001";
const preferences: Preferences = { ...DEFAULT_PREFERENCES, maximumIntensities: { noise: 2, crowds: 3, brightness: 3, scent: 2 } };
const reports = (ratings: Intensities = { noise: 2, crowds: 2, brightness: 3, scent: 1 }, count = 3): ApprovedReport[] => Array.from({ length: count }, (_, i) => ({
  id: `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`, spaceId: id,
  intensities: { ...ratings }, observedAt: `2026-10-${20 + i % 2}T12:00:00Z`, createdAt: "2026-10-22T16:00:00Z", status: "approved", isFixture: false,
}));
const space = (overrides: Partial<PublicSpace> = {}): PublicSpace => ({
  id, slug: "sample-test-library", name: "SAMPLE Test Library", address: "SAMPLE Boston", category: "library", latitude: null, longitude: null, timeZone: "America/New_York",
  source: { sourceUrl: "https://example.org/", provenanceStatus: "verified", checkedAt: now.toISOString(), evidence: "SAMPLE fixture only" },
  features: { accessible_entrance: UNKNOWN_FACILITY, step_free_access: UNKNOWN_FACILITY, accessible_toilet: UNKNOWN_FACILITY, seating: UNKNOWN_FACILITY, quiet_room: UNKNOWN_FACILITY }, reports: [], ...overrides,
});

test("preferences have optional null defaults and reject malformed, extra, coerced or future schemas", () => {
  assert.deepEqual(decodePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(decodePreferences(JSON.stringify(preferences)), preferences);
  assert.equal(decodePreferences("{broken"), null);
  for (const input of [null, [], {}, { ...preferences, version: 2 }, { ...preferences, diagnosis: "private" },
    { ...preferences, maximumIntensities: { noise: 2 } }, { ...preferences, requiredFeatures: ["unknown"] },
    { ...preferences, requiredFeatures: ["seating", "seating"] }]) assert.equal(parsePreferences(input), null);
  for (const value of [0, 6, 1.5, NaN, "2", true]) assert.equal(parsePreferences({ ...preferences, maximumIntensities: { ...preferences.maximumIntensities, noise: value } }), null);
});

test("strict required facilities distinguish fresh true, false, unknown, missing/stale evidence", () => {
  const item = space();
  assert.equal(meetsRequiredFeatures(item.features, [], now), true);
  assert.equal(meetsRequiredFeatures(item.features, ["seating"], now), false);
  item.features.seating = { verification: "verified", value: false, sourceUrl: "https://example.org/", checkedAt: now.toISOString(), evidence: "SAMPLE" };
  assert.equal(meetsRequiredFeatures(item.features, ["seating"], now), false);
  item.features.seating.value = true;
  assert.equal(meetsRequiredFeatures(item.features, ["seating"], now), true);
  item.features.seating.checkedAt = "2026-01-01T00:00:00Z";
  assert.equal(meetsRequiredFeatures(item.features, ["seating"], now), false);
});

test("test oracle: perfect fit, worst fit and brightness closeness", () => {
  assert.equal(scoreSpace(reports(), preferences, id, now).score, 100);
  const low = { ...preferences, maximumIntensities: { noise: 1, crowds: 1, brightness: 1, scent: 1 } } as Preferences;
  assert.equal(scoreSpace(reports({ noise: 5, crowds: 5, brightness: 5, scent: 5 }), low, id, now).score, 0);
  // Brightness 1 is two levels from preferred 3: .2 * .5 -> 10 point penalty.
  assert.equal(scoreSpace(reports({ noise: 2, crowds: 2, brightness: 1, scent: 1 }), preferences, id, now).score, 90);
  assert.equal(scoreSpace(reports({ noise: 1, crowds: 1, brightness: 3, scent: 1 }), preferences, id, now).score, 100);
});

test("sparse/absent/no-noise observations cannot produce a numeric score", () => {
  for (const count of [0, 1, 2]) assert.equal(scoreSpace(reports(undefined, count), preferences, id, now).score, null);
  const noiseOnly = reports().map(r => ({ ...r, intensities: { ...r.intensities, crowds: null, brightness: null, scent: null } }));
  assert.equal(scoreSpace(noiseOnly, preferences, id, now).score, null);
  const noNoise = reports().map(r => ({ ...r, intensities: { ...r.intensities, noise: null } }));
  assert.equal(scoreSpace(noNoise, preferences, id, now).score, null);
  assert.deepEqual(scoreSpace(reports(), DEFAULT_PREFERENCES, id, now), { score: null, reason: "no_preferences" });
});

test("available weights renormalize and null never becomes zero", () => {
  const items = reports({ noise: 5, crowds: 1, brightness: 3, scent: 1 }).map(r => ({ ...r, intensities: { ...r.intensities, brightness: null, scent: null } }));
  const result = scoreSpace(items, preferences, id, now);
  // (.4 * .25 + .25 * 1) / .65 * 100 = 53.846...
  assert.equal(result.score, 54);
  if (result.reason === "eligible") {
    assert.deepEqual(result.excludedDimensions, ["brightness", "scent"]);
    assert.ok(Math.abs(result.dimensions.reduce((sum, d) => sum + d.effectiveWeight, 0) - 1) < 1e-12);
  }
});

test("pending, rejected, fixtures, foreign parent, malformed, stale, duplicate and future reports are excluded", () => {
  for (const override of [{ status: "pending" }, { status: "rejected" }, { isFixture: true }, { spaceId: "another-venue" },
    { observedAt: "invalid" }, { observedAt: "2026-01-01T00:00:00Z" }, { observedAt: "2026-10-23T00:00:00Z" },
    { createdAt: "invalid" }, { intensities: { noise: 0, crowds: 2, brightness: 3, scent: 1 } }]) {
    assert.equal(scoreSpace(reports().map(r => ({ ...r, ...override })) as ApprovedReport[], preferences, id, now).score, null);
  }
  assert.equal(scoreSpace(Array(3).fill(reports()[0]), preferences, id, now).score, null);
  assert.equal(scoreSpace(reports(), preferences, id, new Date("bad")).score, null);
});

test("60-day boundary is inclusive; immediately older is excluded", () => {
  const boundary = new Date(now.getTime() - 60 * 86_400_000);
  const rows = reports().map(r => ({ ...r, observedAt: boundary.toISOString() }));
  assert.equal(scoreSpace(rows, preferences, id, now).score, 100);
  assert.equal(scoreSpace(rows.map(r => ({ ...r, observedAt: new Date(boundary.getTime() - 1).toISOString() })), preferences, id, now).score, null);
});

test("exhaustive intensity sweep: deterministic bounded scores and monotone noise tolerance", () => {
  for (let noise = 1; noise <= 5; noise++) for (let brightness = 1; brightness <= 5; brightness++) {
    const rows = reports({ noise: noise as Intensity, brightness: brightness as Intensity, crowds: 3, scent: 2 });
    let previous = -1;
    for (let tolerance = 1; tolerance <= 5; tolerance++) {
      const p = { ...preferences, maximumIntensities: { ...preferences.maximumIntensities, noise: tolerance } } as Preferences;
      const result = scoreSpace(rows, p, id, now);
      assert.ok(result.score !== null && result.score >= 0 && result.score <= 100 && result.score >= previous);
      assert.deepEqual(result, scoreSpace(rows, p, id, now));
      previous = result.score!;
    }
  }
});

test("evidence stays separate from fit and counts observation dates in venue zone", () => {
  const rows = reports().map((r, i) => ({ ...r, observedAt: i === 0 ? "2026-10-21T23:30:00Z" : "2026-10-22T00:30:00Z" }));
  const summary = evidenceSummary(rows, id, now, "America/New_York");
  assert.equal(summary.distinctObservationDates, 1);
  assert.equal(summary.approvedRecentCount, 3);
  assert.equal(summary.countsByDimension.noise, 3);
  assert.equal(evidenceSummary([], id, now, "America/New_York").label, "no_observations");
});

test("search is case-insensitive by all area/name terms, ranking stable and unknown facilities fail", () => {
  const a = space({ id: "a", name: "Alpha SAMPLE" }), b = space({ id: "b", name: "Bravo SAMPLE" });
  assert.deepEqual(discover([b, a], DEFAULT_PREFERENCES, "  SAMPLE bOSTON ", "name", now).map(r => r.space.id), ["a", "b"]);
  assert.equal(discover([a, b], DEFAULT_PREFERENCES, "missing", "name", now).length, 0);
  assert.equal(discover([a, b], { ...preferences, requiredFeatures: ["step_free_access"] }, "", "match", now).length, 0);
  const scored = space({ name: "Zebra SAMPLE", reports: reports() });
  assert.equal(discover([a, scored], preferences, "", "match", now)[0].space.id, id);
});

test("scoring never mutates observations or preferences", () => {
  const rows = reports(); const before = JSON.stringify({ rows, preferences });
  scoreSpace(rows, preferences, id, now);
  assert.equal(JSON.stringify({ rows, preferences }), before);
  assert.equal(DIMENSIONS.length, 4);
});
