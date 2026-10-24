import type { Intensities, Preferences } from "./contracts.ts";

export type DiscoveryPresetId = "focus" | "low-stimulation" | "uncrowded" | "soft-light" | "low-scent" | "social";

type DiscoveryPreset = {
  id: DiscoveryPresetId;
  title: string;
  detail: string;
  levels: Intensities;
};

export const DISCOVERY_PRESETS: readonly DiscoveryPreset[] = [
  { id: "focus", title: "Focus & study", detail: "Less noise and fewer people", levels: { noise: 2, crowds: 2, brightness: null, scent: null } },
  { id: "low-stimulation", title: "Low stimulation", detail: "Gentle across all four senses", levels: { noise: 1, crowds: 2, brightness: 2, scent: 1 } },
  { id: "uncrowded", title: "Space to yourself", detail: "Fewer crowds preferred", levels: { noise: null, crowds: 2, brightness: null, scent: null } },
  { id: "soft-light", title: "Softer lighting", detail: "Prefer dimmer surroundings", levels: { noise: null, crowds: null, brightness: 2, scent: null } },
  { id: "low-scent", title: "Low fragrance", detail: "Avoid strong scents", levels: { noise: null, crowds: null, brightness: null, scent: 1 } },
  { id: "social", title: "Comfortable with activity", detail: "Higher noise and crowds are okay", levels: { noise: 5, crowds: 5, brightness: 4, scent: null } },
];

export function activePresetId(preferences: Preferences): DiscoveryPresetId | null {
  return DISCOVERY_PRESETS.find(p => (Object.keys(p.levels) as Array<keyof Intensities>).every(d =>
    preferences.maximumIntensities[d] === p.levels[d]))?.id ?? null;
}

/** Presets modify sensory choices only. Never silently remove a user's access requirements. */
export function selectPreset(preferences: Preferences, id: DiscoveryPresetId): Preferences {
  const preset = DISCOVERY_PRESETS.find(p => p.id === id);
  if (!preset) return preferences;
  const currentlySelected = activePresetId(preferences) === id;
  return { ...preferences, maximumIntensities: currentlySelected
    ? { noise: null, crowds: null, brightness: null, scent: null }
    : { ...preset.levels }, requiredFeatures: [...preferences.requiredFeatures] };
}
