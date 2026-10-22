"use client";
import Link from "next/link";
import { useState } from "react";
import type { Directory } from "../lib/contracts";
import { discover } from "../lib/discovery";
import { DEFAULT_PREFERENCES } from "../lib/preferences";
import { FacilityControls } from "./preference-controls";
import { StorageNotice, usePreferences } from "./preferences-provider";
import { SpaceCard } from "./space-card";

export function Discover({ directory }: { directory: Directory }) {
  const { preferences, update } = usePreferences();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "match">("name");
  const now = new Date(directory.asOf);
  const results = discover(directory.spaces, preferences, query, sort, now);
  return <>
    <StorageNotice />
    <div className="discovery-layout"><aside className="filters panel" aria-label="Discovery filters">
      <h2>Make space for your needs</h2>
      <p className="small">Sensory preferences stay in your browser.</p>
      <Link className="button secondary full-width" href="/preferences">Edit sensory preferences</Link>
      <FacilityControls />
      <button type="button" className="text-button" onClick={() => { setQuery(""); setSort("name"); update(DEFAULT_PREFERENCES, true); }}>Clear search and preferences</button>
    </aside><section aria-labelledby="results-heading" className="results">
      <div className="search-row"><div className="field"><label htmlFor="search">Place name or area</label><input id="search" type="search" placeholder="Try Brighton or Copley Square" maxLength={200} value={query} onChange={e => setQuery(e.target.value)} /></div>
        <div className="field"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={e => setSort(e.target.value as "name" | "match")}><option value="name">Name</option><option value="match">Preference fit</option></select></div></div>
      <div className="results-heading"><h2 id="results-heading">Places to explore</h2><p role="status">{results.length} {results.length === 1 ? "place" : "places"} found</p></div>
      <p className="small muted">Numeric matches appear only with enough approved evidence. Unscored venues sort after scored venues, then by name.</p>
      {!results.length ? <div className="empty-state"><h3>{directory.spaces.length ? "No places meet these filters" : "No published places are available"}</h3><p>{directory.spaces.length ? "Try another name or area, or review required facilities. Unknown facilities are excluded when required." : "Source evidence may need review. Check back later."}</p><button className="secondary" type="button" onClick={() => { setQuery(""); update(DEFAULT_PREFERENCES, true); }}>Clear search and preferences</button></div>
        : <div className="card-grid">{results.map(({ space, match }) => <SpaceCard key={space.id} space={space} match={match} now={now} />)}</div>}
    </section></div>
  </>;
}
