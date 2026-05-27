import "server-only";
import { Query } from "node-appwrite";
import {
  APPWRITE_DATABASE_ID,
  TABLES,
  adminTables,
  avatarUrl,
  sessionTables
} from "./appwrite";
import { calculateLevelScore, type LevelScore } from "./levels";
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

interface Row {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

export function mapAttendee(d: Row & Record<string, unknown>): Attendee {
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

function mapTag(d: Row & Record<string, unknown>): Tag {
  return { id: d.$id, name: (d.name as string) ?? "", type: (d.type as TagType) ?? "skill" };
}

function mapMeetup(d: Row & Record<string, unknown>): Meetup {
  return {
    id: d.$id,
    title: (d.title as string) ?? "",
    description: (d.description as string) ?? "",
    date: (d.date as string) ?? "",
    external_url: (d.external_url as string) ?? ""
  };
}

function mapBadge(d: Row & Record<string, unknown>): Badge {
  return {
    id: d.$id,
    name: (d.name as string) ?? "",
    description: (d.description as string) ?? "",
    icon: (d.icon as string) ?? "",
    rarity: ((d.rarity as Rarity) ?? "common")
  };
}

export async function getAttendeeBySlug(slug: string): Promise<Attendee | null> {
  const dbx = (await sessionTables());
  const res = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries: [Query.equal("slug", slug), Query.limit(1)]
  });
  const d = res.rows[0];
  return d ? mapAttendee(d as Row & Record<string, unknown>) : null;
}

export async function getAttendeeById(id: string): Promise<Attendee | null> {
  try {
    const d = await (await sessionTables()).getRow({
      databaseId: db,
      tableId: TABLES.attendees,
      rowId: id
    });
    return mapAttendee(d as Row & Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listAttendeesForUser(userId: string, limit = 10): Promise<Attendee[]> {
  if (!userId) return [];
  const res = await adminTables().listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries: [Query.equal("user_id", userId), Query.limit(limit)]
  });
  return res.rows.map((d) => mapAttendee(d as Row & Record<string, unknown>));
}

export async function hasAttendeeForUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const res = await adminTables().listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries: [Query.equal("user_id", userId), Query.limit(1)]
  });
  return res.total > 0;
}

export async function listAllTags(): Promise<Tag[]> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.tags,
    queries: [Query.orderAsc("name"), Query.limit(200)]
  });
  return res.rows.map((d) => mapTag(d as Row & Record<string, unknown>));
}

async function getTagsByIds(ids: string[]): Promise<Tag[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.tags,
    queries: [Query.equal("$id", unique), Query.limit(unique.length)]
  });
  return res.rows.map((d) => mapTag(d as Row & Record<string, unknown>));
}

export async function listAllMeetups(): Promise<Meetup[]> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.events,
    queries: [Query.orderDesc("date"), Query.limit(200)]
  });
  return res.rows.map((d) => mapMeetup(d as Row & Record<string, unknown>));
}

export async function listAllBadges(): Promise<Badge[]> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.badges,
    queries: [Query.orderAsc("name"), Query.limit(200)]
  });
  return res.rows.map((d) => mapBadge(d as Row & Record<string, unknown>));
}

interface BadgeStats {
  count: number;
  rarities: Rarity[];
  badges: Array<{ name: string; rarity: Rarity }>;
}

const RARITY_RANK: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

async function badgeStatsFor(attendeeIds: string[]): Promise<Map<string, BadgeStats>> {
  const stats = new Map<string, BadgeStats>();
  if (attendeeIds.length === 0) return stats;

  const linksRes = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeIds), Query.limit(1000)]
  });
  const links = linksRes.rows as unknown as Array<{ attendee_id: string; badge_id: string }>;
  if (links.length === 0) return stats;

  const badgeIds = Array.from(new Set(links.map((l) => l.badge_id)));
  const badgesRes = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.badges,
    queries: [Query.equal("$id", badgeIds), Query.limit(badgeIds.length)]
  });
  const badgeById = new Map(
    badgesRes.rows.map((d) => {
      const row = d as unknown as { name?: string; rarity?: Rarity };
      return [d.$id, { name: row.name ?? "", rarity: (row.rarity ?? "common") as Rarity }];
    })
  );

  for (const link of links) {
    const badge = badgeById.get(link.badge_id) ?? { name: "", rarity: "common" as Rarity };
    const current = stats.get(link.attendee_id) ?? { count: 0, rarities: [], badges: [] };
    current.count += 1;
    current.rarities.push(badge.rarity);
    if (badge.name) current.badges.push({ name: badge.name, rarity: badge.rarity });
    stats.set(link.attendee_id, current);
  }

  for (const entry of stats.values()) {
    entry.badges.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]);
  }

  return stats;
}

export async function badgesForAttendee(
  attendeeId: string
): Promise<Array<Badge & { awarded_at: string }>> {
  const dbx = (await sessionTables());
  const linksRes = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeId), Query.limit(100)]
  });
  const links = linksRes.rows as unknown as AttendeeBadge[];
  if (links.length === 0) return [];
  const badgeIds = Array.from(new Set(links.map((l) => l.badge_id)));
  const badgesRes = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.badges,
    queries: [Query.equal("$id", badgeIds), Query.limit(badgeIds.length)]
  });
  const byId = new Map(
    badgesRes.rows.map((d) => [d.$id, mapBadge(d as Row & Record<string, unknown>)])
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
  badge?: string[];
  role?: string;
  sort?: "name" | "recent";
  cursor?: string;
  pageSize?: number;
  includeArchived?: boolean;
}

