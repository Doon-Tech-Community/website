import { redirect } from "next/navigation";
import AttendeeForm from "@/components/AttendeeForm";
import { getCurrentUser } from "@/lib/auth";
import { listAllTags, listAttendeesForUser } from "@/lib/queries";

export const metadata = { title: "Complete profile", robots: { index: false } };
export const dynamic = "force-dynamic";

function fallbackName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/profile";
  if (next === "/login" || next.startsWith("/login?")) return "/profile";
  if (next === "/profile/setup" || next.startsWith("/profile/setup?")) return "/profile";
  return next;
}

export default async function ProfileSetupPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/profile/setup")}`);

  const linked = await listAttendeesForUser(user.id, 1);
  if (linked.length > 0) redirect(safeNext(searchParams.next));

  const tags = await listAllTags();
  const name = user.name || fallbackName(user.email);

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Complete your attendee profile</h1>
        <p className="text-sm text-inkSoft">
          Create the card linked to your account before continuing.
        </p>
      </header>

      <section className="card-frame rounded-2xl p-5">
        <AttendeeForm
          mode="self-create"
          tags={tags}
          canEditOrganizerFields={false}
          initial={{
            name,
            slug: "",
            bio: "",
            role_title: "",
            company: "",
            location: "Dehradun",
            avatar_file_id: "",
            cover_file_id: "",
            linkedin_url: "",
            github_url: "",
            website_url: "",
            status: "active",
            user_id: user.id,
            preferred_stack: "",
            favorite_topic: "",
            level: 1,
            tag_ids: []
          }}
        />
      </section>
    </div>
  );
}
