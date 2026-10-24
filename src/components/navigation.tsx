"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
export function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main"><Link href="/" aria-current={path === "/" ? "page" : undefined}>Explore places</Link><Link href="/about" aria-current={path === "/about" ? "page" : undefined}>Our approach</Link><Link className="nav-preferences" href="/preferences" aria-current={path === "/preferences" ? "page" : undefined}><Icon name="sliders" size={17} />Your preferences</Link></nav>;
}
