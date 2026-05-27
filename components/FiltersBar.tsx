"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Tag } from "@/lib/types";

export default function FiltersBar({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const activeTags = useMemo(() => new Set(sp.getAll("tag")), [sp]);
  const sort = sp.get("sort") ?? "name";

  useEffect(() => {
    const t = setTimeout(() => {
      update({ q });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(patch: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      params.delete(k);
      if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
      else params.set(k, v);
    }
    params.delete("page");
    start(() => router.replace(`/dex?${params.toString()}`, { scroll: false }));
  }

  function toggleTag(name: string) {
    const next = new Set(activeTags);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    update({ tag: [...next] });
  }

  return (
    <div className="filters-bar flex flex-col gap-3">
      <div className="filters-bar__fields flex flex-col md:flex-row gap-3">
        <label className="flex-1 min-w-0">
          <span className="sr-only">Search attendees</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search attendees"
            className="input"
            aria-label="Search attendees"
          />
        </label>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="input md:w-48"
          aria-label="Sort by"
        >
          <option value="name">Sort: A-Z</option>
          <option value="level">Level</option>
          <option value="recent">Recent</option>
        </select>
      </div>
      <div className="filters-bar__tags flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        {tags.map((t) => {
          const active = activeTags.has(t.name);
          return (
            <button
              key={t.id}
              onClick={() => toggleTag(t.name)}
              aria-pressed={active}
              className={
                "chip cursor-pointer " +
                (active ? "!text-white" : "")
              }
              style={active ? { background: "linear-gradient(180deg,#8FDBF8,#1E78A8)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.25), 0 0 0 1px #0B3950, 0 1px 0 rgba(0,0,0,0.2)" } : undefined}
            >
              {t.name}
            </button>
          );
        })}
        {(activeTags.size > 0 || sp.get("q")) && (
          <button
            onClick={() => {
              setQ("");
              update({ q: null, tag: [] });
            }}
            className="chip !text-shellInk"
            style={{ background: "linear-gradient(180deg,#FFC5C7,#F26B6F)" }}
          >
            Clear
          </button>
        )}
        {pending && <span className="text-xs text-slate-400 self-center">Updating...</span>}
      </div>
    </div>
  );
}
