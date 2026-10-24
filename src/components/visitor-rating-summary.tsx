import { DIMENSIONS } from "../lib/contracts";
import { ATTRIBUTE_LABELS } from "../lib/visitor-ratings";
import type { PlaceVisitorRatings } from "../lib/visitor-ratings";

export function VisitorRatingSummary({ summary, compact = false }: { summary?: PlaceVisitorRatings; compact?: boolean }) {
  if (!summary?.overall.count) return compact ? null : <p className="small muted">No visitor ratings yet. Share your visit to help others choose.</p>;
  const dimensions = compact ? DIMENSIONS.filter(d => summary.attributes[d].count > 0) : DIMENSIONS;
  return <div className={`visitor-rating-summary${compact ? " compact-ratings" : ""}`}>
    <p className="overall-rating"><strong>{summary.overall.average!.toFixed(1)} <span aria-label="out of 5 stars">★ / 5</span></strong> overall · {summary.overall.count} {summary.overall.count === 1 ? "review" : "reviews"}</p>
    <dl className="attribute-averages">{dimensions.map(d => {
      const rating = summary.attributes[d];
      return <div key={d} data-attribute={d}><dt>{ATTRIBUTE_LABELS[d]}</dt><dd>{rating.average === null ? "Not rated" : <><strong>{rating.average.toFixed(1)} ★</strong><span className="small muted"> / 5 · {rating.count} {rating.count === 1 ? "rating" : "ratings"}</span></>}</dd></div>;
    })}</dl>
    {!compact && <p className="small muted">Visitor averages from reviews posted in the last 60 days. More stars mean quieter, more personal space, softer lighting or less fragrance. Unrated attributes are excluded from averages.</p>}
  </div>;
}
