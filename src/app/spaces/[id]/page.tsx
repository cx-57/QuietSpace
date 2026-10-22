import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Venue information" };

export default function SpacePage() {
  return <><h1>Venue details are not available yet</h1><p>Sourced venue information and community observations will appear here when discovery is ready.</p><p>No sensory conditions have been verified for this preview.</p><Link href="/">Return home</Link></>;
}
