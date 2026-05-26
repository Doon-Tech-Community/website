import "server-only";
import { Query } from "node-appwrite";
import {
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  adminTables,
  avatarUrl,
  sessionTables
} from "./appwrite";
import type {
  Attendee,
  AttendeeBadge,
  AttendeeListItem,
  AttendeeStatus,
  Badge,
  Meetup,
  Rarity,
  Tag,
  TagType
} from "./types";

const db = APPWRITE_DATABASE_ID;

interface Doc {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

export function mapAttendee(d: Doc & Record<string, unknown>): Attendee {
  return {
    id: d.$id,
    createdAt: d.$createdAt,
    updatedAt: d.$updatedAt,
    name: (d.name as string) ?? "",
    slug: (d.slug as string) ?? "",
    bio: (d.bio as string) ?? "",
    role_title: (d.role_title as string) ?? "",
    company: (d.company as string) ?? "",
    location: (d.location as string) ?? "",
    avatar_file_id: (d.avatar_file_id as string) ?? "",
    cover_file_id: (d.cover_file_id as string) ?? "",
    linkedin_url: (d.linkedin_url as string) ?? "",
    github_url: (d.github_url as string) ?? "",
    website_url: (d.website_url as string) ?? "",
    status: ((d.status as AttendeeStatus) ?? "active"),
    user_id: (d.user_id as string) ?? "",
    preferred_stack: (d.preferred_stack as string) ?? "",
    favorite_topic: (d.favorite_topic as string) ?? "",
    level: Number(d.level ?? 1),
    tag_ids: Array.isArray(d.tag_ids) ? (d.tag_ids as string[]) : []
  };
}

function mapTag(d: Doc & Record<string, unknown>): Tag {
  return { id: d.$id, name: (d.name as string) ?? "", type: (d.type as TagType) ?? "skill" };
}

function mapMeetup(d: Doc & Record<string, unknown>): Meetup {
  return {
    id: d.$id,
    title: (d.title as string) ?? "",
    description: (d.description as string) ?? "",
    date: (d.date as string) ?? "",
    external_url: (d.external_url as string) ?? ""
  };
}

function mapBadge(d: Doc & Record<string, unknown>): Badge {
  return {
    id: d.$id,
    name: (d.name as string) ?? "",
    description: (d.description as string) ?? "",
    icon: (d.icon as string) ?? "",
    rarity: ((d.rarity as Rarity) ?? "common")
  };
}

export async function getAttendeeBySlug(slug: string): Promise<Attendee | null> {
  const dbx = sessionTables();
  const res = await dbx.listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries: [Query.equal("slug", slug), Query.limit(1)]
  });
  const d = res.rows[0];
  return d ? mapAttendee(d as Doc & Record<string, unknown>) : null;
}

export async function getAttendeeById(id: string): Promise<Attendee | null> {
  try {
    const d = await sessionTables().getRow({
      databaseId: db,
      tableId: COLLECTIONS.attendees,
      rowId: id
    });
    return mapAttendee(d as Doc & Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listAttendeesForUser(userId: string, limit = 10): Promise<Attendee[]> {
  if (!userId) return [];
  const res = await adminTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries: [Query.equal("user_id", userId), Query.limit(limit)]
  });
  return res.rows.map((d) => mapAttendee(d as Doc & Record<string, unknown>));
}

export async function hasAttendeeForUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const res = await adminTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries: [Query.equal("user_id", userId), Query.limit(1)]
  });
  return res.total > 0;
}

export async function listAllTags(): Promise<Tag[]> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.tags,
    queries: [Query.orderAsc("name"), Query.limit(200)]
  });
  return res.rows.map((d) => mapTag(d as Doc & Record<string, unknown>));
}

async function getTagsByIds(ids: string[]): Promise<Tag[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.tags,
    queries: [Query.equal("$id", unique), Query.limit(unique.length)]
  });
  return res.rows.map((d) => mapTag(d as Doc & Record<string, unknown>));
}

export async function listAllMeetups(): Promise<Meetup[]> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.meetups,
    queries: [Query.orderDesc("date"), Query.limit(200)]
  });
  return res.rows.map((d) => mapMeetup(d as Doc & Record<string, unknown>));
}

export async function listAllBadges(): Promise<Badge[]> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.badges,
    queries: [Query.orderAsc("name"), Query.limit(200)]
  });
  return res.rows.map((d) => mapBadge(d as Doc & Record<string, unknown>));
}

async function badgeCountsFor(attendeeIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (attendeeIds.length === 0) return counts;
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeIds), Query.limit(1000)]
  });
  for (const d of res.rows) {
    const aid = (d as unknown as { attendee_id: string }).attendee_id;
    counts.set(aid, (counts.get(aid) ?? 0) + 1);
  }
  return counts;
}

