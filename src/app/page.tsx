import { Discover } from "../components/discover";
import { Suspense } from "react";
import { LoadingState } from "../components/loading-state";
import { loadDirectory } from "../lib/server/directory";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "../components/icon";
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <>
    <section className="home-hero" aria-labelledby="home-heading"><div className="hero-copy"><p className="eyebrow"><span className="tiny-line" /> A field guide to feeling at ease</p><h1 id="home-heading">A little less noise.<br />A little more <em>room.</em></h1><p className="hero-description">Find a place that feels right. Explore public spaces that fit your senses, your pace, and your kind of day.</p><div className="hero-actions"><a href="#places" className="button">Find your space <Icon name="arrow" /></a><Link href="/preferences" className="quiet-link">Make it personal <Icon name="sliders" size={17} /></Link></div><p className="hero-footnote"><Icon name="shield" size={15} /> No account. No diagnosis. Just your preferences.</p></div>
      <figure className="hero-figure"><div className="photo-topline"><span>THE BOSTON EDITION</span><span>01 / A PLACE TO BEGIN</span></div><div className="hero-photo"><Image src="/images/bates-hall.webp" alt="Arched windows and green reading lamps in Bates Hall at Boston’s Central Library" fill sizes="(max-width: 760px) 100vw, 48vw" preload /><div className="photo-note"><span className="photo-note-number">01</span><div><span className="photo-note-title">Room to think.</span><span>Bates Hall · Central Library</span></div><Link href="/spaces/bpl-central" aria-label="Explore Central Library"><Icon name="arrow" /></Link></div></div><figcaption>Boston Public Library · Archival photograph, 2011 <Link href="/credits">Photo credit</Link></figcaption></figure>
    </section>
    <div className="principles-strip"><p><Icon name="sliders" /><span>Your comfort, <strong>your criteria.</strong></span></p><p><Icon name="book" /><span>Real places. <strong>Sources you can see.</strong></span></p><p><Icon name="shield" /><span>A private choice. <strong>No account needed.</strong></span></p></div>
    <Suspense fallback={<LoadingState />}><DirectoryContent /></Suspense>
  </>;
}

async function DirectoryContent() {
  const result = await loadDirectory();
  return result.ok ? <>
      <Discover directory={result.value} />
    </> : <section className="notice"><h2>{result.error.code === "setup_required" ? "Directory setup is needed" : "The directory is unavailable"}</h2><p role="status">{result.error.message}</p><form action="/"><button className="secondary" type="submit">Try again</button></form></section>;
}
