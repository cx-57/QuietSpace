"use client";
import type { Directory, FeatureKey, PublicSpace } from "../lib/contracts";
import { DIMENSIONS } from "../lib/contracts";
import { activePresetId, DISCOVERY_PRESETS, selectPreset } from "../lib/discovery-presets";
import { DIMENSION_LABELS } from "../lib/preferences";
import { useHydrated, usePreferences } from "./preferences-provider";
import { IntensityField } from "./fields";
import { Icon } from "./icon";

export type CategoryChoice = "all" | PublicSpace["category"];
const CATEGORY_LABELS: Record<CategoryChoice, string> = {
  all: "All spaces", library: "Libraries", park: "Parks & gardens",
  museum: "Museums", community_centre: "Community centers",
};

export function DiscoveryChoices({ directory, category, onCategoryChange }: {
  directory: Directory; category: CategoryChoice; onCategoryChange: (category: CategoryChoice) => void;
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
  return <section className="discovery-choices" aria-labelledby="discovery-choices-title">
    <div className="choices-heading"><div><p className="eyebrow">START WITH WHAT YOU NEED</p>
      <h3 id="discovery-choices-title">What kind of space <em>feels right today?</em></h3></div>
      <p>Pick a starting point, then combine it with a venue type and any verified facilities you need.</p>
    </div>
    <div className="intent-grid" role="group" aria-label="Sensory atmosphere choices">
      {DISCOVERY_PRESETS.map((item,index) => <button key={item.id} type="button"
        disabled={!ready} className={`intent-option${active === item.id ? " intent-selected" : ""}`}
        aria-pressed={active === item.id} onClick={() => update(selectPreset(preferences, item.id))}>
        <span className="intent-index">{String(index + 1).padStart(2,"0")}</span>
        <span className="intent-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
        <span className="intent-check" aria-hidden="true">{active === item.id ? "✓" : "+"}</span>
      </button>)}
    </div>
    <div className="choice-details">
      <fieldset className="category-choices"><legend>Explore by place type</legend>
        <div className="choice-pills">{categories.map(id => <button type="button" key={id} className="choice-pill"
          disabled={!ready} aria-pressed={category === id} onClick={() => onCategoryChange(id)}>{CATEGORY_LABELS[id]}</button>)}</div>
      </fieldset>
      <fieldset className="verified-choices"><legend>Require source-verified facilities</legend>
        <div className="verified-checks">
          <label><input type="checkbox" disabled={!ready} checked={preferences.requiredFeatures.includes("accessible_entrance")}
            onChange={() => toggleFacility("accessible_entrance")} /> Accessible entrance</label>
          <label><input type="checkbox" disabled={!ready} checked={preferences.requiredFeatures.includes("quiet_room")}
            onChange={() => toggleFacility("quiet_room")} /> Listed quiet/study area</label>
        </div>
        <p className="small muted">Strict requirements hide places where the facility is unverified. An accessible entrance does not certify whole-site access.</p>
      </fieldset>
    </div>
    <details className="fine-tune">
      <summary>Fine-tune noise, crowds, brightness and scent <Icon name="sliders" size={17} /></summary>
      <p className="small muted">Adjust any dimension separately. Choices combine with your venue type and verified facility requirements. No selection guarantees real-world conditions.</p>
      <div className="field-grid">{DIMENSIONS.map(d => <IntensityField key={d} dimension={d} disabled={!ready}
        value={preferences.maximumIntensities[d]} onChange={value => update({ ...preferences,
          maximumIntensities: { ...preferences.maximumIntensities, [d]: value } })} />)}</div>
      <p className="small muted">Current limits: {DIMENSIONS.map(d => `${DIMENSION_LABELS[d]} ${preferences.maximumIntensities[d] ?? "any"}`).join(" · ")}</p>
    </details>
    <p className="choice-evidence-notice"><Icon name="shield" size={17} /> These are <strong>your preferences</strong>, not measured descriptions of venues. Matching scores only appear with enough approved community observations; otherwise we show verified facilities and clearly marked unknowns.</p>
  </section>;
}
