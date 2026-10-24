"use client";
import type { Directory, FeatureKey, PublicSpace } from "../lib/contracts";
import { DIMENSIONS } from "../lib/contracts";
import { activePresetId, DISCOVERY_PRESETS, selectPreset } from "../lib/discovery-presets";
import { FacilityControls } from "./preference-controls";
import { useHydrated, usePreferences } from "./preferences-provider";
import { IntensityField } from "./fields";
import { Icon } from "./icon";

export type CategoryChoice = "all" | PublicSpace["category"];
const CATEGORY_LABELS: Record<CategoryChoice, string> = {
  all: "All spaces", library: "Libraries", park: "Parks & gardens",
  museum: "Museums", community_centre: "Community centers",
};

export function DiscoveryChoices({ directory, category, visibleCount, onCategoryChange }: {
  directory: Directory; category: CategoryChoice; visibleCount: number; onCategoryChange: (category: CategoryChoice) => void;
}) {
  const { preferences, update } = usePreferences();
  const ready = useHydrated();
  const active = activePresetId(preferences);
  const categories: CategoryChoice[] = ["all", ...Array.from(new Set(directory.spaces.map(s => s.category)))];
  const toggleFacility = (feature: FeatureKey) => {
    const selected = preferences.requiredFeatures.includes(feature);
    update({ ...preferences, requiredFeatures: selected
      ? preferences.requiredFeatures.filter(k => k !== feature)
      : [...preferences.requiredFeatures, feature] });
  };
  return <section className="discovery-choices" id="choose-preferences" aria-labelledby="discovery-choices-title">
    <div className="choices-heading"><div><p className="preference-step">1. CHOOSE YOUR PREFERENCES</p><h2 id="discovery-choices-title">What feels right for you?</h2><p className="small muted">Pick one to get started, or adjust individual senses below.</p></div></div>
    <div className="intent-grid" role="group" aria-label="Sensory atmosphere choices">
      {DISCOVERY_PRESETS.map(item => <button key={item.id} type="button"
        disabled={!ready} className={`intent-option${active === item.id ? " intent-selected" : ""}`}
        aria-pressed={active === item.id} onClick={() => update(selectPreset(preferences, item.id))}>

        <span className="intent-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
        <span className="preference-selection" aria-hidden="true">{active === item.id ? "✓" : ""}</span>
      </button>)}
    </div>
    <div className="choice-details">
      <fieldset className="category-choices"><legend>Place type</legend>
        <div className="choice-pills">{categories.map(id => <button type="button" key={id} className="choice-pill"
          disabled={!ready} aria-pressed={category === id} onClick={() => onCategoryChange(id)}>{CATEGORY_LABELS[id]} <span className="choice-count" aria-hidden="true">{id === "all" ? directory.spaces.length : directory.spaces.filter(s => s.category === id).length}</span></button>)}</div>
      </fieldset>
      <fieldset className="verified-choices"><legend>Facilities</legend>
        <div className="verified-checks">
          <button type="button" className="choice-pill" disabled={!ready}
            aria-pressed={preferences.requiredFeatures.includes("accessible_entrance")}
            onClick={() => toggleFacility("accessible_entrance")}>Accessible entrance</button>
          <button type="button" className="choice-pill" disabled={!ready}
            aria-pressed={preferences.requiredFeatures.includes("quiet_room")}
            onClick={() => toggleFacility("quiet_room")}>Listed quiet/study area</button>
        </div>

      </fieldset>
    </div>
    <details className="fine-tune">
      <summary>More preferences & facilities <Icon name="sliders" size={17} /></summary>
      <p className="small muted">Adjust each sense or require a confirmed facility.</p>
      <div className="field-grid">{DIMENSIONS.map(d => <IntensityField key={d} dimension={d} disabled={!ready}
        value={preferences.maximumIntensities[d]} onChange={value => update({ ...preferences,
          maximumIntensities: { ...preferences.maximumIntensities, [d]: value } })} />)}</div>
      <FacilityControls />
    </details>
    <button type="button" className="choice-view-results" disabled={!ready} onClick={() => {
      const heading = document.getElementById("results-heading");
      heading?.scrollIntoView({ behavior: "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    }}>Find {visibleCount} {visibleCount === 1 ? "place" : "places"} with my preferences <Icon name="arrow" size={18} /></button>
  </section>;
}
