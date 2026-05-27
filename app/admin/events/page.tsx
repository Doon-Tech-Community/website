import Link from "next/link";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/auth";
import { listAllMeetups } from "@/lib/queries";
import EventsAdmin from "./EventsAdmin";

export const metadata = { title: "Manage events", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  if (!(await isOrganizer())) redirect("/admin");
  const meetups = await listAllMeetups();

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-inkSoft">
            Add upcoming and past community events to the public event index.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost">Back to admin</Link>
      </header>

      <EventsAdmin meetups={meetups} />
    </div>
  );
}
