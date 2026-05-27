import Link from "next/link";
import type { AttendeeListItem } from "@/lib/types";
import Avatar from "./Avatar";
import BadgePill from "./BadgePill";
import TagChip from "./TagChip";

const MAX_BADGES_ON_CARD = 3;

export default function AttendeeCard({ a }: { a: AttendeeListItem }) {
  const featuredBadges = a.badges.slice(0, MAX_BADGES_ON_CARD);
  const hiddenBadges = a.badge_count - featuredBadges.length;
  return (
    <Link
      href={`/attendees/${a.slug}`}
      className="attendee-card card-frame rounded-2xl p-4 h-full flex flex-col gap-3 group"
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
      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-inkSoft pt-2 border-t border-ink/15">
        <span className="pixel text-[0.55rem] text-accent shrink-0">LV {a.level}</span>
        {featuredBadges.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-1">
            {featuredBadges.map((b, i) => (
              <BadgePill key={`${b.name}-${i}`} name={b.name} rarity={b.rarity} size="sm" />
            ))}
            {hiddenBadges > 0 && (
              <span className="chip" style={{ fontSize: "0.42rem", padding: "0.2rem 0.4rem" }}>
                +{hiddenBadges}
              </span>
            )}
          </div>
        ) : (
          <span>0 badges</span>
        )}
      </div>
    </Link>
  );
}
