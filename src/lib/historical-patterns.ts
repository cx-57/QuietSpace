import type { ApprovedReport } from "./contracts.ts";
import { eligibleReports, median } from "./sensory-score.ts";
export const PERIODS = ["morning", "afternoon", "evening"] as const;
export type Period = typeof PERIODS[number];
export interface HistoricalBin { dayType: "weekday" | "weekend"; period: Period; count: number; medianNoise: number | null }

/** Historical venue-local bins, never a live reading or forecast. Overnight visits omitted. */
export function historicalPatterns(reports: ApprovedReport[], spaceId: string, timeZone: string, now: Date): HistoricalBin[] {
  const bins = (["weekday", "weekend"] as const).flatMap(dayType => PERIODS.map(period => ({ dayType, period, values: [] as number[] })));
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" });
  for (const report of eligibleReports(reports, spaceId, now)) {
    if (report.intensities.noise === null) continue;
    const parts = formatter.formatToParts(new Date(report.observedAt));
    const weekday = parts.find(p => p.type === "weekday")!.value;
    const hour = Number(parts.find(p => p.type === "hour")!.value);
    if (hour < 6) continue;
    const dayType = ["Sat", "Sun"].includes(weekday) ? "weekend" : "weekday";
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    bins.find(b => b.dayType === dayType && b.period === period)!.values.push(report.intensities.noise);
  }
  return bins.map(({ values, ...bin }) => ({ ...bin, count: values.length, medianNoise: values.length >= 3 ? median(values) : null }));
}
