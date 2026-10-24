import { DIMENSIONS } from "./contracts.ts";
import type { Dimension, Intensities, Preferences, PublicSpace } from "./contracts.ts";
import { WEIGHTS } from "./sensory-score.ts";

export type AttributeRatings = Intensities;
export type RatingAverage = { average: number | null; count: number };
export type PlaceVisitorRatings = { overall: RatingAverage; attributes: Record<Dimension, RatingAverage> };
export const ATTRIBUTE_LABELS: Record<Dimension, string> = { noise: "Quietness", crowds: "Room to yourself", brightness: "Softer lighting", scent: "Low fragrance" };
export const ATTRIBUTE_HINTS: Record<Dimension, string> = {
  noise: "1 = very noisy · 5 = very quiet",
  crowds: "1 = very crowded · 5 = plenty of personal space",
  brightness: "1 = very bright · 5 = very soft or dim light",
  scent: "1 = strong smells · 5 = no noticeable fragrance",
};

export function parseAttributeRatings(input: unknown): AttributeRatings {
  const empty: AttributeRatings = { noise: null, crowds: null, brightness: null, scent: null };
  if (input === undefined) return empty;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Choose whole-number attribute stars from 1 to 5, or leave them unrated.");
  const row = input as Record<string, unknown>;
  if (Object.keys(row).some(key => !DIMENSIONS.includes(key as Dimension))) throw new Error("Unknown review attribute.");
  for (const dimension of DIMENSIONS) {
    const value = row[dimension];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) throw new Error("Choose whole-number attribute stars from 1 to 5, or leave them unrated.");
    empty[dimension] = value as AttributeRatings[typeof dimension];
  }
  return empty;
}

/** Visitor stars run in the opposite direction from sensory intensity. */
export function visitorPreferenceFit(space: PublicSpace, preferences: Preferences) {
  const selected = DIMENSIONS.filter(d => preferences.maximumIntensities[d] !== null);
  const included = selected.filter(d => (space.visitorRatings?.attributes[d].count ?? 0) > 0 && space.visitorRatings?.attributes[d].average !== null);
  if (!included.length) return { score: null, dimensions: [] as Dimension[], missing: selected };
  let weighted = 0, weight = 0;
  for (const dimension of included) {
    const intensity = 6 - space.visitorRatings!.attributes[dimension].average!;
    const preferred = preferences.maximumIntensities[dimension]!;
    const distance = dimension === "brightness" ? Math.abs(intensity - preferred) : Math.max(0, intensity - preferred);
    weighted += Math.max(0, 1 - distance / 4) * WEIGHTS[dimension];
    weight += WEIGHTS[dimension];
  }
  return { score: Math.round(weighted / weight * 100), dimensions: included, missing: selected.filter(d => !included.includes(d)) };
}
