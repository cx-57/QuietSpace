import type { Metadata } from "next";
import Link from "next/link";
import { PreferenceControls } from "../../components/preference-controls";
export const metadata: Metadata = { title: "Preferences" };

export default function PreferencesPage() {
  return <div className="narrow"><Link className="back-link" href="/">← Explore places</Link><div className="hero"><p className="eyebrow">Your comfort, your choice</p><h1>A place for your preferences.</h1><p>There is no right or wrong setting. These optional choices stay in your browser; no account, diagnosis or device location is needed.</p><p className="small muted">Changes apply immediately. When storage is available, they are saved on this device until you reset them.</p></div><PreferenceControls /><p><Link className="button" href="/">Explore with these preferences</Link></p></div>;
}
