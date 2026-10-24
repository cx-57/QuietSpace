"use client";
import Link from "next/link";
import { useState } from "react";
import type { Directory } from "../lib/contracts";
import { discover } from "../lib/discovery";
import { DEFAULT_PREFERENCES } from "../lib/preferences";
import { FacilityControls } from "./preference-controls";
import { StorageNotice, usePreferences } from "./preferences-provider";
import { SpaceCard } from "./space-card";
import { DiscoveryChoices, type CategoryChoice } from "./discovery-choices";
import { Icon } from "./icon";
import { DIMENSIONS } from "../lib/contracts";
import { DIMENSION_LABELS } from "../lib/preferences";

export function Discover({ directory }: { directory: Directory }) {
  const { preferences, update } = usePreferences();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "match">("match");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState<CategoryChoice>("all");
  const now = new Date(directory.asOf);
  const results = discover(directory.spaces, preferences, query, sort, now, category);
  const seekingQuiet = preferences.maximumIntensities.noise !== null && preferences.maximumIntensities.noise <= 2;
  return <>
    <StorageNotice />
    <section className="places-section" id="places" aria-labelledby="places-title"><div className="section-heading"><div><p className="eyebrow">THE NEIGHBORHOOD GUIDE</p><h2 id="places-title">Somewhere for <em>your kind of day.</em></h2></div><p className="location-stamp"><Icon name="pin" size={17} /> Boston, Massachusetts</p></div>
    <DiscoveryChoices directory={directory} category={category} visibleCount={results.length} onCategoryChange={setCategory} />
    <div className="discovery-layout"><aside className="filters" aria-label="Discovery filters">
      <button className="filters-toggle" type="button" aria-expanded={filtersOpen} aria-controls="filter-options" onClick={() => setFiltersOpen(!filtersOpen)}><Icon name="sliders" size={18} />Your space, your way <span>{filtersOpen ? "−" : "+"}</span></button>
      <noscript><Link href="/preferences">Choose filters in preferences</Link></noscript>
      <div id="filter-options" className="filters-inner" data-open={filtersOpen}>
      <div className="filter-title"><Icon name="sliders" /><h3>Your space, your way</h3></div>
      <p className="small muted">A few preferences can make a big difference.</p>
      <Link className="preference-edit" href="/preferences">Edit sensory preferences <Icon name="arrow" size={18} /></Link>
      <dl className="preference-summary">{DIMENSIONS.map(d => <div key={d}><dt>{DIMENSION_LABELS[d]}</dt><dd>{preferences.maximumIntensities[d] === null ? "Any level" : `${d === "brightness" ? "Prefer" : "Up to"} ${preferences.maximumIntensities[d]}/5`}</dd></div>)}</dl>
      <FacilityControls />
      <button type="button" className="text-button" onClick={() => { setQuery(""); setCategory("all"); setSort("match"); update(DEFAULT_PREFERENCES, true); }}>Clear search and preferences</button>
      <p className="filter-privacy"><Icon name="shield" size={16} /> Saved only on this browser.</p>
      </div>
    </aside><section aria-labelledby="results-heading" className="results">
      <div className="search-row"><div className="field search-field"><label htmlFor="search">Place name or area</label><div className="search-input"><Icon name="search" /><input id="search" type="search" placeholder="A neighborhood, a library, a little room…" maxLength={200} value={query} onChange={e => setQuery(e.target.value)} /></div></div>
        <div className="field"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={e => setSort(e.target.value as "name" | "match")}><option value="match">Available evidence first</option><option value="name">Name</option></select></div></div>
      <p className="directory-note" role="status">{DIMENSIONS.some(d => preferences.maximumIntensities[d] !== null)
        ? "Your atmosphere choices are active. Where there aren't enough real observations, sensory conditions remain unknown; preference selections do not create ratings."
        : "Choose a sensory profile or fine-tune individual senses above. Source-verified facilities help narrow the options while community evidence grows."}</p>
      <div className="results-heading"><h3 id="results-heading">Places to explore <span role="status">{results.length}</span></h3><span className="small muted">{category === "all" ? "All verified public listings" : "Filtered by place type"} · No live-condition claims</span></div>
      {directory.mode === "curated" && <p className="directory-note">Read-only guide · No community reports included. <Link href="/about#evidence">How we check places</Link></p>}
      {seekingQuiet && <p className="directory-note" role="status">{sort === "match" ? "Low-noise preference: officially listed study areas appear ahead of other places without sensory scores." : "Low-noise preference selected; sorting by name."} Official listings do not measure current sound levels. Other places may also have suitable areas that are not yet verified.</p>}
      {!results.length ? <div className="empty-state"><h3>{directory.spaces.length ? "No places meet these filters" : "No published places are available"}</h3><p>{directory.spaces.length ? "Try a broader search, a different place type or fewer required facilities. Sensory preferences alone do not hide places without observations." : "Source evidence may need review. Check back later."}</p><button className="secondary" type="button" onClick={() => { setQuery(""); setCategory("all"); setSort("match"); update(DEFAULT_PREFERENCES, true); }}>Clear all filters</button></div>
        : <div className="place-list">{results.map(({ space, match }, index) => <SpaceCard key={space.id} space={space} match={match} now={now} index={index + 1} seekingQuiet={seekingQuiet} />)}</div>}
      <p className="results-footnote"><Icon name="book" size={16} /> Getting to know a place takes time. A match appears only when there’s enough recent evidence.</p>
    </section></div></section>
    <section className="closing-note"><span className="eyebrow">A MORE CONSIDERATE CITY</span><h2>There isn’t one right place.<br />There’s a place that’s right <em>for you.</em></h2><p>Different days call for different surroundings. Start with what matters to you, check what’s known, and leave room for the unknown.</p><Link href="/about" className="quiet-link">A little about our approach <Icon name="arrow" size={18} /></Link></section>
  </>;
}
