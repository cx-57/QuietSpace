"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VisitorReview } from "../lib/server/community-store";
import { DIMENSIONS } from "../lib/contracts";
import type { Intensity } from "../lib/contracts";
import { ATTRIBUTE_HINTS, ATTRIBUTE_LABELS } from "../lib/visitor-ratings";
import type { AttributeRatings } from "../lib/visitor-ratings";
import { StarRatingField } from "./star-rating-field";

export function ReviewList({ reviews, viewerId, showPlace = false }: { reviews: VisitorReview[]; viewerId?: string; showPlace?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  return <>{!reviews.length && <p className="notice">No written reviews yet. Share a real visit to help the next person.</p>}
    {error && <p role="alert">{error}</p>}
    <div className="visitor-review-list">{reviews.map(r => <article className="panel visitor-review" key={r.id}>
      <div className="review-top"><strong>{r.displayName}</strong><span aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></div>
      {showPlace && <Link href={`/spaces/${r.spaceSlug}`}>{r.spaceSlug.replace(/^bpl-/, "").replaceAll("-", " ")}</Link>}
      {DIMENSIONS.some(d => r.attributes[d] !== null) && <dl className="review-attribute-stars">{DIMENSIONS.filter(d => r.attributes[d] !== null).map(d => <div key={d}><dt>{ATTRIBUTE_LABELS[d]}</dt><dd aria-label={`${r.attributes[d]} out of 5 stars`}>{"★".repeat(r.attributes[d]!)}{"☆".repeat(5 - r.attributes[d]!)} <span className="small">{r.attributes[d]}/5</span></dd></div>)}</dl>}
      <p className="review-body">{r.body}</p><p className="small muted"><time dateTime={r.createdAt}>{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium" }).format(new Date(r.createdAt))}</time> · Visitor experience · Not independently verified</p>
      {viewerId === r.userId && <button className="text-button" disabled={deleting === r.id} onClick={async () => {
        setDeleting(r.id); setError("");
        try {
          const response = await fetch("/api/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) });
          if (!response.ok) throw new Error();
          router.refresh();
        } catch { setError("Could not delete your review. Please try again."); }
        finally { setDeleting(null); }
      }}>{deleting === r.id ? "Deleting…" : "Delete my review"}</button>}
    </article>)}</div></>;
}
export function ReviewComposer({ spaceSlug }: { spaceSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState<Intensity | null>(null);
  const [attributes, setAttributes] = useState<AttributeRatings>({ noise: null, crowds: null, brightness: null, scent: null });
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spaceSlug, rating, attributes, body: data.get("body") }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Could not save your review."); return; }
      setSuccess(true); router.refresh();
    } catch { setError("Could not reach the server. Your text is still here."); }
    finally { setBusy(false); }
  }
  if (success) return <section className="notice" role="status"><h2>Your review is published.</h2><p>Thank you for sharing your visit.</p><Link className="button" href={`/spaces/${spaceSlug}#visitor-reviews`}>See your review</Link></section>;
  return <form onSubmit={submit} className="panel account-form" aria-busy={busy}>
    {error && <p className="notice" role="alert">{error}</p>}
    <StarRatingField name="rating" label="Overall experience" hint="1 = poor · 5 = excellent" required value={rating} onChange={setRating} />
    <section aria-labelledby="attribute-ratings-title"><h2 id="attribute-ratings-title">Rate the details</h2><p className="small muted">These ratings update the place’s attributes and help match visitor preferences. Skip anything you didn’t notice.</p><div className="attribute-rating-fields">{DIMENSIONS.map(d => <StarRatingField key={d} name={`attribute-${d}`} label={ATTRIBUTE_LABELS[d]} hint={ATTRIBUTE_HINTS[d]} value={attributes[d]} onChange={value => setAttributes({ ...attributes, [d]: value })} />)}</div></section>
    <div className="field"><label htmlFor="review-body">Your review</label><textarea id="review-body" name="body" required minLength={20} maxLength={1500} rows={6} placeholder="What helped you feel comfortable? What should someone know before visiting?" /><p className="field-hint">20–1,500 characters. Share your own visit. Avoid private details about yourself or other people.</p></div>
    <p className="small muted">Your name, stars and review will be public. Attribute ratings contribute to visitor averages and preference suggestions. They describe your experience, not verified measurements. You can delete your review from your account.</p>
    <button disabled={busy} type="submit">{busy ? "Publishing…" : "Publish review"}</button>
  </form>;
}
