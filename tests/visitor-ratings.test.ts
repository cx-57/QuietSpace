import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommunityStore } from "../src/lib/server/community-store.ts";
import { parseAttributeRatings, visitorPreferenceFit } from "../src/lib/visitor-ratings.ts";
import { DEFAULT_PREFERENCES } from "../src/lib/preferences.ts";
import { recommendation } from "../src/lib/recommendations.ts";
import { UNKNOWN_FACILITY } from "../src/lib/public-data.ts";
import type { PublicSpace } from "../src/lib/contracts.ts";

test("attribute stars are optional but never coerce invalid or unknown values", () => {
  assert.deepEqual(parseAttributeRatings(undefined), { noise: null, crowds: null, brightness: null, scent: null });
  assert.deepEqual(parseAttributeRatings({ scent: 5 }), { noise: null, crowds: null, brightness: null, scent: 5 });
  for (const input of [null, [], { noise: "5" }, { scent: 0 }, { crowds: 6 }, { brightness: 2.5 }, { approved: true }]) assert.throws(() => parseAttributeRatings(input));
});

test("review attributes persist, aggregate independently and recalculate after deletion", async () => {
  const folder = mkdtempSync(join(tmpdir(), "quietspace-ratings-"));
  let store = new CommunityStore(join(folder, "test.sqlite"));
  try {
    const a = await store.register("first_reader", "First", "A strong test password 42!");
    const b = await store.register("next_reader", "Next", "A strong test password 43!");
    const first = store.addReview(a.id, "bpl-central", 4, "A real-style review for an isolated database test.", { noise: 5, scent: 5 });
    store.addReview(b.id, "bpl-central", 2, "Another real-style review for an isolated database test.", { noise: 3, crowds: 4 });
    const summary = store.ratingSummaries()["bpl-central"];
    assert.deepEqual(summary.overall, { average: 3, count: 2 });
    assert.deepEqual(summary.attributes.noise, { average: 4, count: 2 });
    assert.deepEqual(summary.attributes.scent, { average: 5, count: 1 });
    assert.deepEqual(summary.attributes.brightness, { average: null, count: 0 });
    store.close(); store = new CommunityStore(join(folder, "test.sqlite"));
    assert.equal(store.reviews("bpl-central").find(r => r.id === first.id)?.attributes.noise, 5);
    assert.equal(store.deleteReview(a.id, first.id), true);
    assert.deepEqual(store.ratingSummaries()["bpl-central"].attributes.noise, { average: 3, count: 1 });
    assert.deepEqual(store.ratingSummaries()["bpl-central"].attributes.scent, { average: null, count: 0 });
    assert.equal(store.ratingSummaries(new Date("2030-01-01"))["bpl-central"], undefined);
  } finally { store.close(); rmSync(folder, { recursive: true, force: true }); }
});

test("existing review databases migrate without inventing attribute ratings", () => {
  const folder = mkdtempSync(join(tmpdir(), "quietspace-migration-")), path = join(folder, "test.sqlite");
  const old = new DatabaseSync(path);
  old.exec("CREATE TABLE reviews(id TEXT PRIMARY KEY,userId TEXT,spaceSlug TEXT,rating INTEGER,body TEXT,createdAt TEXT,UNIQUE(userId,spaceSlug)); INSERT INTO reviews VALUES('old','reader','bpl-central',4,'Existing review text','2026-10-24T00:00:00Z')");
  old.close();
  const store = new CommunityStore(path);
  try {
    const summary = store.ratingSummaries(new Date("2026-10-24T01:00:00Z"))["bpl-central"];
    assert.equal(summary.overall.average, 4);
    assert.deepEqual(summary.attributes.scent, { average: null, count: 0 });
  } finally { store.close(); rmSync(folder, { recursive: true, force: true }); }
});

test("visitor attributes drive actual preference fit and override category guesses", () => {
  const blank = { average: null, count: 0 };
  const place: PublicSpace = { id: "park", slug: "park", name: "Park", address: "Boston", category: "park", latitude: null, longitude: null, timeZone: "America/New_York", source: { sourceUrl: "https://www.boston.gov", checkedAt: "2026-10-24T00:00:00Z", provenanceStatus: "verified", evidence: "Test" }, features: { accessible_entrance: UNKNOWN_FACILITY, step_free_access: UNKNOWN_FACILITY, accessible_toilet: UNKNOWN_FACILITY, seating: UNKNOWN_FACILITY, quiet_room: UNKNOWN_FACILITY }, reports: [], visitorRatings: { overall: { average: 4, count: 1 }, attributes: { noise: blank, crowds: blank, brightness: blank, scent: { average: 5, count: 1 } } } };
  const preferences = { ...DEFAULT_PREFERENCES, maximumIntensities: { ...DEFAULT_PREFERENCES.maximumIntensities, scent: 1 as const } };
  assert.equal(visitorPreferenceFit(place, preferences).score, 100);
  assert.ok(recommendation(place, preferences, new Date("2026-10-24T01:00:00Z")).priority > 0);
  place.category = "library";
  place.visitorRatings!.attributes.scent.average = 1;
  assert.equal(visitorPreferenceFit(place, preferences).score, 0);
  assert.ok(recommendation(place, preferences, new Date("2026-10-24T01:00:00Z")).priority < 0);
  place.visitorRatings!.attributes.scent = blank;
  assert.equal(visitorPreferenceFit(place, preferences).score, null);
});
