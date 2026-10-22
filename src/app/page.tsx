import { Discover } from "../components/discover";
import { Suspense } from "react";
import { LoadingState } from "../components/loading-state";
import { loadDirectory } from "../lib/server/directory";
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <>
    <div className="hero"><p className="eyebrow">A little room to feel comfortable</p><h1>Find a place that feels right.</h1>
      <p>Explore public places with your own noise, crowd, light and scent preferences. Take a look at the evidence, and decide what works for you.</p></div>
    <Suspense fallback={<LoadingState />}><DirectoryContent /></Suspense>
  </>;
}

async function DirectoryContent() {
  const result = await loadDirectory();
  return result.ok ? <>
      {result.value.mode === "curated" && <aside className="notice" aria-label="Directory data mode"><h2>Sourced places. A starting point.</h2><p>This read-only directory uses reviewed public venue sources. No community observations are included, and reporting is unavailable in this mode. Check official pages for visiting requirements, hours and updates.</p></aside>}
      <Discover directory={result.value} />
    </> : <section className="notice"><h2>{result.error.code === "setup_required" ? "Directory setup is needed" : "The directory is unavailable"}</h2><p role="status">{result.error.message}</p><form action="/"><button className="secondary" type="submit">Try again</button></form></section>;
}
