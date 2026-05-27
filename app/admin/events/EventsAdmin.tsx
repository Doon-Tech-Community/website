"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetup, updateMeetup } from "@/lib/actions";
import type { Meetup } from "@/lib/types";

interface MeetupFormState {
  id: string;
  title: string;
  description: string;
  date: string;
  externalUrl: string;
}

const EMPTY_FORM: MeetupFormState = {
  id: "",
  title: "",
  description: "",
  date: "",
  externalUrl: ""
};

export default function EventsAdmin({ meetups }: { meetups: Meetup[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MeetupFormState>(EMPTY_FORM);
  const editing = !!form.id;

  function set<K extends keyof MeetupFormState>(key: K, value: MeetupFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setError(null);
    setForm(EMPTY_FORM);
  }

  function editMeetup(meetup: Meetup) {
    setError(null);
    setForm({
      id: meetup.id,
      title: meetup.title,
      description: meetup.description,
      date: meetup.date,
      externalUrl: meetup.external_url
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    if (form.id) fd.set("id", form.id);
    fd.set("title", form.title);
    fd.set("description", form.description);
    fd.set("date", form.date);
    fd.set("external_url", form.externalUrl);

    start(async () => {
      const result = editing ? await updateMeetup(fd) : await createMeetup(fd);
      if (!result.ok) {
        setError(result.error || (editing ? "Failed to update event." : "Failed to create event."));
        return;
      }
      setForm(EMPTY_FORM);
      router.refresh();
    });
  }

  return (
    <>
      <section className="card-frame rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold">
            {editing ? "Edit event" : "Create a new event"}
          </h2>
          {editing && (
            <button type="button" onClick={resetForm} disabled={pending} className="btn btn-ghost !py-1 !px-2 text-xs">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Title *</span>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="DTC Event #12"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Date *</span>
            <input
              className="input"
              required
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="label">External event URL</span>
            <input
              className="input"
              type="url"
              value={form.externalUrl}
              onChange={(e) => set("externalUrl", e.target.value)}
              placeholder="https://lu.ma/..."
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="label">Description</span>
            <textarea
              className="input min-h-[120px] resize-y whitespace-pre-wrap"
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this event about?"
            />
          </label>
          {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={pending || !form.title.trim() || !form.date} className="btn btn-primary">
              {pending ? "Saving..." : editing ? "Save event" : "Create event"}
            </button>
          </div>
        </form>
      </section>

      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Events ({meetups.length})
        </h2>
        {meetups.length === 0 ? (
          <p className="text-sm text-inkSoft">No events yet. Create the first one above.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {meetups.map((m) => (
              <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{m.title}</span>
                    <span className="chip">{m.date}</span>
                    {form.id === m.id && <span className="chip chip-epic">Editing</span>}
                  </div>
                  {m.description && (
                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap line-clamp-2">{m.description}</p>
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
                <button
                  type="button"
                  onClick={() => editMeetup(m)}
                  disabled={pending}
                  className="btn btn-primary !py-1 !px-2 text-xs shrink-0"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
