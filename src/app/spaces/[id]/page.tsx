import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpaceDetail } from "../../../components/space-detail";
import { currentAccount, communityStore } from "../../../lib/server/accounts";
import { ReviewList } from "../../../components/visitor-reviews";
import { SourceDate } from "../../../components/evidence";
import { loadDirectory } from "../../../lib/server/directory";
import { Icon } from "../../../components/icon";
export const metadata: Metadata = { title: "Venue information" };
export const dynamic = "force-dynamic";

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadDirectory(new Date(), id);
  if (!result.ok) {
    if (result.error.code === "not_found") notFound();
    return <><h1>Venue information is unavailable</h1><p role="status">{result.error.message}</p><Link className="back-link" href="/">Return to places</Link></>;
  }
  const space = result.value.spaces[0];
  if (!space) notFound();
  const account = await currentAccount();
  const reviews = communityStore().reviews(space.slug);
  return <>
    <Link className="breadcrumb" href="/#places">← All places</Link><div className="detail-masthead"><div className="hero"><p className="eyebrow">BOSTON NEIGHBORHOOD GUIDE · PUBLIC {space.category.replaceAll("_", " ")}</p><h1>{space.name.replace("Boston Public Library — ", "")}</h1><p className="detail-address"><Icon name="pin" size={18} />{space.address}</p></div><div className="detail-visit"><Link className="button" href={`/spaces/${space.slug}/review`}>Write a review</Link><a className="button secondary" href={space.source.sourceUrl}>Plan your visit <Icon name="external" size={16} /></a><span>Details from the official venue source</span></div></div>

    <SpaceDetail space={space} asOf={result.value.asOf} />
    <section id="visitor-reviews" className="visitor-reviews-section"><div className="section-heading"><h2>Visitor reviews ({reviews.length})</h2><Link className="button" href={`/spaces/${space.slug}/review`}>Write a review</Link></div><ReviewList reviews={reviews} viewerId={account?.id} /></section>
    <section className="panel" aria-labelledby="source-heading"><h2 id="source-heading">Plan your visit with the official source</h2><p>{space.source.evidence}</p><p><a href={space.source.sourceUrl}>Official venue & visiting information</a> · Source reviewed <SourceDate value={space.source.checkedAt} /></p><p>{space.category === "museum" ? "Museum admission may require a paid ticket. Check the official venue for current prices and availability. " : ""}Hours, entry requirements and access to individual rooms may vary. We do not track whether this place is open now. Venue time zone: {space.timeZone}.</p></section>

  </>;
}
