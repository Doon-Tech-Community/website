"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
}

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div className="device-nav__links flex items-center gap-1 flex-wrap">
      {items.map((n) => {
        const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-label={n.label}
            aria-current={active ? "page" : undefined}
            className={"btn device-nav__link " + (active ? "btn-primary" : "btn-ghost")}
          >
            <span className="hidden sm:inline" aria-hidden>{"▶ "}</span>
            <span className="sm:hidden">{n.shortLabel ?? n.label}</span>
            <span className="hidden sm:inline">{n.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
