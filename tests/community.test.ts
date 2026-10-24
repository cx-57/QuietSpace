import assert from "node:assert/strict";
import test from "node:test";
import type { ApprovedReport, Directory, PublicSpace } from "../src/lib/contracts.ts";
import { UNKNOWN_FACILITY } from "../src/lib/public-data.ts";
import { communityReviews, communityStats } from "../src/lib/community.ts";

const now = new Date("2026-10-23T22:00:00Z");
const base: PublicSpace = {
  id: "10000000-0000-4000-8000-000000000001", slug: "sample-space", name: "SAMPLE Branch",
  address: "SAMPLE Street, Boston, MA", category: "library", latitude: null, longitude: null, timeZone: "America/New_York",
  source: { sourceUrl: "https://example.org", checkedAt: now.toISOString(), provenanceStatus: "verified", evidence: "SAMPLE" },
  features: { accessible_entrance: UNKNOWN_FACILITY, step_free_access: UNKNOWN_FACILITY,
    accessible_toilet: UNKNOWN_FACILITY, seating: UNKNOWN_FACILITY, quiet_room: UNKNOWN_FACILITY },
  reports: [],
};
const observation: ApprovedReport = {
  id: "20000000-0000-4000-8000-000000000001", spaceId: base.id, status: "approved", isFixture: false,
  createdAt: "2026-10-22T20:00:00Z", observedAt: "2026-10-21T12:00:00Z",
  intensities: { noise: 2, crowds: null, brightness: 3, scent: null },
};
test("community cards require approved recent real reports and round dates to months", () => {
  const valid = { ...base, reports: [observation] };
  assert.deepEqual(communityReviews(valid, now), [{
    id: observation.id, month: "October 2026", intensities: { noise: 2, crowds: null, brightness: 3, scent: null },
  }]);
  const blocked = [
    { ...observation, id: "20000000-0000-4000-8000-000000000002", status: "pending" },
    { ...observation, id: "20000000-0000-4000-8000-000000000003", isFixture: true },
    { ...observation, id: "20000000-0000-4000-8000-000000000004", observedAt: "2026-01-01T12:00:00Z" },
    { ...observation, id: "20000000-0000-4000-8000-000000000005", spaceId: "different" },
  ] as unknown as ApprovedReport[];
  assert.deepEqual(communityReviews({ ...base, reports: blocked }, now), []);
  assert.equal(communityReviews(valid, now, 0).length, 0);
});

test("community counts are based on actual approved distinct observations; unknown stays zero", () => {
  const other = { ...base, id: "other", slug: "sample-other", name: "Alpha SAMPLE Branch", reports: [] };
  const directory: Directory = { mode: "postgres", spaces: [{ ...base, reports: [observation] }, other], asOf: now.toISOString() };
  const stats = communityStats(directory, now);
  assert.equal(stats.venueCount, 2);
  assert.equal(stats.approvedCount, 1);
  assert.equal(stats.reviewedVenueCount, 1);
  assert.equal(stats.needsObservations[0].space.id, "other");
  const zero = communityStats({ ...directory, spaces: [other] }, now);
  assert.equal(zero.approvedCount, 0);
  assert.equal(zero.reviewedVenueCount, 0);
});
