"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
export function Navigation({ accountName }: { accountName?: string }) {
  const path = usePathname();
  return <nav aria-label="Main"><Link href="/" aria-current={path === "/" ? "page" : undefined}>Explore</Link><Link className="nav-community" href="/community" aria-current={path === "/community" ? "page" : undefined}>Community</Link><Link className="nav-preferences" href="/preferences" aria-current={path === "/preferences" ? "page" : undefined}><Icon name="sliders" size={17} />Preferences</Link><Link href="/account" aria-current={path === "/account" ? "page" : undefined}>{accountName ? "My account" : "Sign in"}</Link></nav>;
}
