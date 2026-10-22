import type { Preferences, PublicSpace } from "./contracts.ts";
import { meetsRequiredFeatures } from "./preferences.ts";
import { scoreSpace } from "./sensory-score.ts";

export function discover(spaces: PublicSpace[], preferences: Preferences, query: string, sort: "name" | "match", now: Date) {
  const terms = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
  return spaces.filter(s => terms.every(t => `${s.name} ${s.address}`.toLocaleLowerCase("en-US").includes(t)) &&
      meetsRequiredFeatures(s.features, preferences.requiredFeatures, now))
    .map(space => ({ space, match: scoreSpace(space.reports, preferences, space.id, now) }))
    .sort((a, b) => (sort === "match" ? (b.match.score ?? -1) - (a.match.score ?? -1) : 0) ||
      a.space.name.localeCompare(b.space.name, "en-US") || a.space.id.localeCompare(b.space.id, "en-US"));
}
