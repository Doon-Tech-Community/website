"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTag, deleteTag } from "@/lib/actions";
import type { Tag, TagType } from "@/lib/types";

const TAG_TYPES: TagType[] = ["skill", "interest", "industry", "topic"];

export default function TagsAdmin({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<TagType>("skill");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("name", name);
    fd.set("type", type);

    start(async () => {
      try {
        const result = await createTag(fd);
        if (!result.ok) {
          setError(result.error || "Failed to create tag.");
          return;
        }
        setName("");
        setType("skill");
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Failed to create tag.");
      }
    });
  }

  function removeTag(tag: Tag) {
    setError(null);
    if (!window.confirm(`Remove "${tag.name}" from tags and attendee profiles?`)) return;

    start(async () => {
      try {
        const result = await deleteTag(tag.id);
        if (!result.ok) {
          setError(result.error || "Failed to delete tag.");
          return;
        }
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Failed to delete tag.");
      }
    });
  }

  return (
    <>
      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Create a new tag
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Name *</span>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="React"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Type</span>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as TagType)}
            >
              {TAG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={pending || !name.trim()} className="btn btn-primary">
              {pending ? "Saving..." : "Create tag"}
            </button>
          </div>
        </form>
      </section>

      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Tags ({tags.length})
        </h2>
        {tags.length === 0 ? (
          <p className="text-sm text-inkSoft">No tags yet. Create the first one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TAG_TYPES.map((tagType) => {
              const group = tags.filter((t) => t.type === tagType);
              return (
                <div key={tagType}>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                    {tagType}
                  </h3>
                  {group.length === 0 ? (
                    <p className="text-sm text-inkSoft">None yet.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {group.map((tag) => (
                        <li key={tag.id} className="chip flex items-center gap-2">
                          <span>{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            disabled={pending}
                            className="font-bold hover:text-shell-lo"
                            aria-label={`Remove ${tag.name}`}
                            title={`Remove ${tag.name}`}
                          >
                            x
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
