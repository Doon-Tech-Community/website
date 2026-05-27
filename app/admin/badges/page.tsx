import Link from "next/link";
import { redirect } from "next/navigation";
import { Query } from "node-appwrite";
import { isOrganizer } from "@/lib/auth";
import { listAllBadges } from "@/lib/queries";
import { APPWRITE_DATABASE_ID, TABLES, adminTables } from "@/lib/appwrite";
import BadgesAdmin from "./BadgesAdmin";

export const metadata = { title: "Badges", robots: { index: false } };
export const dynamic = "force-dynamic";

async function countAssignmentsPerBadge(): Promise<Record<string, number>> {
  const links = await adminTables().listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.attendee_badges,
    queries: [Query.limit(2000)]
  });
  const counts: Record<string, number> = {};
  for (const row of links.rows as unknown as Array<{ badge_id: string }>) {
    counts[row.badge_id] = (counts[row.badge_id] ?? 0) + 1;
  }
  return counts;
}

export default async function AdminBadgesPage() {
  if (!(await isOrganizer())) redirect("/admin");
  const [badges, assignmentCounts] = await Promise.all([
    listAllBadges(),
    countAssignmentsPerBadge()
  ]);
  const hasSpeaker = badges.some((b) => b.name.toLowerCase() === "speaker");

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reward badges</h1>
          <p className="text-sm text-inkSoft">
            Create new badge types and assign them to attendees from the attendee edit page.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost">← Back to admin</Link>
      </header>

      <BadgesAdmin
        badges={badges}
        hasSpeaker={hasSpeaker}
        assignmentCounts={assignmentCounts}
      />
    </div>
  );
}
