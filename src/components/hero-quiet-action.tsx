"use client";
import { usePreferences, useHydrated } from "./preferences-provider";
import { Icon } from "./icon";

/** Quick paths to configurable discovery, never guaranteed conditions. */
export function HeroExploreAction() {
  return <button className="button" type="button" onClick={() => {
    document.getElementById("discovery-choices-title")?.scrollIntoView({ behavior: "auto", block: "start" });
  }}>Choose your environment <Icon name="arrow" /></button>;
}

/** An actionable entry point, not a promise of measured noise or guaranteed quiet. */
export function HeroQuietAction() {
  const { preferences, update } = usePreferences();
  const ready = useHydrated();
  return <button className="secondary" type="button" disabled={!ready} onClick={() => {
    update({ ...preferences, maximumIntensities: { ...preferences.maximumIntensities, noise: 2 } });
    document.getElementById("places")?.scrollIntoView({ behavior: "auto", block: "start" });
  }}>Find a quiet study space <Icon name="arrow" /></button>;
}
