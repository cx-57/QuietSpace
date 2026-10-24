"use client";
import type { PublicSpace } from "../lib/contracts";
import { FEATURE_LABELS, PREFERENCE_FEATURE_KEYS } from "../lib/preferences";
import { scoreSpace, evidenceSummary } from "../lib/sensory-score";
import { effectiveFacility } from "../lib/validation";
import { ConfidenceLabel, MatchExplanation, SensorySnapshot, SourceDate } from "./evidence";
import { StorageNotice, usePreferences } from "./preferences-provider";
import { VisitorRatingSummary } from "./visitor-rating-summary";
import { visitorPreferenceFit, ATTRIBUTE_LABELS } from "../lib/visitor-ratings";



export function SpaceDetail({ space, asOf }: { space: PublicSpace; asOf: string }) {
  const { preferences } = usePreferences();
  const now = new Date(asOf);
  const evidence = evidenceSummary(space.reports, space.id, now, space.timeZone);
  const quietStudy = effectiveFacility(space.features.quiet_room, now);
  const seekingQuiet = preferences.maximumIntensities.noise !== null && preferences.maximumIntensities.noise <= 2;
  const visitorFit = visitorPreferenceFit(space, preferences);
  return <>
    <StorageNotice />
    <section className="panel" aria-labelledby="visitor-ratings-title"><h2 id="visitor-ratings-title">Visitor ratings</h2><VisitorRatingSummary summary={space.visitorRatings} />{visitorFit.score !== null && <p className="visitor-fit"><strong>{visitorFit.score}% visitor-reported fit</strong> for {visitorFit.dimensions.map(d => ATTRIBUTE_LABELS[d].toLowerCase()).join(", ")}.{visitorFit.missing.length > 0 && " Other selected attributes have not been rated yet."}</p>}</section>
    {evidence.approvedRecentCount > 0 && <section className="panel"><h2>Sensory observations</h2><MatchExplanation match={scoreSpace(space.reports, preferences, space.id, now)} /><ConfidenceLabel evidence={evidence} /><SensorySnapshot space={space} now={now} /></section>}
    {seekingQuiet && quietStudy.verification === "verified" && quietStudy.value && <p className="notice">This place has an officially listed quiet/study area. <a href={quietStudy.sourceUrl}>Check room details</a>.</p>}
    <section className="panel" aria-labelledby="facilities-heading"><h2 id="facilities-heading">Facilities & access</h2><p>Check with the venue if a particular facility is essential.</p>
      <dl className="facilities">{PREFERENCE_FEATURE_KEYS.map(key => {
        const item = effectiveFacility(space.features[key], now);
        return <div key={key}><dt>{FEATURE_LABELS[key]}</dt><dd><strong>{item.verification === "unknown" ? "Unknown" : item.value ? "Yes — source verified" : "No — source verified"}</strong>
          {item.verification === "verified" && <><p className="small"><a href={item.sourceUrl}>Facility source</a> · Reviewed <SourceDate value={item.checkedAt} /></p></>}</dd></div>;
      })}</dl>
    </section>


  </>;
}
