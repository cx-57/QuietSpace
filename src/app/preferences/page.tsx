import type { Metadata } from "next";
import Link from "next/link";
import { PreferenceControls } from "../../components/preference-controls";
import { PreferenceMatches } from "../../components/preference-matches";
import { loadDirectory } from "../../lib/server/directory";
import { currentAccount } from "../../lib/server/accounts";
export const metadata: Metadata = { title: "Preferences" };
export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const [result, account] = await Promise.all([loadDirectory(), currentAccount()]);
  return <div className="narrow"><Link className="back-link" href="/#places">← Explore places</Link><div className="hero"><p className="eyebrow">YOUR COMFORT, YOUR CHOICE</p><h1>What feels right?</h1><p>Choose what matters. Your suggested places update below.</p></div><PreferenceControls />{result.ok && <PreferenceMatches directory={result.value} signedIn={!!account} />}</div>;
}
