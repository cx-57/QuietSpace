import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "QuietSpace", template: "%s | QuietSpace" },
  description: "Find a place that feels right. Explore public spaces with sensory preferences and honest evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header>
          <Link href="/" className="brand">QuietSpace</Link>
          <nav aria-label="Main"><Link href="/">Home</Link><Link href="/preferences">Preferences</Link></nav>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer>Personal preferences. Public places. Conditions can change.</footer>
      </body>
    </html>
  );
}
