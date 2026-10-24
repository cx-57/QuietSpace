import type { Preferences, PublicSpace } from "./contracts.ts";
import { hasVerifiedQuietStudySpace } from "./discovery.ts";
import { ATTRIBUTE_LABELS, visitorPreferenceFit } from "./visitor-ratings.ts";

/** Category suggestions are starting points, never measured sensory conditions. */
export function recommendation(space: PublicSpace, preferences: Preferences, now: Date): { priority: number; reason: string } {
  const visitorFit = visitorPreferenceFit(space, preferences);
  if (visitorFit.score !== null) {
    return { priority: visitorFit.score >= 70 ? 100 + visitorFit.score : -1,
      reason: `${visitorFit.score}% visitor-reported fit · ${visitorFit.dimensions.map(d => ATTRIBUTE_LABELS[d].toLowerCase()).join(", ")}${visitorFit.missing.length ? " · other selected attributes unrated" : ""}` };
  }
  const p = preferences.maximumIntensities;
  const indoor = space.category === "library" || space.category === "museum";
  let priority = 0;
  const reasons: string[] = [];
  if (p.noise !== null && p.noise <= 3) {
    if (hasVerifiedQuietStudySpace(space, now)) { priority += 5; reasons.push("Officially listed quiet/study area"); }
    else if (space.category === "library") { priority++; reasons.push("Library option for focus"); }
  }
  if (p.crowds !== null && p.crowds <= 3 && (space.category === "park" || space.category === "library")) { priority++; reasons.push(space.category === "park" ? "Outdoor space to explore at your own pace" : "Reading-space option"); }
  if (p.brightness !== null && p.brightness <= 3 && indoor) { priority++; reasons.push("Indoor option for your softer-light search"); }
  if (p.brightness !== null && p.brightness >= 4 && space.category === "park") { priority++; reasons.push("Outdoor daylight option"); }
  if (p.scent !== null && p.scent <= 3 && indoor) { priority++; reasons.push("Indoor starting point for your low-fragrance search"); }
  if (((p.noise !== null && p.noise >= 4) || (p.crowds !== null && p.crowds >= 4)) && ["park", "museum", "community_centre"].includes(space.category)) { priority += p.noise !== null && p.noise >= 4 && p.crowds !== null && p.crowds >= 4 ? 2 : 1; reasons.push("Option for a more active day"); }
  if (p.scent !== null && p.scent >= 4) { priority++; reasons.push("Explore with your more flexible fragrance preference"); }
  const selected = Object.values(p).filter(value => value !== null).length;
  return { priority: selected > 1 && priority < 2 ? 0 : priority, reason: reasons.slice(0, 2).join(" · ") };
}
