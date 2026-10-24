import Link from "next/link";
import type { MatchResult, PublicSpace } from "../lib/contracts";
import { effectiveFacility } from "../lib/validation";
import { Icon } from "./icon";
import { VisitorRatingSummary } from "./visitor-rating-summary";

export function SpaceCard({ space, match, now, suggestion }: { space: PublicSpace; match: MatchResult; now: Date; suggestion?: string }) {
  const name = space.name.replace("Boston Public Library — ", "");
  const entrance = effectiveFacility(space.features.accessible_entrance, now);
  const quiet = effectiveFacility(space.features.quiet_room, now);
  const seating = effectiveFacility(space.features.seating, now);
  return <article className="space-card direct-place-card">
    <div className="place-body"><p className="place-kicker">{space.category.replaceAll("_", " ")} · {space.address.split(",")[1]?.trim() ?? "Boston"}</p>
      <h3><Link href={`/spaces/${space.slug}`}>{name}</Link></h3><p className="address"><Icon name="pin" size={14} />{space.address}</p>
      {suggestion && <p className="suggestion-reason">{suggestion}</p>}
      <VisitorRatingSummary summary={space.visitorRatings} compact />
      <div className="place-meta">{entrance.value === true && <span className="facility-note"><Icon name="check" size={15} />Accessible entrance</span>}{quiet.value === true && <span className="facility-note"><Icon name="book" size={15} />Quiet/study area</span>}{seating.value === true && <span className="facility-note">Seating</span>}</div>
      {match.score !== null && <p className="small">{match.score}/100 sensory preference fit</p>}
    </div><div className="direct-place-actions"><Link className="button secondary" href={`/spaces/${space.slug}`}>View place <Icon name="arrow" size={17} /></Link><Link href={`/spaces/${space.slug}/review`}>Write a review</Link><a className="official-info" href={space.source.sourceUrl} aria-label={`Official information for ${name}`}>Official info</a></div>
  </article>;
}
