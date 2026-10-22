"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <><h1>Something went wrong</h1><p role="alert">We could not load this page. Please try again.</p><button type="button" onClick={reset} className="min-h-11 rounded border px-4 py-2">Try again</button></>;
}
