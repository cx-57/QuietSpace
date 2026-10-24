import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PreferencesProvider } from "../components/preferences-provider";
import { BrandMark } from "../components/icon";
import { Navigation } from "../components/navigation";
import { currentAccount } from "../lib/server/accounts";

export const metadata: Metadata = {
  title: { default: "QuietSpace", template: "%s | QuietSpace" },
  description: "Find a place that feels right. Explore public spaces with sensory preferences and honest evidence.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await currentAccount();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <Link href="/" className="brand"><span className="brand-mark"><BrandMark /></span>QuietSpace</Link>
          <Navigation accountName={account?.displayName} />
        </header>
        <PreferencesProvider><main id="main" tabIndex={-1}>{children}</main></PreferencesProvider>
        <footer className="site-footer"><div className="footer-top"><div><Link href="/" className="brand">QuietSpace</Link></div><div className="footer-links"><Link href="/about">How it works</Link><Link href="/community">Community</Link><Link href="/privacy">Privacy</Link><Link href="/credits">Sources & credits</Link></div></div></footer>
      </body>
    </html>
  );
}
