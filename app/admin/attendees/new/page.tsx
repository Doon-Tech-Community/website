import { redirect } from "next/navigation";
import AttendeeForm from "@/components/AttendeeForm";
import { isOrganizer } from "@/lib/auth";
import { listAllTags } from "@/lib/queries";

export const metadata = { title: "New attendee", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewAttendeePage() {
  if (!(await isOrganizer())) redirect("/admin");
  const tags = await listAllTags();
  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">New attendee</h1>
      <AttendeeForm
        mode="create"
        tags={tags}
        canEditOrganizerFields
        initial={{
          name: "",
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
          user_id: "",
          preferred_stack: "",
          favorite_topic: "",
          level: 1,
          tag_ids: []
        }}
      />
    </div>
  );
}
