"use server";

import { listAttendees, type ListAttendeesResult } from "@/lib/queries";

export interface LoadMoreParams {
  q?: string;
  badge?: string[];
  sort?: "name" | "recent";
  cursor: string;
}

export async function loadMoreAttendees(p: LoadMoreParams): Promise<ListAttendeesResult> {
  return listAttendees({
    q: p.q,
    badge: p.badge,
    sort: p.sort,
    cursor: p.cursor,
    pageSize: 24
  });
}
