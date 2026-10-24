import { Discover } from "../components/discover";
import { loadDirectory } from "../lib/server/directory";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await loadDirectory();
  return <>
    <section className="direct-hero" aria-labelledby="home-heading"><div><p className="eyebrow">BOSTON{result.ok ? ` · ${result.value.spaces.length} PLACES` : ""}</p><h1 id="home-heading">Find a place that <em>fits.</em></h1><p>Start with your preferences. Find places that suit your day.</p></div><a className="button" href="#choose-preferences">Choose my preferences</a></section>
    {result.ok ? <Discover directory={result.value} /> : <section className="notice"><h2>The directory is unavailable</h2><p role="status">{result.error.message}</p><Link href="/">Try again</Link></section>}
  </>;
}
import Link from "next/link";
