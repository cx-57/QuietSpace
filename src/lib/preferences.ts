import { DIMENSIONS, FEATURE_KEYS } from "./contracts.ts";
import type { Preferences, FacilityEvidence, FeatureKey } from "./contracts.ts";
import { effectiveFacility } from "./validation.ts";

export const PREFERENCE_FEATURE_KEYS: readonly FeatureKey[] = ["accessible_entrance", "seating", "quiet_room"];

export const STORAGE_KEY = "quietspace.preferences.v1";
export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  maximumIntensities: { noise: null, crowds: null, brightness: null, scent: null },
  requiredFeatures: [],
};
export const DIMENSION_LABELS = { noise: "Noise", crowds: "Crowds", brightness: "Brightness", scent: "Scent" };
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  accessible_entrance: "Accessible entrance", step_free_access: "Step-free access",
  accessible_toilet: "Accessible toilet", seating: "Seating", quiet_room: "Quiet/study space",
};

export function parsePreferences(value: unknown): Preferences | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (Object.keys(p).length !== 3 || p.version !== 1 || !p.maximumIntensities ||
      typeof p.maximumIntensities !== "object" || Array.isArray(p.maximumIntensities) ||
      !Array.isArray(p.requiredFeatures)) return null;
  const intensities = p.maximumIntensities as Record<string, unknown>;
  if (Object.keys(intensities).length !== 4 || !DIMENSIONS.every(d => Object.hasOwn(intensities, d) &&
      (intensities[d] === null || (Number.isInteger(intensities[d]) && Number(intensities[d]) >= 1 && Number(intensities[d]) <= 5)))) return null;
  if (!p.requiredFeatures.every(f => FEATURE_KEYS.includes(f)) || new Set(p.requiredFeatures).size !== p.requiredFeatures.length) return null;
  return { version: 1, maximumIntensities: { ...intensities } as Preferences["maximumIntensities"], requiredFeatures: p.requiredFeatures.filter(f => PREFERENCE_FEATURE_KEYS.includes(f)) };
}

export function decodePreferences(raw: string | null): Preferences | null {
  if (raw === null) return DEFAULT_PREFERENCES;
  try { return parsePreferences(JSON.parse(raw)); } catch { return null; }
}

export function meetsRequiredFeatures(features: Record<FeatureKey, FacilityEvidence>, required: FeatureKey[], now: Date): boolean {
  return required.every(key => {
    const value = effectiveFacility(features[key], now);
    return value.verification === "verified" && value.value === true;
  });
}
