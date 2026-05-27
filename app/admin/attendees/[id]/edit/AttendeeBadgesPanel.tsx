"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import BadgePill from "@/components/BadgePill";
import { assignBadgeToAttendee, unassignAttendeeBadge } from "@/lib/actions";
import type { Badge } from "@/lib/types";

export interface AssignedBadge extends Badge {
  link_id: string;
  awarded_at: string;
}

export default function AttendeeBadgesPanel({
  attendeeId,
  allBadges,
  assigned
}: {
  attendeeId: string;
  allBadges: Badge[];
  assigned: AssignedBadge[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<string>(() => {
    const taken = new Set(assigned.map((a) => a.id));
    return allBadges.find((b) => !taken.has(b.id))?.id ?? "";
  });

  const available = useMemo(() => {
    const taken = new Set(assigned.map((a) => a.id));
    return allBadges.filter((b) => !taken.has(b.id));
  }, [allBadges, assigned]);

  // After router.refresh, the just-awarded badge moves out of `available`
  // but `pick` still points to it. Reset to the next available badge so the
  // user can award another one without a manual reload.
  useEffect(() => {
    if (pick && !available.some((b) => b.id === pick)) {
      setPick(available[0]?.id ?? "");
    }
  }, [available, pick]);

  function assign() {
    if (!pick) return;
    setError(null);
    start(async () => {
      const r = await assignBadgeToAttendee(attendeeId, pick);
      if (!r.ok) {
        setError(r.error || "Failed to assign badge.");
        return;
      }
      router.refresh();
    });
  }

  function remove(linkId: string) {
    if (!confirm("Remove this badge from the attendee?")) return;
    setError(null);
    start(async () => {
      const r = await unassignAttendeeBadge(linkId);
      if (!r.ok) {
        setError(r.error || "Failed to remove badge.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="card-frame rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold">
          Reward badges
        </h2>
        <Link href="/admin/badges" className="btn btn-ghost !py-1 !px-2 text-xs">
          Manage badge types →
        </Link>
      </div>

      {allBadges.length === 0 ? (
        <p className="text-sm text-inkSoft">
          No badge types yet.{" "}
          <Link href="/admin/badges" className="underline hover:text-accent">
            Create one first
          </Link>{" "}
          (start with the Speaker badge).
        </p>
      ) : (
        <>
          {assigned.length === 0 ? (
            <p className="text-sm text-inkSoft">No badges awarded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assigned.map((b) => (
                <li key={b.link_id} className="flex items-center gap-2 flex-wrap">
                  <BadgePill name={b.name} rarity={b.rarity} description={b.description} />
                  <span className="text-xs text-slate-400">
                    awarded {new Date(b.awarded_at).toLocaleDateString("en-IN")}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(b.link_id)}
                    disabled={pending}
                    className="btn btn-danger !py-1 !px-2 text-xs ml-auto"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {available.length > 0 && (
            <div className="flex items-end gap-2 flex-wrap pt-2 border-t border-white/5">
              <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <span className="label">Award a badge</span>
                <select
                  className="input"
                  value={pick}
                  onChange={(e) => setPick(e.target.value)}
                >
                  {available.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon ? `${b.icon} ` : ""}
                      {b.name} ({b.rarity})
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={assign}
                disabled={pending || !pick}
                className="btn btn-primary"
              >
                {pending ? "Saving…" : "Award"}
              </button>
            </div>
          )}
        </>
      )}

      {error && <div className="chip chip-legendary self-start">{error}</div>}
    </section>
  );
}
