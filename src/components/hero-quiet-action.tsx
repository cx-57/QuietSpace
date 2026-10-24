"use client";
import { usePreferences } from "./preferences-provider";
import { Icon } from "./icon";

/** An actionable entry point, not a promise of measured noise or guaranteed quiet. */
export function HeroQuietAction() {
  const { preferences, update } = usePreferences();
  return <button className="button" type="button" onClick={() => {
    update({ ...preferences, maximumIntensities: { ...preferences.maximumIntensities, noise: 2 } });
    document.getElementById("places")?.scrollIntoView({ behavior: "instant", block: "start" });
  }}>Find a quiet study space <Icon name="arrow" /></button>;
}