export async function badgesForAttendee(
  attendeeId: string
): Promise<Array<Badge & { awarded_at: string }>> {
  const dbx = sessionTables();
  const linksRes = await dbx.listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeId), Query.limit(100)]
  });
  const links = linksRes.rows as unknown as AttendeeBadge[];
  if (links.length === 0) return [];
  const badgeIds = Array.from(new Set(links.map((l) => l.badge_id)));
  const badgesRes = await dbx.listRows({
    databaseId: db,
    tableId: COLLECTIONS.badges,
    queries: [Query.equal("$id", badgeIds), Query.limit(badgeIds.length)]
  });
  const byId = new Map(
    badgesRes.rows.map((d) => [d.$id, mapBadge(d as Doc & Record<string, unknown>)])
  );
  return links
    .map((l) => {
      const b = byId.get(l.badge_id);
      return b ? { ...b, awarded_at: l.awarded_at } : null;
    })
    .filter((b): b is Badge & { awarded_at: string } => b !== null);
}

export interface ListAttendeesParams {
  q?: string;
  tag?: string[];
  role?: string;
  sort?: "name" | "level" | "recent";
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface ListAttendeesResult {
  items: AttendeeListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAttendees(p: ListAttendeesParams = {}): Promise<ListAttendeesResult> {
  const page = Math.max(1, p.page ?? 1);
  const pageSize = Math.max(1, Math.min(60, p.pageSize ?? 24));
  const queries: string[] = [Query.limit(pageSize), Query.offset((page - 1) * pageSize)];

  if (!p.includeArchived) queries.push(Query.equal("status", "active"));

  const q = (p.q ?? "").trim();
  if (q) {
    queries.push(
      Query.or([Query.search("name", q), Query.search("company", q), Query.search("role_title", q)])
    );
  }
  const role = (p.role ?? "").trim();
  if (role) queries.push(Query.search("role_title", role));

  if (p.tag && p.tag.length > 0) {
    // Resolve tag names -> ids so callers can pass either
    const allTags = await listAllTags();
    const byName = new Map(allTags.map((t) => [t.name.toLowerCase(), t.id]));
    const byId = new Set(allTags.map((t) => t.id));
    const tagIds = p.tag
      .map((t) => (byId.has(t) ? t : byName.get(t.toLowerCase())))
      .filter((x): x is string => !!x);
    for (const tid of tagIds) queries.push(Query.contains("tag_ids", tid));
  }

  const sort = p.sort ?? "name";
  if (sort === "name") queries.push(Query.orderAsc("name"));
  else if (sort === "level") queries.push(Query.orderDesc("level"));
  else if (sort === "recent") queries.push(Query.orderDesc("$updatedAt"));

  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries
  });
  const attendees = res.rows.map((d) => mapAttendee(d as Doc & Record<string, unknown>));

  const allTagIds = Array.from(new Set(attendees.flatMap((a) => a.tag_ids)));
  const [tags, badgeCounts] = await Promise.all([
    getTagsByIds(allTagIds),
    badgeCountsFor(attendees.map((a) => a.id))
  ]);
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  const items: AttendeeListItem[] = attendees.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    role_title: a.role_title,
    company: a.company,
    avatar_url: avatarUrl(a.avatar_file_id, 56),
    status: a.status,
    tags: a.tag_ids.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t),
    badge_count: badgeCounts.get(a.id) ?? 0
  }));

  return { items, total: res.total, page, pageSize };
}

export async function tagsForAttendee(attendee: Attendee): Promise<Tag[]> {
  return getTagsByIds(attendee.tag_ids);
}

export async function relatedAttendees(attendee: Attendee, limit = 4): Promise<AttendeeListItem[]> {
  if (attendee.tag_ids.length === 0) return [];
  const queries = [
    Query.equal("status", "active"),
    Query.notEqual("$id", attendee.id),
    Query.or(attendee.tag_ids.map((tid) => Query.contains("tag_ids", tid))),
    Query.limit(20)
  ];
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries
  });
  const attendees = res.rows
    .map((d) => mapAttendee(d as Doc & Record<string, unknown>))
    .map((a) => ({
      a,
      shared: a.tag_ids.filter((t) => attendee.tag_ids.includes(t)).length
    }))
    .sort((x, y) => y.shared - x.shared)
    .slice(0, limit);

  const allTagIds = Array.from(new Set(attendees.flatMap(({ a }) => a.tag_ids)));
  const [tags, badgeCounts] = await Promise.all([
    getTagsByIds(allTagIds),
    badgeCountsFor(attendees.map(({ a }) => a.id))
  ]);
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  return attendees.map(({ a }) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    role_title: a.role_title,
    company: a.company,
    avatar_url: avatarUrl(a.avatar_file_id, 56),
    status: a.status,
    tags: a.tag_ids.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t),
    badge_count: badgeCounts.get(a.id) ?? 0
  }));
}

export async function countActiveAttendees(): Promise<number> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.attendees,
    queries: [Query.equal("status", "active"), Query.limit(1)]
  });
  return res.total;
}

export async function countMeetups(): Promise<number> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.meetups,
    queries: [Query.limit(1)]
  });
  return res.total;
}

export async function countTags(): Promise<number> {
  const res = await sessionTables().listRows({
    databaseId: db,
    tableId: COLLECTIONS.tags,
    queries: [Query.limit(1)]
  });
  return res.total;
}
