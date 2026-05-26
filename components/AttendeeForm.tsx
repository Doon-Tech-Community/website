"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import type { Tag } from "@/lib/types";
import {
  createAttendee,
  createMyAttendeeProfile,
  updateAttendee,
  uploadAvatar,
  type AttendeeFormPayload
} from "@/lib/actions";
import Avatar from "./Avatar";

export type AttendeeFormValues = AttendeeFormPayload;

export default function AttendeeForm({
  initial,
  tags,
  mode,
  canEditOrganizerFields,
  afterSavePath
}: {
  initial: AttendeeFormValues;
  tags: Tag[];
  mode: "create" | "edit" | "self-create";
  canEditOrganizerFields: boolean;
  afterSavePath?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<AttendeeFormValues>(initial);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof AttendeeFormValues>(k: K, val: AttendeeFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  function toggleTag(id: string) {
    setV((p) => ({
      ...p,
      tag_ids: p.tag_ids.includes(id) ? p.tag_ids.filter((x) => x !== id) : [...p.tag_ids, id]
    }));
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("photo", file);
    const result = await uploadAvatar(fd);
    setUploadingAvatar(false);
    if (!result.ok || !result.fileId) {
      setUploadError(result.error || "Upload failed.");
      return;
    }
    set("avatar_file_id", result.fileId);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result =
        mode === "edit"
          ? await updateAttendee(v)
          : mode === "self-create"
            ? await createMyAttendeeProfile(v)
            : await createAttendee(v);
      if (!result.ok) {
        setError(result.error || "Save failed.");
        return;
      }
      const slug = result.slug || v.slug;
      router.push(afterSavePath ?? (slug ? `/attendees/${slug}` : "/profile"));
      router.refresh();
    });
  }

  const currentAvatarUrl = v.avatar_file_id
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS}/files/${v.avatar_file_id}/preview?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&width=144&height=144&gravity=center&quality=85&output=webp`
    : "";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2 flex items-center gap-4">
        <Avatar name={v.name || "Attendee"} url={currentAvatarUrl} size={72} />
        <div className="flex flex-col gap-1">
          <span className="label">Avatar photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={pickAvatar}
            disabled={uploadingAvatar}
            className="text-sm"
          />
          {uploadingAvatar && <span className="text-xs text-inkSoft">Uploading…</span>}
          {uploadError && <span className="chip chip-legendary self-start">{uploadError}</span>}
          {v.avatar_file_id && !uploadingAvatar && (
            <button
              type="button"
              className="btn btn-ghost !py-1 !px-2 text-xs self-start"
              onClick={() => {
                set("avatar_file_id", "");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <Field label="Name *">
        <input className="input" required value={v.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Slug">
        <input className="input" value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" />
      </Field>
      <Field label="Role / title">
        <input className="input" value={v.role_title} onChange={(e) => set("role_title", e.target.value)} />
      </Field>
      <Field label="Company">
        <input className="input" value={v.company} onChange={(e) => set("company", e.target.value)} />
      </Field>
      <Field label="Location">
        <input className="input" value={v.location} onChange={(e) => set("location", e.target.value)} />
      </Field>
      {canEditOrganizerFields ? (
        <Field label="Status">
          <select
            className="input"
            value={v.status}
            onChange={(e) => set("status", e.target.value as "active" | "archived")}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      ) : (
        <div />
      )}
      <Field label="Preferred stack">
        <input className="input" value={v.preferred_stack} onChange={(e) => set("preferred_stack", e.target.value)} />
      </Field>
      <Field label="Favorite topic">
        <input className="input" value={v.favorite_topic} onChange={(e) => set("favorite_topic", e.target.value)} />
      </Field>
      <Field label="LinkedIn URL">
        <input className="input" value={v.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
      </Field>
      <Field label="GitHub URL">
        <input className="input" value={v.github_url} onChange={(e) => set("github_url", e.target.value)} />
      </Field>
      <Field label="Website URL">
        <input className="input" value={v.website_url} onChange={(e) => set("website_url", e.target.value)} />
      </Field>
      {canEditOrganizerFields && (
        <Field label="Linked user ID (Appwrite $id)">
          <input
            className="input"
            value={v.user_id}
            onChange={(e) => set("user_id", e.target.value)}
            placeholder="optional"
          />
        </Field>
      )}
      <Field label="Bio" full>
        <textarea
          className="input min-h-[160px] resize-y whitespace-pre-wrap"
          rows={6}
          value={v.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </Field>
      <Field label="Tags" full>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = v.tag_ids.includes(t.id);
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => toggleTag(t.id)}
                aria-pressed={on}
                className={"chip cursor-pointer " + (on ? "!bg-accent !text-bg !border-accent" : "")}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </Field>
      {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
      <div className="md:col-span-2 flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" disabled={pending || uploadingAvatar} className="btn btn-primary">
          {pending
            ? "Saving..."
            : mode === "edit"
              ? "Save changes"
              : mode === "self-create"
                ? "Create my profile"
                : "Create attendee"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "md:col-span-2" : ""}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
