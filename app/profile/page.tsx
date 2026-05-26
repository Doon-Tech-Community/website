import Link from "next/link";
import { redirect } from "next/navigation";
import AttendeeForm from "@/components/AttendeeForm";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { listAllTags, listAttendeesForUser } from "@/lib/queries";

export const metadata = { title: "Your profile", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [linked, tags] = await Promise.all([
    listAttendeesForUser(user.id, 1),
    listAllTags()
  ]);
  const attendee = linked[0];
  if (!attendee) redirect("/profile/setup?next=/profile");

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
          <p className="text-sm text-inkSoft">Manage how you appear in the Pokedex.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/attendees/${attendee.slug}`} className="btn btn-ghost">
            View public page
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">Sign out</button>
          </form>
        </div>
      </header>

      <AttendeeForm
        mode="edit"
        tags={tags}
        canEditOrganizerFields={false}
        afterSavePath="/profile"
        initial={{
          id: attendee.id,
          name: attendee.name,
          slug: attendee.slug,
          bio: attendee.bio,
          role_title: attendee.role_title,
          company: attendee.company,
          location: attendee.location,
          avatar_file_id: attendee.avatar_file_id,
          cover_file_id: attendee.cover_file_id,
          linkedin_url: attendee.linkedin_url,
          github_url: attendee.github_url,
          website_url: attendee.website_url,
          status: attendee.status,
          user_id: attendee.user_id,
          preferred_stack: attendee.preferred_stack,
          favorite_topic: attendee.favorite_topic,
          level: attendee.level,
          tag_ids: attendee.tag_ids
        }}
      />
    </div>
  );
}
