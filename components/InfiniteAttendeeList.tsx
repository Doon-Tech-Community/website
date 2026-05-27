"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AttendeeCard from "@/components/AttendeeCard";
import { loadMoreAttendees } from "@/app/dex/actions";
import type { AttendeeListItem } from "@/lib/types";

interface Props {
  initialItems: AttendeeListItem[];
  initialCursor: string | null;
  q: string;
  badge: string[];
  sort: "name" | "recent";
}

export default function InfiniteAttendeeList({
  initialItems,
  initialCursor,
  q,
  badge,
  sort
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Track the latest cursor + loading state without forcing the observer to rebind.
  const stateRef = useRef({ cursor, loading });
  stateRef.current = { cursor, loading };

  const loadMore = useCallback(async () => {
    const current = stateRef.current.cursor;
    if (!current || stateRef.current.loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loadMoreAttendees({ q, badge, sort, cursor: current });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = res.items.filter((it) => !seen.has(it.id));
        return prev.concat(fresh);
      });
      setCursor(res.nextCursor);
    } catch {
      setError("Couldn't load more attendees. Try again.");
    } finally {
      setLoading(false);
    }
  }, [q, badge, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <div className="card-frame rounded-2xl p-10 text-center">
        <p className="text-lg font-semibold mb-2">No attendees match your filters.</p>
        <p className="text-sm text-inkSoft">
          Try clearing filters or check back after the next event.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="attendee-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((a) => (
          <li key={a.id}>
            <AttendeeCard a={a} />
          </li>
        ))}
      </ul>
      <div
        ref={sentinelRef}
        aria-hidden={!cursor}
        className="flex items-center justify-center py-4 text-sm text-inkSoft"
      >
        {loading && <span>Loading more…</span>}
        {!loading && cursor && (
          <button
            type="button"
            onClick={loadMore}
            className="chip cursor-pointer"
            aria-label="Load more attendees"
          >
            Load more
          </button>
        )}
        {error && (
          <span role="alert" className="text-rose-300 ml-3">
            {error}
          </span>
        )}
      </div>
    </>
  );
}
