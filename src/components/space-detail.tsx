"use client";
import Link from "next/link";
import { FEATURE_KEYS } from "../lib/contracts";
import type { PublicSpace } from "../lib/contracts";
import { FEATURE_LABELS } from "../lib/preferences";
import { scoreSpace, evidenceSummary } from "../lib/sensory-score";
import { effectiveFacility } from "../lib/validation";
import { ConfidenceLabel, MatchExplanation, SensorySnapshot, SourceDate } from "./evidence";
import { StorageNotice, usePreferences } from "./preferences-provider";
import { HistoricalPeriods } from "./historical-periods";
import { CommunityReviews } from "./community-reviews";

export function SpaceDetail({ space, asOf }: { space: PublicSpace; asOf: string }) {
  const { preferences } = usePreferences();
  const now = new Date(asOf);
  const evidence = evidenceSummary(space.reports, space.id, now, space.timeZone);
  const quietStudy = effectiveFacility(space.features.quiet_room, now);
  const seekingQuiet = preferences.maximumIntensities.noise !== null && preferences.maximumIntensities.noise <= 2;
  return <>
    <StorageNotice />
    <div className="detail-grid"><section className="panel" aria-labelledby="fit-heading"><p className="eyebrow">PERSONAL, NOT PRESCRIPTIVE</p><h2 id="fit-heading">A fit for your day?</h2>
      <MatchExplanation match={scoreSpace(space.reports, preferences, space.id, now)} expanded />
      {seekingQuiet && quietStudy.verification === "verified" && quietStudy.value === true && <p className="small muted">BPL lists a quiet/study space here. This helps you explore options, but does not establish the current noise level or generate a numeric match. <a href={quietStudy.sourceUrl}>Read the official source</a>.</p>}
      <Link href="/preferences">Adjust your preferences</Link>
    </section><section className="panel" aria-labelledby="evidence-heading"><p className="eyebrow">Evidence, separately</p><h2 id="evidence-heading">What we know so far</h2>
      <ConfidenceLabel evidence={evidence} />
      <p>{evidence.approvedRecentCount ? `${evidence.distinctObservationDates} distinct observation dates in the venue’s time zone.` : "No recent approved observations are available. A library listing does not establish quietness."}</p>
      {evidence.latestObservedAt && <p>Latest eligible visit: <SourceDate value={evidence.latestObservedAt} />.</p>}
      <p className="small muted">Only approved, non-sample visits from the last 60 days count. Fit and evidence volume are separate; neither guarantees your experience.</p>
    </section></div>
    <section className="panel" aria-labelledby="snapshot-heading"><p className="eyebrow">A SNAPSHOT OF PAST VISITS</p><h2 id="snapshot-heading">Sensory observations</h2><p>Intensity: 1 low, 5 high. Each median needs at least 3 recent observations.</p><SensorySnapshot space={space} now={now} /></section>
    <section className="panel" aria-labelledby="facilities-heading"><h2 id="facilities-heading">Facilities & access</h2><p>Source verification describes the specific facility. Unknown means we cannot confirm it; contact the venue before traveling.</p>
      <dl className="facilities">{FEATURE_KEYS.map(key => {
        const item = effectiveFacility(space.features[key], now);
        return <div key={key}><dt>{FEATURE_LABELS[key]}</dt><dd><strong>{item.verification === "unknown" ? "Unknown" : item.value ? "Yes — source verified" : "No — source verified"}</strong>
          {item.verification === "verified" && <><p>{item.evidence}</p><p className="small"><a href={item.sourceUrl}>Facility source</a> · Reviewed <SourceDate value={item.checkedAt} /></p></>}</dd></div>;
      })}</dl>
    </section>
    <CommunityReviews space={space} now={now} />
    <HistoricalPeriods space={space} now={now} />
  </>;
}
