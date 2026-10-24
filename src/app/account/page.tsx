import Link from "next/link";
import { AccountForm, SignOutButton } from "../../components/account-form";
import { currentAccount, communityStore } from "../../lib/server/accounts";
import { ReviewList } from "../../components/visitor-reviews";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const account = await currentAccount();
  const { next } = await searchParams;
  return <div className="narrow"><div className="hero"><p className="eyebrow">YOUR CORNER OF QUIETSPACE</p><h1>{account ? `Hello, ${account.displayName}.` : "Sign in to QuietSpace."}</h1><p>Save your comfort preferences and share the places you know.</p></div>
    {account ? <><section className="panel"><h2>Your account</h2><p>Signed in as @{account.username}.</p><div className="actions"><Link className="button" href="/preferences">Your preferences</Link><Link className="button secondary" href="/community">Write a review</Link><SignOutButton /></div></section><h2>Your reviews</h2><ReviewList reviews={communityStore().reviews(undefined, account.id)} viewerId={account.id} showPlace /></> : <AccountForm returnTo={next} />}
  </div>;
}
