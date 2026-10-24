import Link from "next/link";
import { loadDirectory } from "../../lib/server/directory";
import { currentAccount, communityStore } from "../../lib/server/accounts";
import { ReviewList } from "../../components/visitor-reviews";

export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  const [result, account] = await Promise.all([loadDirectory(), currentAccount()]);
  if (!result.ok) return <div className="prose"><h1>Community unavailable</h1><p>{result.error.message}</p><Link href="/">Explore places</Link></div>;
  const reviews = communityStore().reviews();
  return <div className="community-page">
    <section className="community-hero"><p className="eyebrow">FROM ONE NEIGHBOR TO ANOTHER</p><h1>Been there?<br /><em>Share a little.</em></h1><p>Help someone plan their next visit. Pick a place and write a review.</p><div className="actions"><a className="button" href="#write-review">Write a review</a>{!account && <Link href="/account">Sign in or create account</Link>}</div></section>
    <section aria-labelledby="recent-reviews-title"><div className="section-heading"><h2 id="recent-reviews-title">Recent reviews <em>({reviews.length})</em></h2></div><ReviewList reviews={reviews} viewerId={account?.id} showPlace /></section>
    <section id="write-review" className="community-places" aria-labelledby="write-review-title"><div className="section-heading"><h2 id="write-review-title">Where did you visit?</h2></div><div className="community-place-list">{result.value.spaces.map(space => <div key={space.id} className="community-place-row"><div><h3><Link href={`/spaces/${space.slug}`}>{space.name.replace("Boston Public Library — ", "")}</Link></h3><p>{space.address}</p></div><Link className="button secondary" href={`/spaces/${space.slug}/review`}>Write a review</Link></div>)}</div></section>
  </div>;
}
