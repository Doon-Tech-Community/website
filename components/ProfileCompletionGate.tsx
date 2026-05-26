import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasAttendeeForUser } from "@/lib/queries";

const EXEMPT_PATHS = ["/login", "/profile/setup"];

function isExempt(pathname: string): boolean {
  return EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function ProfileCompletionGate() {
  const pathname = headers().get("x-pathname") ?? "";
  if (!pathname || isExempt(pathname)) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const hasProfile = await hasAttendeeForUser(user.id);
  if (!hasProfile) {
    redirect(`/profile/setup?next=${encodeURIComponent(pathname)}`);
  }

  return null;
}
