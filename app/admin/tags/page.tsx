import Link from "next/link";
import { redirect } from "next/navigation";
import { isOrganizer } from "@/lib/auth";
import { listAllTags } from "@/lib/queries";
import TagsAdmin from "./TagsAdmin";

export const metadata = { title: "Manage tags", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  if (!(await isOrganizer())) redirect("/admin");
  const tags = await listAllTags();

  return (
    <div className="pt-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-inkSoft">
            Add skills, interests, industries, and topics for attendee profiles.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost">Back to admin</Link>
      </header>

      <TagsAdmin tags={tags} />
    </div>
  );
}
