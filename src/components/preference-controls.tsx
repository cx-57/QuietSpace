"use client";
import { useState } from "react";
import { DIMENSIONS, FEATURE_KEYS } from "../lib/contracts";
import { DEFAULT_PREFERENCES, FEATURE_LABELS } from "../lib/preferences";
import { IntensityField } from "./fields";
import { StorageNotice, usePreferences, useHydrated } from "./preferences-provider";

export function FacilityControls() {
  const { preferences, update } = usePreferences();
  const ready = useHydrated();
  return <fieldset>
    <legend>Required facilities</legend>
    <p className="field-hint">Only venues with current source verification of every selected facility are included. Unknown does not pass.</p>
    <div className="check-list">{FEATURE_KEYS.map(key => <label className="check-label" key={key}>
      <input type="checkbox" checked={preferences.requiredFeatures.includes(key)} disabled={!ready} onChange={e => update({ ...preferences,
        requiredFeatures: e.target.checked ? [...preferences.requiredFeatures, key] : preferences.requiredFeatures.filter(f => f !== key) })} />
      {FEATURE_LABELS[key]}
    </label>)}</div>
  </fieldset>;
}

export function PreferenceControls() {
  const { preferences, update } = usePreferences();
  const ready = useHydrated();
  const [message, setMessage] = useState("");
  return <>
    <StorageNotice />
    <section className="panel" aria-labelledby="sensory-preferences">
      <h2 id="sensory-preferences">What feels comfortable for you?</h2>
      <p>Choose any levels that matter to you. Leave the rest as “No preference.” Lower noise, crowds and scent are treated as within your maximum; brightness is matched to your chosen level.</p>
      <div className="field-grid">{DIMENSIONS.map(d => <IntensityField key={d} dimension={d} disabled={!ready} value={preferences.maximumIntensities[d]} onChange={value => {
        update({ ...preferences, maximumIntensities: { ...preferences.maximumIntensities, [d]: value } }); setMessage("Preferences updated.");
      }} />)}</div>
    </section>
    <section className="panel"><FacilityControls /></section>
    <div className="actions"><button type="button" className="secondary" disabled={!ready} onClick={() => { update(DEFAULT_PREFERENCES, true); setMessage("Preferences reset. Saved settings removed from this browser."); }}>Reset preferences</button>
      <p role="status" className="muted">{message}</p></div>
  </>;
}
