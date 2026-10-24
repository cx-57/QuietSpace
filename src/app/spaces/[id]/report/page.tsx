import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportForm } from "../../../../components/report-form";
import { loadDirectory } from "../../../../lib/server/directory";
import { reportConfig } from "../../../../lib/server/reports";
export const metadata: Metadata = { title: "Report a sensory observation" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadDirectory(new Date(), id);
  if (!result.ok) {
    if (result.error.code === "not_found") notFound();
    return <><h1>Reporting is unavailable</h1><p>{result.error.message}</p><Link className="back-link" href="/">Return to places</Link></>;
  }
  const space = result.value.spaces[0];
  if (!space) notFound();
  return <div className="narrow"><Link className="back-link" href={`/spaces/${space.slug}`}>← Back to venue</Link><div className="hero"><p className="eyebrow">A little knowledge can help</p><h1>Share an observation.</h1><h2>{space.name}</h2><p>Describe the sensory intensity during a past visit. Every report is reviewed before it becomes public.</p></div>
    {result.value.mode !== "curated" && reportConfig() ? <ReportForm spaceId={space.id} slug={space.slug} /> : <section className="notice"><h2>Reporting is not available in this directory yet</h2><p>No observation is collected here. You can still explore the venue’s sources and facilities.</p><Link className="back-link" href={`/spaces/${space.slug}`}>Return to venue information</Link></section>}
  </div>;
}