export interface ListAttendeesResult {
  items: AttendeeListItem[];
  total: number;
  nextCursor: string | null;
}

export async function listAttendees(p: ListAttendeesParams = {}): Promise<ListAttendeesResult> {
  const pageSize = Math.max(1, Math.min(60, p.pageSize ?? 24));
  const filters: string[] = [];

  if (!p.includeArchived) filters.push(Query.equal("status", "active"));

  const q = (p.q ?? "").trim();
  if (q) {
    filters.push(
      Query.or([Query.search("name", q), Query.search("company", q), Query.search("role_title", q)])
    );
  }
  const role = (p.role ?? "").trim();
  if (role) filters.push(Query.search("role_title", role));

  if (p.badge && p.badge.length > 0) {
    // Resolve badge names -> ids so callers can pass either
    const allBadges = await listAllBadges();
    const byName = new Map(allBadges.map((b) => [b.name.toLowerCase(), b.id]));
    const byId = new Set(allBadges.map((b) => b.id));
    const badgeIds = p.badge
      .map((b) => (byId.has(b) ? b : byName.get(b.toLowerCase())))
      .filter((x): x is string => !!x);

    if (badgeIds.length === 0) {
      return { items: [], total: 0, nextCursor: null };
    }

    // AND semantics: an attendee must have every selected badge.
    const linksRes = await (await sessionTables()).listRows({
      databaseId: db,
      tableId: TABLES.attendee_badges,
      queries: [Query.equal("badge_id", badgeIds), Query.limit(5000)]
    });
    const links = linksRes.rows as unknown as Array<{ attendee_id: string; badge_id: string }>;
    const distinctByAttendee = new Map<string, Set<string>>();
    for (const link of links) {
      const set = distinctByAttendee.get(link.attendee_id) ?? new Set<string>();
      set.add(link.badge_id);
      distinctByAttendee.set(link.attendee_id, set);
    }
    const matchingIds = [...distinctByAttendee.entries()]
      .filter(([, set]) => set.size === badgeIds.length)
      .map(([id]) => id);

    if (matchingIds.length === 0) {
      return { items: [], total: 0, nextCursor: null };
    }

    filters.push(Query.equal("$id", matchingIds));
  }

  const sort = p.sort ?? "name";
  // Fetch one extra row to detect whether more results exist after this page.
  const queries = [...filters, Query.limit(pageSize + 1)];
  if (p.cursor) queries.push(Query.cursorAfter(p.cursor));
  if (sort === "recent") queries.push(Query.orderDesc("$updatedAt"));
  else queries.push(Query.orderAsc("name"));

  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries
  });
  const total = res.total;
  const fetched = res.rows.map((d) => mapAttendee(d as Row & Record<string, unknown>));
  const hasMore = fetched.length > pageSize;
  const attendees = hasMore ? fetched.slice(0, pageSize) : fetched;
  const statsById = await badgeStatsFor(attendees.map((a) => a.id));
  const scoresById = new Map<string, LevelScore>(
    attendees.map((a) => [
      a.id,
      calculateLevelScore(a, statsById.get(a.id)?.rarities ?? [])
    ])
  );

  const allTagIds = Array.from(new Set(attendees.flatMap((a) => a.tag_ids)));
  const tags = await getTagsByIds(allTagIds);
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
    level: scoresById.get(a.id)?.level ?? a.level,
    badge_count: statsById.get(a.id)?.count ?? 0,
    badges: statsById.get(a.id)?.badges ?? [],
    user_id: a.user_id
  }));

  const nextCursor = hasMore && attendees.length > 0 ? attendees[attendees.length - 1].id : null;
  return { items, total, nextCursor };
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
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries
  });
  const attendees = res.rows
    .map((d) => mapAttendee(d as Row & Record<string, unknown>))
    .map((a) => ({
      a,
      shared: a.tag_ids.filter((t) => attendee.tag_ids.includes(t)).length
    }))
    .sort((x, y) => y.shared - x.shared)
    .slice(0, limit);

  const allTagIds = Array.from(new Set(attendees.flatMap(({ a }) => a.tag_ids)));
  const [tags, badgeStats] = await Promise.all([
    getTagsByIds(allTagIds),
    badgeStatsFor(attendees.map(({ a }) => a.id))
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
    level: calculateLevelScore(a, badgeStats.get(a.id)?.rarities ?? []).level,
    badge_count: badgeStats.get(a.id)?.count ?? 0,
    badges: badgeStats.get(a.id)?.badges ?? [],
    user_id: a.user_id
  }));
}

export async function countActiveAttendees(): Promise<number> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries: [Query.equal("status", "active"), Query.limit(1)]
  });
  return res.total;
}

export async function countMeetups(): Promise<number> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.events,
    queries: [Query.limit(1)]
  });
  return res.total;
}

export async function countTags(): Promise<number> {
  const res = await (await sessionTables()).listRows({
    databaseId: db,
    tableId: TABLES.tags,
    queries: [Query.limit(1)]
  });
  return res.total;
}
