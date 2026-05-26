"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { grantOrganizerLabel } from "@/lib/actions";

export default function OrganizerAccessAdmin() {
  const router = useRouter();
  const [lookup, setLookup] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const fd = new FormData();
    fd.set("lookup", lookup);

    start(async () => {
      try {
        const result = await grantOrganizerLabel(fd);
        if (!result.ok) {
          setError(result.error || "Failed to grant organizer access.");
          return;
        }

        const user = result.user;
        const displayName = user?.name || user?.email || user?.id || "User";
        setMessage(
          user?.alreadyOrganizer
            ? `${displayName} already has organizer access.`
            : `${displayName} now has organizer access.`
        );
        setLookup("");
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Failed to grant organizer access.");
      }
    });
  }

  return (
    <section className="card-frame rounded-2xl p-5">
      <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
        Organizer access
      </h2>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <label className="flex flex-col gap-1">
          <span className="label">User ID or email</span>
          <input
            className="input"
            required
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="user@example.com"
          />
        </label>
        <button type="submit" disabled={pending || !lookup.trim()} className="btn btn-primary">
          {pending ? "Saving..." : "Grant organizer"}
        </button>
        {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
        {message && <div className="md:col-span-2 chip chip-success">{message}</div>}
      </form>
    </section>
  );
}
