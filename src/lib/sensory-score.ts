import { DIMENSIONS } from "./contracts.ts";
import type { ApprovedReport, Dimension, MatchResult, Preferences, Reliability } from "./contracts.ts";

export const WEIGHTS = { noise: .4, crowds: .25, brightness: .2, scent: .15 };
export const WINDOW_DAYS = 60;
const DAY = 86_400_000;

/** Defense in depth: never trust moderation/fixture flags or coerce unknown ratings. */
export function eligibleReports(reports: ApprovedReport[], spaceId: string, now: Date): ApprovedReport[] {
  const seen = new Set<string>();
  return reports.filter(r => {
    const observed = Date.parse(r.observedAt);
    const created = Date.parse(r.createdAt);
    if (seen.has(r.id) || r.spaceId !== spaceId || r.status !== "approved" || r.isFixture !== false ||
        !Number.isFinite(now.getTime()) || !Number.isFinite(observed) || !Number.isFinite(created) ||
        observed < now.getTime() - WINDOW_DAYS * DAY || observed > now.getTime() || created > now.getTime() ||
        observed > created + 300_000 || DIMENSIONS.every(d => r.intensities[d] === null) || !DIMENSIONS.every(d => r.intensities[d] === null ||
          (Number.isInteger(r.intensities[d]) && Number(r.intensities[d]) >= 1 && Number(r.intensities[d]) <= 5))) return false;
    seen.add(r.id);
    return true;
  });
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function scoreSpace(reports: ApprovedReport[], preferences: Preferences, spaceId: string, now: Date): MatchResult {
  if (DIMENSIONS.every(d => preferences.maximumIntensities[d] === null)) return { score: null, reason: "no_preferences" };
  const eligible = eligibleReports(reports, spaceId, now);
  const dimensions: Array<{ dimension: Dimension; median: number; count: number; effectiveWeight: number }> = [];
  for (const dimension of DIMENSIONS) {
    const preference = preferences.maximumIntensities[dimension];
    const values = eligible.map(r => r.intensities[dimension]).filter(v => v !== null);
    if (preference !== null && Number.isInteger(preference) && preference >= 1 && preference <= 5 && values.length >= 3) {
      dimensions.push({ dimension, median: median(values), count: values.length, effectiveWeight: WEIGHTS[dimension] });
    }
  }
  if (dimensions.length < 2 || !dimensions.some(d => d.dimension === "noise")) return { score: null, reason: "insufficient_evidence" };
  const totalWeight = dimensions.reduce((sum, d) => sum + d.effectiveWeight, 0);
  let score = 0;
  for (const d of dimensions) {
    d.effectiveWeight /= totalWeight;
    const preferred = preferences.maximumIntensities[d.dimension]!;
    const distance = d.dimension === "brightness" ? Math.abs(d.median - preferred) : Math.max(0, d.median - preferred);
    score += Math.max(0, 1 - distance / 4) * d.effectiveWeight * 100;
  }
  return {
    score: Math.round(score), reason: "eligible", dimensions,
    excludedDimensions: DIMENSIONS.filter(d => !dimensions.some(item => item.dimension === d)),
    explanation: "Preference fit uses median intensities from approved observations in the last 60 days. Noise, crowds and scent use your maximum; brightness uses closeness to your selected level. Available weights are renormalized. This is a heuristic, not a guarantee of current conditions.",
  };
}

export function evidenceSummary(reports: ApprovedReport[], spaceId: string, now: Date, timeZone: string): Reliability {
  const eligible = eligibleReports(reports, spaceId, now);
  const countsByDimension = Object.fromEntries(DIMENSIONS.map(d => [d, eligible.filter(r => r.intensities[d] !== null).length])) as Record<Dimension, number>;
  const latest = eligible.map(r => r.observedAt).sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const dates = new Set(eligible.map(r => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(r.observedAt))));
  return {
    label: eligible.length === 0 ? "no_observations" : countsByDimension.noise >= 3 && DIMENSIONS.filter(d => countsByDimension[d] >= 3).length >= 2 ? "recent_observations" : "limited_observations",
    approvedRecentCount: eligible.length, countsByDimension, distinctObservationDates: dates.size, latestObservedAt: latest,
  };
}
