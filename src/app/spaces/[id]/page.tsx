import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpaceDetail } from "../../../components/space-detail";
import { reportConfig } from "../../../lib/server/reports";
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
  const reportingAvailable = result.value.mode !== "curated" && reportConfig() !== null;
  return <>
    <Link className="breadcrumb" href="/#places">← All places</Link><div className="detail-masthead"><div className="hero"><p className="eyebrow">BOSTON NEIGHBORHOOD GUIDE · PUBLIC {space.category.replaceAll("_", " ")}</p><h1>{space.name.replace("Boston Public Library — ", "")}</h1><p className="detail-address"><Icon name="pin" size={18} />{space.address}</p></div><div className="detail-visit"><a className="button secondary" href={space.source.sourceUrl}>Plan your visit <Icon name="external" size={16} /></a><span>Details from the official venue source</span></div></div>
    {result.value.mode === "curated" && <p className="directory-note">Read-only guide · No community reports included.</p>}
    <SpaceDetail space={space} asOf={result.value.asOf} />
    <section className="panel" aria-labelledby="source-heading"><h2 id="source-heading">Plan your visit with the official source</h2><p>{space.source.evidence}</p><p><a href={space.source.sourceUrl}>Official venue & visiting information</a> · Source reviewed <SourceDate value={space.source.checkedAt} /></p><p>{space.category === "museum" ? "Museum admission may require a paid ticket. Check the official venue for current prices and availability. " : ""}Hours, entry requirements and access to individual rooms may vary. We do not track whether this place is open now. Venue time zone: {space.timeZone}.</p></section>
    <section className="contribute-panel"><div><p className="eyebrow">LITTLE DETAILS, SHARED THOUGHTFULLY</p><h2>Know this place?<br /><em>Share what you noticed.</em></h2><p>A moment from your visit can help someone plan theirs. Every observation is reviewed before it becomes public.</p></div>{reportingAvailable ? <Link className="button" href={`/spaces/${space.slug}/report`}>Share a community review <Icon name="arrow" size={18} /></Link> : <Link className="button secondary" href="/community">How community reviews work <Icon name="arrow" size={18} /></Link>}</section>
  </>;
}
