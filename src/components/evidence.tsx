import { DIMENSIONS } from "../lib/contracts";
import type { MatchResult, PublicSpace, Reliability } from "../lib/contracts";
import { DIMENSION_LABELS } from "../lib/preferences";
import { eligibleReports, median } from "../lib/sensory-score";

export function ConfidenceLabel({ evidence }: { evidence: Reliability }) {
  const label = evidence.label === "supported_observations" ? "More supported evidence" : evidence.label === "limited_observations" ? "Limited evidence" : "Early observations";
  return <div className="evidence-label"><span className="status-dot" aria-hidden="true" />
    {evidence.approvedRecentCount === 0 ? <span>No recent community observations</span> : <span><strong>{label}</strong><span className="evidence-count">{evidence.approvedRecentCount} approved observation{evidence.approvedRecentCount === 1 ? "" : "s"} in the last 60 days</span></span>}
  </div>;
}
export function MatchExplanation({ match, expanded = false }: { match: MatchResult; expanded?: boolean }) {
  if (match.score === null) return <div className="match"><strong>{match.reason === "no_preferences" ? "Explore at your own pace" : "Not enough evidence for a match"}</strong>
    <p className="small muted">{match.reason === "no_preferences" ? "Set sensory preferences to compare fit when enough observations are available." : "A match needs 3 recent approved observations per dimension, with noise and at least one other dimension."}</p></div>;
  return <div className="match"><strong className="match-number">{match.score}/100 <span>preference fit</span></strong>
    <p className="small muted">Historical observations · Conditions may change</p>
    {expanded && <><p>{match.explanation}</p><ul>{match.dimensions.map(d => <li key={d.dimension}>{DIMENSION_LABELS[d.dimension]}: median {d.median}/5, {d.count} observations, {Math.round(d.effectiveWeight * 100)}% of available weight.</li>)}</ul>
      <p>Excluded: {match.excludedDimensions.map(d => DIMENSION_LABELS[d]).join(", ") || "none"}. Missing preferences or fewer than 3 observations exclude a dimension.</p></>}
  </div>;
}
export function SensorySnapshot({ space, now }: { space: PublicSpace; now: Date }) {
  const reports = eligibleReports(space.reports, space.id, now);
  return <dl className="snapshot">{DIMENSIONS.map(d => {
    const values = reports.map(r => r.intensities[d]).filter(v => v !== null);
    return <div key={d}><dt>{DIMENSION_LABELS[d]}</dt><dd>{values.length >= 3 ? `${median(values)}/5 median` : "Not enough data"}</dd><dd className="small muted">{values.length} recent observation{values.length === 1 ? "" : "s"}</dd></div>;
  })}</dl>;
}
export function SourceDate({ value }: { value: string }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(new Date(value))}</time>;
}
