import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpaceDetail } from "../../../components/space-detail";
import { SourceDate } from "../../../components/evidence";
import { loadDirectory } from "../../../lib/server/directory";
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
  return <>
    <Link className="breadcrumb" href="/">← All places</Link><div className="hero"><p className="eyebrow">Public {space.category.replaceAll("_", " ")}</p><h1>{space.name}</h1><p>{space.address}</p></div>
    {result.value.mode === "curated" && <p className="notice">Read-only sourced directory. No community reports are included; submissions require the connected, verified reporting service.</p>}
    <SpaceDetail space={space} asOf={result.value.asOf} />
    <section className="panel" aria-labelledby="source-heading"><h2 id="source-heading">Plan your visit with the official source</h2><p>{space.source.evidence}</p><p><a href={space.source.sourceUrl}>Official venue & visiting information</a> · Source reviewed <SourceDate value={space.source.checkedAt} /></p><p>Hours, entry requirements and access to individual rooms may vary. We do not track whether this place is open now. Venue time zone: {space.timeZone}.</p></section>
    <section className="panel"><h2>Share what you noticed</h2><p>A structured observation can help others understand this place. Reports are reviewed before publication.</p><Link className="button secondary" href={`/spaces/${space.slug}/report`}>Report a sensory observation</Link></section>
  </>;
}
