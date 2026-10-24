"use client";
import { useState } from "react";
import type { Directory } from "../lib/contracts";
import { discover } from "../lib/discovery";
import { recommendation } from "../lib/recommendations";
import { DEFAULT_PREFERENCES } from "../lib/preferences";
import { StorageNotice, usePreferences } from "./preferences-provider";
import { SpaceCard } from "./space-card";
import { DiscoveryChoices, type CategoryChoice } from "./discovery-choices";
import { Icon } from "./icon";
import { DIMENSIONS } from "../lib/contracts";

export function Discover({ directory }: { directory: Directory }) {
  const { preferences, update } = usePreferences();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "match">("match");
  const [showAll, setShowAll] = useState(false);
  const [category, setCategory] = useState<CategoryChoice>("all");
  const now = new Date(directory.asOf);
  const selected = DIMENSIONS.some(d => preferences.maximumIntensities[d] !== null);
  const allResults = discover(directory.spaces, preferences, query, sort, now, category)
    .map(item => ({ ...item, suggestion: recommendation(item.space, preferences, now) }));
  const hasSuggestions = allResults.some(item => item.suggestion.priority > 0 || item.match.score !== null);
  const results = allResults.filter(item => showAll || !selected || !hasSuggestions || item.suggestion.priority > 0 || item.match.score !== null)
    .sort((a, b) => sort === "match" ? (b.match.score ?? -1) - (a.match.score ?? -1) || b.suggestion.priority - a.suggestion.priority : 0);
  return <>
    <StorageNotice />
    <section className="places-section direct-discovery" id="places" aria-label="Find places">
    <DiscoveryChoices directory={directory} category={category} visibleCount={results.length} onCategoryChange={setCategory} />
    <section aria-labelledby="results-heading" className="results">
      <p className="preference-step">2. EXPLORE YOUR PLACES</p>
      <div className="search-row"><div className="field search-field"><label htmlFor="search">Place name or area</label><div className="search-input"><Icon name="search" /><input id="search" type="search" placeholder="Search a place or neighborhood" maxLength={200} value={query} onChange={e => setQuery(e.target.value)} /></div></div>
        <div className="field"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={e => setSort(e.target.value as "name" | "match")}><option value="match">Suggested for me</option><option value="name">Name</option></select></div></div>

      <div className="results-heading"><h3 id="results-heading" tabIndex={-1}>{selected && !showAll ? "Suggested places" : "Places to explore"} <span role="status">{results.length}</span></h3><button className="text-button" type="button" onClick={() => { setQuery(""); setCategory("all"); setShowAll(false); update(DEFAULT_PREFERENCES, true); }}>Clear filters</button>{selected && <button type="button" className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? "Show suggestions" : `Show all ${allResults.length} places`}</button>}</div>
      {selected && <p className="directory-note">Visitor attribute ratings guide suggestions when available; otherwise we use place types and listed facilities.</p>}
      {!results.length ? <div className="empty-state"><h3>{directory.spaces.length ? "No places meet these filters" : "No published places are available"}</h3><p>{directory.spaces.length ? "Try a broader search, a different place type or fewer required facilities. Or choose “Show all places” to browse beyond suggestions." : "Source evidence may need review. Check back later."}</p><button className="secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); setSort("match"); update(DEFAULT_PREFERENCES, true); }}>Clear all filters</button></div>
        : <div className="place-list">{results.map(({ space, match, suggestion }) => <SpaceCard key={space.id} space={space} match={match} now={now} suggestion={selected ? suggestion.reason : undefined} />)}</div>}
    </section></section>
  </>;
}
