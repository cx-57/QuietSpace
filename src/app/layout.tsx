import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PreferencesProvider } from "../components/preferences-provider";

export const metadata: Metadata = {
  title: { default: "QuietSpace", template: "%s | QuietSpace" },
  description: "Find a place that feels right. Explore public spaces with sensory preferences and honest evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">q</span>QuietSpace</Link>
          <nav aria-label="Main"><Link href="/">Explore places</Link><Link href="/preferences">Your preferences</Link></nav>
        </header>
        <PreferencesProvider><main id="main" tabIndex={-1}>{children}</main></PreferencesProvider>
        <footer><span className="brand">QuietSpace</span><p>Personal preferences. Public places. Room to be yourself.</p><p className="small">Conditions can change. Observations describe past visits, never live conditions.</p></footer>
      </body>
    </html>
  );
}
