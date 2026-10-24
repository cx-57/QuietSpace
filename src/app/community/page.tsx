import Link from "next/link";
import type { Metadata } from "next";
import { loadDirectory } from "../../lib/server/directory";
import { reportConfig } from "../../lib/server/reports";
import { communityStats } from "../../lib/community";
import { Icon } from "../../components/icon";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const result = await loadDirectory();
  if (!result.ok) return <div className="prose"><h1>Community information unavailable</h1><p role="status">{result.error.message}</p><Link href="/">Return to discovery</Link></div>;
  const directory = result.value;
  const stats = communityStats(directory, new Date(directory.asOf));
  const reporting = directory.mode !== "curated" && reportConfig() !== null;
  return <div className="community-page">
    <section className="community-hero">
      <p className="eyebrow">A COMMUNITY GUIDE, BUILT TOGETHER</p>
      <h1>Help your neighbors find <em>a little more room.</em></h1>
      <p>QuietSpace starts with officially sourced public places. Firsthand observations can add the sensory details that ordinary listings leave out—but only after moderation.</p>
      <div className="hero-actions"><a href="#places-to-help" className="button">See places needing observations <Icon name="arrow" /></a><Link href="/#places" className="quiet-link">Explore the guide</Link></div>
    </section>
    <section className="community-stats" aria-label="Actual directory participation">
      <div><strong>{stats.venueCount}</strong><span>Source-reviewed public places</span></div>
      <div><strong>{stats.approvedCount}</strong><span>Approved recent observations</span></div>
      <div><strong>{stats.reviewedVenueCount}</strong><span>Places with community observations</span></div>
    </section>
    <section className="panel" aria-labelledby="community-flow-heading">
      <p className="eyebrow">THREE STEPS, ONE SHARED GUIDE</p><h2 id="community-flow-heading">How neighbors can help</h2>
      <div className="community-steps">
        <div><span>01</span><h3>Visit a real place</h3><p>Use the official venue link to check availability and plan your visit. A quiet/study-room listing isn't a live noise reading.</p></div>
        <div><span>02</span><h3>Share what you noticed</h3><p>Report any noise, crowd, brightness or scent intensity you actually observed during a visit. Leave unknowns blank.</p></div>
        <div><span>03</span><h3>Build trusted evidence</h3><p>A moderator checks submissions before they appear as anonymous community reviews or contribute to matching.</p></div>
      </div>
    </section>
    <section id="places-to-help" className="community-places" aria-labelledby="places-to-help-heading">
      <div className="section-heading"><div><p className="eyebrow">WHERE LOCAL KNOWLEDGE IS MISSING</p><h2 id="places-to-help-heading">Places that need <em>your perspective.</em></h2></div></div>
      {!reporting && <p className="notice" role="status">Community submissions are not enabled on this deployment. You can browse the verified venues below; this guide does not collect reviews until secure reporting is configured.</p>}
      <div className="community-place-list">
        {stats.needsObservations.map(({space,approved}) => <div key={space.id} className="community-place-row">
          <div><h3><Link href={`/spaces/${space.slug}`}>{space.name.replace("Boston Public Library — ", "")}</Link></h3><p>{space.address}</p><span>{approved === 0 ? "No approved observations yet" : `${approved} approved recent observation${approved === 1 ? "" : "s"}`}</span></div>
          {reporting ? <Link className="button secondary" href={`/spaces/${space.slug}/report`}>Share a visit</Link> : <Link className="button secondary" href={`/spaces/${space.slug}`}>View venue</Link>}
        </div>)}
      </div>
    </section>
    <section className="community-suggest" aria-labelledby="suggest-heading">
      <div><p className="eyebrow">KNOW A PLACE WE MISSED?</p><h2 id="suggest-heading">Nominate a neighborhood space.</h2><p>Suggest a public library, community center, park or museum that should be reviewed next. Please include an official source and do not include private or medical information.</p><p className="small muted">Suggestions use a public GitHub issue and require a GitHub account. A suggestion is not added to the guide until it is independently verified.</p></div>
      <a className="button secondary" href="https://github.com/cx-57/QuietSpace/issues/new?template=suggest-place.yml" rel="noopener noreferrer">Suggest a public space <Icon name="external" size={16} /></a>
    </section>
    <p className="small muted">No names or user testimonials are invented. Counts reflect only currently approved, eligible reports. <Link href="/privacy">How contributions are handled</Link>.</p>
  </div>;
}
