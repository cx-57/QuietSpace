import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PreferencesProvider } from "../components/preferences-provider";
import { BrandMark } from "../components/icon";
import { Navigation } from "../components/navigation";

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
          <Link href="/" className="brand"><span className="brand-mark"><BrandMark /></span>quietspace<span className="brand-period">.</span></Link>
          <Navigation />
        </header>
        <PreferencesProvider><main id="main" tabIndex={-1}>{children}</main></PreferencesProvider>
        <footer className="site-footer"><div className="footer-top"><div><Link href="/" className="brand">quietspace<span className="brand-period">.</span></Link><p>A little more room to be yourself.</p></div><div className="footer-links"><Link href="/about">How it works</Link><Link href="/privacy">Privacy</Link><Link href="/credits">Sources & credits</Link></div></div><div className="footer-bottom"><p>Made for real neighborhoods. Starting in Boston.</p><p>Past observations. Changing conditions. Your choice.</p></div></footer>
      </body>
    </html>
  );
}
