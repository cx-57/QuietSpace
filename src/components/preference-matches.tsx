"use client";
import Link from "next/link";
import { useState } from "react";
import type { Directory } from "../lib/contracts";
import { discover } from "../lib/discovery";
import { recommendation } from "../lib/recommendations";
import { usePreferences } from "./preferences-provider";

export function PreferenceMatches({ directory, signedIn }: { directory: Directory; signedIn: boolean }) {
  const { preferences } = usePreferences();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date(directory.asOf);
  const selected = Object.values(preferences.maximumIntensities).some(v => v !== null);
  const candidates = discover(directory.spaces, preferences, "", "match", now)
    .map(item => ({ ...item, suggestion: recommendation(item.space, preferences, now) }));
  const hasSuggestions = candidates.some(item => item.suggestion.priority > 0 || item.match.score !== null);
  const results = candidates.filter(item => !selected || !hasSuggestions || item.suggestion.priority > 0 || item.match.score !== null)
    .sort((a, b) => b.suggestion.priority - a.suggestion.priority);
  return <section className="panel preference-preview" aria-labelledby="preference-results-title">
    <p className="eyebrow">YOUR RESULTS · UPDATES AS YOU CHOOSE</p><h2 id="preference-results-title">{results.length} places to start.</h2>
    <p className="small muted">Suggestions use visitor attribute ratings when available, then place type and listed facilities. Visitor experiences and current conditions can differ.</p>
    <div className="preference-result-list" aria-live="polite">{results.slice(0, 4).map(({ space, suggestion }) => <div key={space.id}><Link href={`/spaces/${space.slug}`}>{space.name.replace("Boston Public Library — ", "")}</Link><p className="small muted">{suggestion.reason || space.address}</p></div>)}{!results.length && <p>Try removing a required facility to see more places. Unknown facilities do not pass a strict requirement.</p>}</div>
    <div className="actions"><Link className="button" href="/#places">Find places with my preferences</Link>{signedIn ? <button className="secondary" disabled={busy} onClick={async () => {
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/account", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences }) });
        setMessage(response.ok ? "Preferences saved to your account." : "Could not save. Please sign in again.");
      } catch { setMessage("Could not save. Please try again."); }
      finally { setBusy(false); }
    }}>{busy ? "Saving…" : "Save to my account"}</button> : <Link href="/account">Sign in to save to your account</Link>}</div><p role="status">{message}</p>
  </section>;
}
