import Link from "next/link";
import type { MatchResult, PublicSpace } from "../lib/contracts";
import { FEATURE_LABELS } from "../lib/preferences";
import { effectiveFacility } from "../lib/validation";
import { evidenceSummary } from "../lib/sensory-score";
import { ConfidenceLabel, MatchExplanation, SourceDate } from "./evidence";

export function SpaceCard({ space, match, now }: { space: PublicSpace; match: MatchResult; now: Date }) {
  const facilities = Object.entries(space.features).filter(([, evidence]) => effectiveFacility(evidence, now).value === true);
  return <article className="space-card">
    <div className="card-top"><span className="tag">Public {space.category.replaceAll("_", " ")}</span><span className="small muted">Boston area</span></div>
    <h3><Link href={`/spaces/${space.slug}`}>{space.name.replace("Boston Public Library — ", "")}</Link></h3>
    <p className="address">{space.address}</p>
    <MatchExplanation match={match} />
    <ConfidenceLabel evidence={evidenceSummary(space.reports, space.id, now, space.timeZone)} />
    <ul className="facility-tags">{facilities.map(([key]) => <li key={key}>{FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]} · source verified</li>)}</ul>
    <p className="small muted">Other facilities may be unknown. Source reviewed <SourceDate value={space.source.checkedAt} />.</p>
    <div className="card-footer"><a href={space.source.sourceUrl}>Official venue source</a><Link href={`/spaces/${space.slug}`}>View details <span aria-hidden="true">↗</span></Link></div>
  </article>;
}
