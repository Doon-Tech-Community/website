import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { avatarUrl } from "@/lib/appwrite";
import { listAttendeesForUser } from "@/lib/queries";
import Avatar from "./Avatar";
import NavLinks, { type NavItem } from "./NavLinks";
import Link from "next/link";

export default async function Nav() {
  const [user, organizer] = await Promise.all([getCurrentUser(), isOrganizer()]);
  const attendee = user ? (await listAttendeesForUser(user.id, 1))[0] : null;
  const profileName = attendee?.name || user?.name || user?.email.split("@")[0] || "Account";
  const profileAvatarUrl = attendee ? avatarUrl(attendee.avatar_file_id, 32) : "";

  const items: NavItem[] = [
    { href: "/dex", label: "Pokedex", shortLabel: "Dex" },
    { href: "/events", label: "Events", shortLabel: "Events" }
  ];

  return (
    <nav aria-label="Primary" className="device-nav flex items-center gap-2 flex-wrap">
      <NavLinks items={items} />
      <div className="account-nav ml-auto flex items-center gap-2">
        {user ? (
          <details className="account-menu">
            <summary className="profile-nav-link btn btn-ghost" aria-label="Account menu">
              <span className="profile-nav-avatar" aria-hidden>
                <Avatar name={profileName} url={profileAvatarUrl} size={24} />
              </span>
              <span className="profile-nav-name hidden sm:inline">{profileName}</span>
            </summary>
            <div className="account-menu__popover">
              <Link href="/profile" className="btn btn-ghost">
                Profile
              </Link>
              {organizer && (
                <Link href="/admin" className="btn btn-ghost">
                  Admin
                </Link>
              )}
              <form action={logout}>
                <button type="submit" className="btn btn-ghost" aria-label={`Sign out ${user.email}`}>
                  Sign out
                </button>
              </form>
            </div>
          </details>
        ) : (
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
