import Link from "next/link";
export default function NotFound() {
  return <div className="narrow"><p className="eyebrow">Let’s find another place</p><h1>This page is unavailable.</h1><p>The address may be incorrect, or this venue may no longer be published. Only public venues with current source reviews appear here.</p><Link className="button" href="/">Explore places</Link></div>;
}
