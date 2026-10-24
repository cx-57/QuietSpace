import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { adaptFacility, adaptReport, adaptSpace, safeSource } from "../src/lib/public-data.ts";
const now = new Date("2026-10-23T23:59:00Z");
const venues = JSON.parse(readFileSync(new URL("../data/venues/boston-libraries.json", import.meta.url), "utf8")).venues;
test("curated directory has 11 sourced places with unknown sensory evidence", () => {
  assert.equal(venues.length, 11);
  for (const row of venues) {
    const space = adaptSpace(row, now, true)!;
    assert.equal(space.id, row.slug);
    assert.equal(space.reports.length, 0);
    assert.equal(space.features.step_free_access.value, null);
    assert.equal(adaptFacility(row.features.accessible_entrance ?? {
      verification: "unknown", value: null, source_url: null, checked_at: null, evidence: null
    }, now).value,
      row.features.accessible_entrance?.verification === "verified" ? true : null);
  }
});
test("private, unpublished, stale, future, unverified and fixture parents fail closed", () => {
  for (const overrides of [{ published: false }, { public_access: "restricted" }, { is_fixture: true }, { provenance_status: "unverified" }, { checked_at: "2026-01-01T00:00:00Z" }, { checked_at: "2026-10-24T00:00:00Z" }]) assert.equal(adaptSpace({ ...venues[0], ...overrides }, now, true), null);
});
test("invalid source protocols, credentials, coordinates, IDs and zones are rejected", () => {
  for (const url of ["javascript:alert(1)", "http://example.org", "https://name:pass@example.org/"]) assert.throws(() => safeSource(url));
  for (const overrides of [{ id: "invalid" }, { id: "10000000-0000-4000-8000-000000000001", latitude: 91, longitude: 0 }, { time_zone: "Mars/Olympus" }]) assert.throws(() => adaptSpace({ ...venues[0], ...overrides }, now));
});
test("public report adapter drops pending, fixture and wrong-parent rows and rejects malformed ratings", () => {
  const spaceId = "10000000-0000-4000-8000-000000000001";
  const row = { id: spaceId, space_id: spaceId, noise: 2, crowds: null, brightness: 3, scent: null, status: "approved", is_fixture: false, observed_at: "2026-10-21T12:00:00Z", created_at: "2026-10-21T12:00:00Z" };
  const ids = new Set([spaceId]);
  assert.equal(adaptReport(row, ids, now)?.intensities.crowds, null);
  for (const overrides of [{ status: "pending" }, { status: "rejected" }, { is_fixture: true }, { space_id: "bad" }, { observed_at: "2026-01-01T00:00:00Z" }]) assert.equal(adaptReport({ ...row, ...overrides }, ids, now), null);
  for (const value of ["2", 0, 6, true, undefined]) assert.throws(() => adaptReport({ ...row, noise: value }, ids, now));
});
