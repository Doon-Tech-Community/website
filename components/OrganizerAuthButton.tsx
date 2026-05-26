import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions";

export default async function OrganizerAuthButton({ next }: { next?: string } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    const href = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
    return (
      <Link href={href} className="btn btn-primary">
        Sign in
      </Link>
    );
  }
  return (
    <form action={logout} className="flex items-center gap-2">
      <span className="text-xs text-inkSoft hidden sm:inline" title={user.email}>
        {user.email}
      </span>
      <button type="submit" className="btn btn-ghost">
        Sign out
      </button>
    </form>
  );
}
