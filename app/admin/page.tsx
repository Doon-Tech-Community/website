import Link from "next/link";
import { isOrganizer, getCurrentUser } from "@/lib/auth";
import { countActiveAttendees, countMeetups, countTags, listAttendees } from "@/lib/queries";
import AdminAttendeesTable from "./AdminAttendeesTable";
import OrganizerAccessAdmin from "./OrganizerAccessAdmin";
import OrganizerAuthButton from "@/components/OrganizerAuthButton";

export const metadata = { title: "Organizer dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [user, organizer] = await Promise.all([getCurrentUser(), isOrganizer()]);
  if (!organizer) {
    return (
      <div className="pt-16 max-w-md mx-auto card-frame rounded-2xl p-8 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Organizers only</h1>
        <p className="text-inkSoft">
          {user
            ? "Your account doesn't have the organizer label. Ask an admin to grant it."
            : "Sign in as an organizer to manage developers and meetups."}
        </p>
        <OrganizerAuthButton next="/admin" />
      </div>
    );
  }

  const [{ items: attendees }, attendeeCount, meetupCount, tagCount] = await Promise.all([
    listAttendees({ pageSize: 60, includeArchived: true, sort: "name" }),
    countActiveAttendees(),
    countMeetups(),
    countTags()
  ]);

  return (
    <div className="pt-8 flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Organizer dashboard</h1>
          <span className="chip chip-success" aria-label="Signed in as organizer">ORGANIZER</span>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/attendees/new" className="btn btn-primary">+ New developer</Link>
          <Link href="/admin/meetups" className="btn btn-ghost">Meetups</Link>
          <Link href="/admin/tags" className="btn btn-ghost">Tags</Link>
          <Link href="/admin/badges" className="btn btn-ghost">🏅 Badges</Link>
          <OrganizerAuthButton />
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Attendees" value={attendeeCount} />
        <Stat label="Meetups" value={meetupCount} />
        <Stat label="Tags" value={tagCount} />
      </section>

      <OrganizerAccessAdmin />

      <AdminAttendeesTable
        attendees={attendees.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          role_title: a.role_title,
          company: a.company,
          status: a.status
        }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-block rounded-xl px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-slate-300">{label}</div>
      <div className="text-2xl font-bold text-accent">{value}</div>
    </div>
  );
}
