import type { Preferences, PublicSpace } from "./contracts.ts";
import { meetsRequiredFeatures } from "./preferences.ts";
import { scoreSpace } from "./sensory-score.ts";

/** Fresh, source-listed quiet/study space, never a measured noise level. */
export function hasVerifiedQuietStudySpace(space: PublicSpace, now: Date): boolean {
  return meetsRequiredFeatures(space.features, ["quiet_room"], now);
}

export function discover(spaces: PublicSpace[], preferences: Preferences, query: string, sort: "name" | "match", now: Date, category: "all" | PublicSpace["category"] = "all") {
  const seekingQuiet = preferences.maximumIntensities.noise !== null && preferences.maximumIntensities.noise <= 2;
  const terms = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  return spaces.filter(s => (category === "all" || s.category === category) && terms.every(t => `${s.name} ${s.address}`.toLocaleLowerCase("en-US").includes(t)) &&
      meetsRequiredFeatures(s.features, preferences.requiredFeatures, now))
    .map(space => ({ space, match: scoreSpace(space.reports, preferences, space.id, now) }))
    .sort((a, b) => (sort === "match"
      ? (b.match.score ?? -1) - (a.match.score ?? -1) ||
        // Source-listed spaces rank ahead of other unscored venues for low-noise preferences;
        // they never gain a synthetic sensory score.
        (seekingQuiet ? Number(hasVerifiedQuietStudySpace(b.space, now)) - Number(hasVerifiedQuietStudySpace(a.space, now)) : 0)
      : 0) || a.space.name.localeCompare(b.space.name, "en-US") || a.space.id.localeCompare(b.space.id, "en-US"));
}
