import assert from "node:assert/strict";
import test from "node:test";
import { activePresetId, DISCOVERY_PRESETS, selectPreset } from "../src/lib/discovery-presets.ts";
import { DEFAULT_PREFERENCES } from "../src/lib/preferences.ts";
import { discover } from "../src/lib/discovery.ts";
import { recommendation } from "../src/lib/recommendations.ts";
import { UNKNOWN_FACILITY } from "../src/lib/public-data.ts";
import type { Preferences, PublicSpace } from "../src/lib/contracts.ts";

const now = new Date("2026-10-23T22:00:00Z");
test("every preference profile offers explained starting points without invented sensory scores", () => {
  const spaces = [sample("library", "library"), sample("park", "park"), sample("museum", "museum"), sample("community", "community_centre")];
  for (const preset of DISCOVERY_PRESETS) {
    const preferences = selectPreset(DEFAULT_PREFERENCES, preset.id);
    const suggestions = spaces.filter(s => recommendation(s, preferences, now).priority > 0);
    assert.ok(suggestions.length > 0, preset.id);
    assert.ok(suggestions.length < spaces.length, preset.id);
    for (const space of suggestions) {
      assert.ok(recommendation(space, preferences, now).reason.length > 0);
      assert.equal(discover([space], preferences, "", "match", now)[0].match.score, null);
    }
  }
});
function sample(id: string, category: PublicSpace["category"]): PublicSpace {
  return {
    id, slug: id, name: `SAMPLE ${id}`, address: "SAMPLE, Boston, MA",
    category, latitude: null, longitude: null, timeZone: "America/New_York",
    source: { sourceUrl: "https://example.org", checkedAt: now.toISOString(), provenanceStatus: "verified", evidence: "SAMPLE fixture" },
    features: { accessible_entrance: UNKNOWN_FACILITY, step_free_access: UNKNOWN_FACILITY,
      accessible_toilet: UNKNOWN_FACILITY, seating: UNKNOWN_FACILITY, quiet_room: UNKNOWN_FACILITY },
    reports: [],
  };
}
test("six discovery profiles represent distinct sets of sensory preferences", () => {
  assert.equal(DISCOVERY_PRESETS.length, 6);
  const ids = DISCOVERY_PRESETS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const patterns = DISCOVERY_PRESETS.map(p => JSON.stringify(p.levels));
  assert.equal(new Set(patterns).size, patterns.length);
  for (const preset of DISCOVERY_PRESETS) {
    const chosen = selectPreset(DEFAULT_PREFERENCES, preset.id);
    assert.equal(activePresetId(chosen), preset.id);
    assert.deepEqual(chosen.maximumIntensities, preset.levels);
  }
});

test("preset selection is reversible and preserves all verified facility requirements", () => {
  const original: Preferences = { ...DEFAULT_PREFERENCES, requiredFeatures: ["accessible_entrance", "seating"] };
  const focused = selectPreset(original, "focus");
  assert.deepEqual(focused.requiredFeatures, original.requiredFeatures);
  assert.deepEqual(original.maximumIntensities, DEFAULT_PREFERENCES.maximumIntensities);
  const calmer = selectPreset(focused, "low-stimulation");
  assert.deepEqual(calmer.requiredFeatures, original.requiredFeatures);
  const cleared = selectPreset(calmer, "low-stimulation");
  assert.deepEqual(cleared.maximumIntensities, DEFAULT_PREFERENCES.maximumIntensities);
  assert.deepEqual(cleared.requiredFeatures, original.requiredFeatures);
  assert.equal(activePresetId(cleared), null);
});

test("category choices filter real types without inventing sensory evidence", () => {
  const rows = [sample("library", "library"), sample("park", "park"), sample("museum", "museum")];
  assert.equal(discover(rows, DEFAULT_PREFERENCES, "", "match", now, "all").length, 3);
  const park = discover(rows, selectPreset(DEFAULT_PREFERENCES, "uncrowded"), "", "match", now, "park");
  assert.deepEqual(park.map(x => x.space.category), ["park"]);
  assert.equal(park[0].match.score, null);
  const museum = discover(rows, selectPreset(DEFAULT_PREFERENCES, "social"), "", "match", now, "museum");
  assert.equal(museum.length, 1);
  assert.equal(museum[0].match.score, null);
  assert.equal(discover(rows, DEFAULT_PREFERENCES, "", "match", now, "community_centre").length, 0);
});
