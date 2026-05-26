import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { logout } from "@/lib/actions";
import NavLinks, { type NavItem } from "./NavLinks";
import Link from "next/link";

export default async function Nav() {
  const [user, organizer] = await Promise.all([getCurrentUser(), isOrganizer()]);

  const items: NavItem[] = [
    { href: "/dex", label: "Pokedex" },
    { href: "/meetups", label: "Meetups" }
  ];
  if (organizer) items.push({ href: "/admin", label: "Admin" });

  return (
    <nav aria-label="Primary" className="flex items-center gap-2 flex-wrap">
      <NavLinks items={items} />
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <Link href="/profile" className="btn btn-ghost">
              <span className="hidden sm:inline">▶ </span>Profile
            </Link>
            <form action={logout}>
              <button type="submit" className="btn btn-ghost" aria-label={`Sign out ${user.email}`}>
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
