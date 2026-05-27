"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createMyAttendeeProfile } from "@/lib/actions";

export default function MinimalProfileSetupForm({
  initialName,
  next
}: {
  initialName: string;
  next: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await createMyAttendeeProfile({
        name,
        slug: "",
        bio: "",
        role_title: "",
        company: "",
        location: "",
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
      });
      if (!result.ok) {
        setError(result.error || "Couldn't create your profile.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="label">Name *</span>
        <input
          className="input"
          required
          autoFocus
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {error && <div className="chip chip-legendary self-start">{error}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending || !name.trim()} className="btn btn-primary">
          {pending ? "Creating…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
