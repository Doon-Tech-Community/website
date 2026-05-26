"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((n) => {
        const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={"btn " + (active ? "btn-primary" : "btn-ghost")}
          >
            ▶ {n.label}
          </Link>
        );
      })}
    </div>
  );
}
