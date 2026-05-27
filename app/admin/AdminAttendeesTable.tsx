"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  archiveAttendee,
  grantOrganizerLabel,
  mergeAttendees,
  revokeOrganizerLabel
} from "@/lib/actions";

interface Row {
  id: string;
  name: string;
  slug: string;
  role_title: string;
  company: string;
  status: string;
  user_id: string;
  is_organizer: boolean;
}

export default function AdminAttendeesTable({ attendees }: { attendees: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mergeMode, setMergeMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return attendees;
    return attendees.filter((a) =>
      `${a.name} ${a.company} ${a.role_title}`.toLowerCase().includes(t)
    );
  }, [q, attendees]);

  async function archive(id: string) {
    if (!confirm("Archive this attendee?")) return;
    start(async () => {
      await archiveAttendee(id);
      router.refresh();
    });
  }

  async function makeOrganizer(row: Row) {
    if (!row.user_id) return;
    if (!confirm(`Grant ${row.name} organizer access?`)) return;
    const fd = new FormData();
    fd.set("lookup", row.user_id);
    start(async () => {
      const r = await grantOrganizerLabel(fd);
      if (!r.ok) {
        alert(r.error || "Failed to grant organizer access.");
        return;
      }
      router.refresh();
    });
  }

  async function removeOrganizer(row: Row) {
    if (!row.user_id) return;
    if (!confirm(`Revoke ${row.name}'s organizer access?`)) return;
    const fd = new FormData();
    fd.set("lookup", row.user_id);
    start(async () => {
      const r = await revokeOrganizerLabel(fd);
      if (!r.ok) {
        alert(r.error || "Failed to revoke organizer access.");
        return;
      }
      router.refresh();
    });
  }

  function togglePick(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 2 ? [...p, id] : p));
  }

  async function doMerge() {
    if (picked.length !== 2) return;
    const [source_id, target_id] = picked;
    if (!confirm(`Merge ${source_id} INTO ${target_id}? Source will be archived.`)) return;
    start(async () => {
      await mergeAttendees(source_id, target_id);
      setPicked([]);
      setMergeMode(false);
      router.refresh();
    });
  }

  return (
    <section className="card-frame rounded-2xl p-5">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold">Attendees</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="input ml-auto max-w-xs"
          aria-label="Search attendees"
        />
        <button
          onClick={() => {
            setMergeMode(!mergeMode);
            setPicked([]);
          }}
          className={"btn " + (mergeMode ? "btn-primary" : "")}
        >
          {mergeMode ? "Cancel merge" : "Merge mode"}
        </button>
        {mergeMode && (
          <button onClick={doMerge} disabled={picked.length !== 2 || pending} className="btn btn-danger">
            Merge selected (source → target)
          </button>
        )}
      </div>
      {mergeMode && (
        <p className="text-xs text-slate-400 mb-2">
          Pick 2 attendees. First pick = source (will be archived), second pick = target.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              {mergeMode && <th className="py-2 pr-2"></th>}
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Role</th>
              <th className="py-2 pr-2">Company</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-white/[0.02]">
                {mergeMode && (
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={picked.includes(a.id)}
                      onChange={() => togglePick(a.id)}
                      aria-label={`Select ${a.name} for merge`}
                    />
                  </td>
                )}
                <td className="py-2 pr-2">
                  <Link href={`/attendees/${a.slug}`} className="hover:text-accent font-semibold">
                    {a.name}
                  </Link>
                </td>
                <td className="py-2 pr-2 text-slate-300">{a.role_title}</td>
                <td className="py-2 pr-2 text-slate-300">{a.company}</td>
                <td className="py-2 pr-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={"chip " + (a.status === "active" ? "chip-success" : "chip-legendary")}>{a.status}</span>
                    {a.is_organizer && <span className="chip chip-success">organizer</span>}
                  </div>
                </td>
                <td className="py-2 pr-2 flex gap-2 justify-end flex-wrap">
                  <Link href={`/admin/attendees/${a.id}/edit`} className="btn !py-1 !px-2 text-xs">Edit</Link>
                  {a.user_id && !a.is_organizer && (
                    <button
                      onClick={() => makeOrganizer(a)}
                      disabled={pending}
                      className="btn btn-primary !py-1 !px-2 text-xs"
                    >
                      Make organizer
                    </button>
                  )}
                  {a.user_id && a.is_organizer && (
                    <button
                      onClick={() => removeOrganizer(a)}
                      disabled={pending}
                      className="btn btn-danger !py-1 !px-2 text-xs"
                    >
                      Remove organizer
                    </button>
                  )}
                  {a.status === "active" && (
                    <button onClick={() => archive(a.id)} className="btn btn-danger !py-1 !px-2 text-xs">
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
