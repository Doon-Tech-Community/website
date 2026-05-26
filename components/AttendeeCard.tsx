import Link from "next/link";
import type { AttendeeListItem } from "@/lib/types";
import Avatar from "./Avatar";
import TagChip from "./TagChip";

export default function AttendeeCard({ a }: { a: AttendeeListItem }) {
  return (
    <Link
      href={`/attendees/${a.slug}`}
      className="card-frame rounded-2xl p-4 flex flex-col gap-3 group"
      aria-label={`${a.name}, ${a.role_title || "member"}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={a.name} url={a.avatar_url} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold tracking-tight truncate">{a.name}</h3>
          <p className="text-sm text-slate-300 truncate">{a.role_title}</p>
          {a.company && <p className="text-xs text-slate-400 truncate">@ {a.company}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {a.tags.slice(0, 4).map((t) => (
          <TagChip key={t.id} tag={t} />
        ))}
        {a.tags.length > 4 && <span className="chip">+{a.tags.length - 4}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between text-xs text-inkSoft pt-2 border-t border-ink/15">
        <span>{a.badge_count} badge{a.badge_count === 1 ? "" : "s"}</span>
        <span className="opacity-0 group-hover:opacity-100 transition text-accent font-semibold">View profile →</span>
      </div>
    </Link>
  );
}
