import type { ApprovedReport, Directory, Intensities, PublicSpace } from "./contracts.ts";
import { eligibleReports } from "./sensory-score.ts";

/** Approved observations only; the UI displays a month, but public report API data retains exact timestamps. */
export function communityReviews(space: PublicSpace, now: Date, limit = 6): Array<{ id: string; month: string; intensities: Intensities }> {
  return eligibleReports(space.reports, space.id, now)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, Math.min(limit, 20)))
    .map((report: ApprovedReport) => ({
      id: report.id,
      month: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: space.timeZone }).format(new Date(report.observedAt)),
      intensities: { ...report.intensities },
    }));
}

export function communityStats(directory: Directory, now: Date) {
  const bySpace = directory.spaces.map(space => ({
    space,
    approved: eligibleReports(space.reports, space.id, now).length,
  }));
  return {
    venueCount: bySpace.length,
    approvedCount: bySpace.reduce((total, item) => total + item.approved, 0),
    reviewedVenueCount: bySpace.filter(item => item.approved > 0).length,
    needsObservations: bySpace.sort((a, b) => a.approved - b.approved || a.space.name.localeCompare(b.space.name)),
  };
}
