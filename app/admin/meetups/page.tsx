import Link from "next/link";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/auth";
import { listAllMeetups } from "@/lib/queries";
import MeetupsAdmin from "./MeetupsAdmin";

export const metadata = { title: "Manage meetups", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminMeetupsPage() {
  if (!(await isOrganizer())) redirect("/admin");
  const meetups = await listAllMeetups();

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetups</h1>
          <p className="text-sm text-inkSoft">
            Add upcoming and past community meetups to the public meetup index.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost">Back to admin</Link>
      </header>

      <MeetupsAdmin meetups={meetups} />
    </div>
  );
}
