import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "../../../../lib/server/accounts";
import { loadDirectory } from "../../../../lib/server/directory";
import { ReviewComposer } from "../../../../components/visitor-reviews";
export const dynamic = "force-dynamic";
export const metadata = { title: "Write a review" };
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadDirectory(new Date(), id);
  if (!result.ok) return <div className="narrow"><h1>Place unavailable</h1><p>{result.error.message}</p><Link href="/">Explore places</Link></div>;
  const space = result.value.spaces[0];
  if (!space) notFound();
  const account = await currentAccount();
  return <div className="narrow"><Link className="back-link" href={`/spaces/${space.slug}`}>← Back to place</Link><div className="hero"><p className="eyebrow">YOUR EXPERIENCE HELPS</p><h1>Share a visit.</h1><h2>{space.name}</h2><p>Tell your neighbors what it was like, in your own words.</p></div>{account ? <ReviewComposer spaceSlug={space.slug} /> : <section className="panel"><h2>Sign in to leave a review</h2><p>An account lets you manage your reviews and keeps contributions connected to a real member.</p><Link className="button" href={`/account?next=${encodeURIComponent(`/spaces/${space.slug}/review`)}`}>Sign in or create account</Link></section>}</div>;
}
