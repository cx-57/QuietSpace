import Link from "next/link";
import type { MatchResult, PublicSpace } from "../lib/contracts";
import { effectiveFacility } from "../lib/validation";
import { evidenceSummary, eligibleReports, median } from "../lib/sensory-score";
import { ConfidenceLabel, SourceDate } from "./evidence";
import { Icon } from "./icon";

export function SpaceCard({ space, match, now, index = 1 }: { space: PublicSpace; match: MatchResult; now: Date; index?: number }) {
  const name = space.name.replace("Boston Public Library — ", "");
  const reports = eligibleReports(space.reports, space.id, now);
  const entrance = effectiveFacility(space.features.accessible_entrance, now);
  return <article className="space-card">
    <span className="place-index" aria-hidden="true">{String(index).padStart(2, "0")}</span>
    <div className="place-body"><div className="place-kicker"><span>Public {space.category.replaceAll("_", " ")}</span><span className="kicker-line" /><span>{space.address.split(",")[1]?.trim() ?? "Boston"}</span></div>
      <h3><Link href={`/spaces/${space.slug}`}>{name}</Link></h3>
      <p className="address"><Icon name="pin" size={14} />{space.address}</p>
      <div className="place-senses">{(["noise", "crowds", "brightness", "scent"] as const).map(d => {
        const values = reports.map(r => r.intensities[d]).filter(v => v !== null);
        return <span key={d}><Icon name={d === "noise" ? "sound" : d === "crowds" ? "people" : d === "brightness" ? "sun" : "scent"} size={16} /><span>{d === "crowds" ? "Crowds" : d[0].toUpperCase() + d.slice(1)} <strong>{values.length >= 3 ? `${median(values)}/5` : "—"}</strong><span className="sr-only">{values.length < 3 ? ": not enough observations" : ": median intensity"}</span></span></span>;
      })}</div>
      <div className="place-meta"><span className="facility-note"><Icon name={entrance.value === true ? "check" : "book"} size={15} />{entrance.value === true ? "Accessible entrance · source verified" : "Entrance access not verified"}</span><ConfidenceLabel evidence={evidenceSummary(space.reports, space.id, now, space.timeZone)} /></div>
      <p className="source-line"><a href={space.source.sourceUrl}>Official venue source</a><span>Reviewed <SourceDate value={space.source.checkedAt} /></span></p>
    </div>
    <div className="place-action">{match.score !== null ? <div className="fit-score"><strong>{match.score}<small>/100</small></strong><span>preference fit</span></div> : <p className="unscored-label">{match.reason === "no_preferences" ? "Your next place?" : "More evidence needed"}<span>{match.reason === "no_preferences" ? "Make it personal in preferences" : "No match score yet"}</span></p>}
      <Link className="place-open" href={`/spaces/${space.slug}`} aria-label={`View details: ${name}`}><Icon name="arrow" size={22} /></Link>
    </div>
  </article>;
}
