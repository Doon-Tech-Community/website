"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetup } from "@/lib/actions";
import type { Meetup } from "@/lib/types";

export default function MeetupsAdmin({ meetups }: { meetups: Meetup[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("date", date);
    fd.set("external_url", externalUrl);

    start(async () => {
      const result = await createMeetup(fd);
      if (!result.ok) {
        setError(result.error || "Failed to create meetup.");
        return;
      }
      setTitle("");
      setDescription("");
      setDate("");
      setExternalUrl("");
      router.refresh();
    });
  }

  return (
    <>
      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Create a new meetup
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Title *</span>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="DTC Meetup #12"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Date *</span>
            <input
              className="input"
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="label">External event URL</span>
            <input
              className="input"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://lu.ma/..."
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="label">Description</span>
            <textarea
              className="input min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this meetup about?"
            />
          </label>
          {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={pending || !title.trim() || !date} className="btn btn-primary">
              {pending ? "Saving..." : "Create meetup"}
            </button>
          </div>
        </form>
      </section>

      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Meetups ({meetups.length})
        </h2>
        {meetups.length === 0 ? (
          <p className="text-sm text-inkSoft">No meetups yet. Create the first one above.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {meetups.map((m) => (
              <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{m.title}</span>
                    <span className="chip">{m.date}</span>
                  </div>
                  {m.description && (
                    <p className="text-sm text-slate-300 mt-1 line-clamp-2">{m.description}</p>
                  )}
                  {m.external_url && (
                    <a
                      href={m.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline mt-1 inline-block"
                    >
                      Open event
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
