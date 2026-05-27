import { notFound, redirect } from "next/navigation";
import AttendeeForm from "@/components/AttendeeForm";
import { getCurrentUser, isOrganizer } from "@/lib/auth";
import { getAttendeeById, listAllBadges, listAllTags } from "@/lib/queries";
import { Query } from "node-appwrite";
import { APPWRITE_DATABASE_ID, TABLES, adminTables } from "@/lib/appwrite";
import type { Rarity } from "@/lib/types";
import AttendeeBadgesPanel, { type AssignedBadge } from "./AttendeeBadgesPanel";

export const metadata = { title: "Edit attendee", robots: { index: false } };
export const dynamic = "force-dynamic";

async function loadAssignedBadges(attendeeId: string): Promise<AssignedBadge[]> {
  const dbx = adminTables();
  const links = await dbx.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeId), Query.limit(100)]
  });
  if (links.rows.length === 0) return [];
  const badgeIds = Array.from(
    new Set(links.rows.map((d) => (d as unknown as { badge_id: string }).badge_id))
  );
  const badges = await dbx.listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: TABLES.badges,
    queries: [Query.equal("$id", badgeIds), Query.limit(badgeIds.length)]
  });
  const byId = new Map(
    badges.rows.map((d) => [
      d.$id,
      {
        id: d.$id,
        name: (d as unknown as { name?: string }).name ?? "",
        description: (d as unknown as { description?: string }).description ?? "",
        icon: (d as unknown as { icon?: string }).icon ?? "",
        rarity: ((d as unknown as { rarity?: Rarity }).rarity ?? "common") as Rarity
      }
    ])
  );
  return links.rows
    .map((l) => {
      const link = l as unknown as { $id: string; badge_id: string; awarded_at: string };
      const b = byId.get(link.badge_id);
      return b ? { ...b, link_id: link.$id, awarded_at: link.awarded_at } : null;
    })
    .filter((x): x is AssignedBadge => x !== null);
}

export default async function EditAttendeePage({ params }: { params: Promise<{ id: string }> }) {
  const [user, organizer] = await Promise.all([getCurrentUser(), isOrganizer()]);
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/attendees/${id}/edit`)}`);

  const a = await getAttendeeById(id);
  if (!a) notFound();

  // Organizers can edit anyone. Otherwise the logged-in user must own this attendee.
  const canEdit = organizer || (a.user_id && a.user_id === user.id);
  if (!canEdit) redirect("/admin");

  const [tags, allBadges, assigned] = await Promise.all([
    listAllTags(),
    organizer ? listAllBadges() : Promise.resolve([]),
    organizer ? loadAssignedBadges(a.id) : Promise.resolve([] as AssignedBadge[])
  ]);
  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Edit attendee</h1>
      {organizer && (
        <AttendeeBadgesPanel
          attendeeId={a.id}
          allBadges={allBadges}
          assigned={assigned}
        />
      )}
      <AttendeeForm
        mode="edit"
        tags={tags}
        canEditOrganizerFields={organizer}
        initial={{
          id: a.id,
          name: a.name,
          slug: a.slug,
          bio: a.bio,
          role_title: a.role_title,
          company: a.company,
          location: a.location,
          avatar_file_id: a.avatar_file_id,
          cover_file_id: a.cover_file_id,
          linkedin_url: a.linkedin_url,
          github_url: a.github_url,
          website_url: a.website_url,
          status: a.status,
          user_id: a.user_id,
          preferred_stack: a.preferred_stack,
          favorite_topic: a.favorite_topic,
          level: a.level,
          tag_ids: a.tag_ids
        }}
      />
    </div>
  );
}
