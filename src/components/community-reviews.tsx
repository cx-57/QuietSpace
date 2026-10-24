import type { PublicSpace } from "../lib/contracts";
import { DIMENSIONS } from "../lib/contracts";
import { DIMENSION_LABELS } from "../lib/preferences";
import { communityReviews } from "../lib/community";

export function CommunityReviews({ space, now }: { space: PublicSpace; now: Date }) {
  const reviews = communityReviews(space, now);
  return <section className="panel community-reviews" id="community-reviews" aria-labelledby="community-reviews-heading">
    <p className="eyebrow">SHARED BY NEIGHBORS · REVIEWED BEFORE PUBLICATION</p>
    <h2 id="community-reviews-heading">Community reviews</h2>
    <p>Anonymous, structured sensory check-ins from real visits. These are subjective experiences, not star ratings, verified decibel readings, or a guarantee of how the space feels now.</p>
    {reviews.length === 0 ? <div className="community-empty"><strong>No approved community reviews yet.</strong><p>Be the first to share a visit when reporting is available. Until then, rely on the source-backed venue details above.</p></div> :
      <><p className="small muted">Showing up to {reviews.length} recent approved check-ins. Visit dates are displayed by month to reduce identification risk.</p>
      <ol className="community-review-list">{reviews.map((review, index) => <li key={review.id} className="community-review">
        <div className="review-top"><strong>Community check-in {index + 1}</strong><span>{review.month}</span></div>
        <dl className="review-dimensions">{DIMENSIONS.map(d => <div key={d}><dt>{DIMENSION_LABELS[d]}</dt><dd>{review.intensities[d] === null ? "Not observed" : `${review.intensities[d]}/5`}</dd></div>)}</dl>
      </li>)}</ol></>}
    <p className="small muted">Only approved, non-fixture reports from the last 60 days appear here. Names, free-text testimonials, diagnoses and exact visit times are not published.</p>
  </section>;
}
