import assert from "node:assert/strict";
import test from "node:test";
import { effectiveFacility, parseReportInput } from "../src/lib/validation.ts";

const now = new Date("2026-10-20T18:00:00Z");
const valid = () => ({
  spaceId: "10000000-0000-4000-8000-000000000001",
  observedAt: "2026-10-20T10:00:00-04:00",
  intensities: { noise: 2, crowds: null, brightness: 5, scent: null },
});

test("accepts structured observations and preserves unknown dimensions", () => {
  const parsed = parseReportInput(valid(), now);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.intensities.scent, null);
});

test("rejects client-selected approval and privileged metadata", () => {
  for (const field of ["status", "isFixture", "moderatedAt", "createdAt", "name", "diagnosis"]) {
    assert.equal(parseReportInput({ ...valid(), [field]: "approved" }, now).ok, false);
  }
});

test("rejects coerced, fractional, invalid and wholly missing intensities", () => {
  for (const rating of [0, 6, 1.5, "2", true, undefined, NaN, Infinity]) {
    const input = valid();
    assert.equal(parseReportInput({ ...input, intensities: { ...input.intensities, noise: rating } }, now).ok, false);
  }
  assert.equal(parseReportInput({ ...valid(), intensities: { noise: null, crowds: null, brightness: null, scent: null } }, now).ok, false);
  assert.equal(parseReportInput({ ...valid(), intensities: { noise: 1 } }, now).ok, false);
});

test("validates IDs, timezone, age, calendar and exact payload shape", () => {
  for (const date of ["yesterday", "2026-10-20T10:00:00", "2026-01-01T10:00:00Z", "2026-10-21T10:00:00Z", "2026-09-31T10:00:00Z", "2026-10-19T24:00:00Z"]) {
    assert.equal(parseReportInput({ ...valid(), observedAt: date }, now).ok, false);
  }
  assert.equal(parseReportInput({ ...valid(), spaceId: "bad" }, now).ok, false);
  for (const offset of ["+00:99", "+14:01", "-23:00"]) {
    assert.equal(parseReportInput({ ...valid(), observedAt: `2026-10-20T12:00:00${offset}` }, now).ok, false);
  }
  for (const input of [null, [], {}, "observation"]) assert.equal(parseReportInput(input, now).ok, false);
});

test("fresh verified false stays false; stale or future evidence becomes unknown", () => {
  const feature = { verification: "verified", value: false, sourceUrl: "https://www.bpl.org/", checkedAt: "2026-10-20T00:00:00Z", evidence: "SAMPLE negative evidence for unit testing only" } as const;
  assert.equal(effectiveFacility(feature, now).value, false);
  for (const checkedAt of ["2026-01-01T00:00:00Z", "2026-10-21T00:00:00Z", "invalid"]) {
    assert.equal(effectiveFacility({ ...feature, checkedAt }, now).value, null);
  }
});
