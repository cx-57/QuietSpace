"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="narrow"><p className="eyebrow">A pause in the journey</p><h1>Something went wrong</h1><p role="alert">We could not load this page. Please try again.</p><div className="actions"><button type="button" onClick={reset}>Try again</button><Link href="/">Return to places</Link></div></div>;
}
