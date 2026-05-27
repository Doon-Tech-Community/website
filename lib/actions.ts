"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ID, Permission, Query, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  APPWRITE_BUCKET_AVATARS,
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  TABLES,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  adminAccount,
  adminTables,
  adminStorage,
  adminUsers,
  sessionAccount
} from "./appwrite";
import { getCurrentUser } from "./auth";
import { calculateLevelScore, type LevelAttendeeInput } from "./levels";
import type { AttendeeStatus, Rarity, TagType } from "./types";

const db = APPWRITE_DATABASE_ID;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitize(s: unknown, max = 2000): string {
  if (typeof s !== "string") return "";
  return s.replace(new RegExp("[\\u0000-\\u001f\\u007f]", "g"), "").slice(0, max);
}

function sanitizeMultiline(s: unknown, max = 4000): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/\r\n?/g, "\n")
    .replace(new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]", "g"), "")
    .slice(0, max);
}

// ===== Auth: email OTP =====

export interface OtpStartResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

export async function startEmailOtp(formData: FormData): Promise<OtpStartResult> {
  const email = sanitize(formData.get("email"), 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  try {
    const token = await adminAccount().createEmailToken({
      userId: ID.unique(),
      email
    });
    return { ok: true, userId: token.userId };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to send code." };
  }
}

export interface OtpVerifyResult {
  ok: boolean;
  error?: string;
}

export async function verifyEmailOtp(formData: FormData): Promise<OtpVerifyResult> {
  const userId = sanitize(formData.get("userId"), 100);
  const code = sanitize(formData.get("code"), 16).replace(/\s+/g, "");
  if (!userId || !code) return { ok: false, error: "Missing code." };
  try {
    const session = await adminAccount().createSession({
      userId,
      secret: code
    });
    if (!session.secret) {
      return { ok: false, error: "Session was created without a server secret." };
    }
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(session.expire)
    });
    cookieStore.delete(LEGACY_SESSION_COOKIE);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Invalid or expired code." };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  const session =
    cookieStore.get(SESSION_COOKIE)?.value ?? cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
  if (session) {
    try {
      await sessionAccount().deleteSession({ sessionId: "current" });
    } catch {
      // Best-effort; clear the cookie either way.
    }
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_SESSION_COOKIE);
  redirect("/");
}

export interface GrantOrganizerResult {
  ok: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    alreadyOrganizer: boolean;
  };
}

export async function grantOrganizerLabel(formData: FormData): Promise<GrantOrganizerResult> {
  const current = await getCurrentUser();
  if (!current || !current.labels.includes("organizer")) {
    return { ok: false, error: "Not allowed." };
  }

  const lookup = sanitize(formData.get("lookup"), 254).trim();
  if (!lookup) return { ok: false, error: "User ID or email is required." };

  try {
    const users = adminUsers();
    const target = lookup.includes("@")
      ? (await users.list({
          queries: [Query.equal("email", lookup.toLowerCase()), Query.limit(2)],
          total: false
        })).users[0]
      : await users.get({ userId: lookup });

    if (!target) return { ok: false, error: "User not found." };

    const labels = Array.from(new Set(target.labels ?? []));
    const alreadyOrganizer = labels.includes("organizer");
    if (!alreadyOrganizer) {
      labels.push("organizer");
      await users.updateLabels({
        userId: target.$id,
        labels
      });
    }

    revalidatePath("/admin");
    revalidatePath("/profile");
    return {
      ok: true,
      user: {
        id: target.$id,
        email: target.email,
        name: target.name,
        alreadyOrganizer
      }
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to update organizer label." };
  }
}

// ===== Attendee CRUD =====

export interface AttendeeFormPayload {
  id?: string;
  name: string;
  slug: string;
  bio: string;
  role_title: string;
  company: string;
  location: string;
  avatar_file_id: string;
  cover_file_id: string;
  linkedin_url: string;
  github_url: string;
  website_url: string;
  status: AttendeeStatus;
  user_id: string;
  preferred_stack: string;
  favorite_topic: string;
  level: number;
  tag_ids: string[];
}

export interface SaveAttendeeResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

async function canEditAttendee(attendeeId: string | undefined): Promise<{
  allowed: boolean;
  isOrganizer: boolean;
  userId: string | null;
}> {
  const u = await getCurrentUser();
  if (!u) return { allowed: false, isOrganizer: false, userId: null };
  const isOrg = u.labels.includes("organizer");
  if (isOrg) return { allowed: true, isOrganizer: true, userId: u.id };
  if (!attendeeId) return { allowed: false, isOrganizer: false, userId: u.id };
  try {
    const row = await adminTables().getRow({
      databaseId: db,
      tableId: TABLES.attendees,
      rowId: attendeeId
    });
    const ownerId = (row as unknown as { user_id?: string }).user_id ?? "";
    return { allowed: ownerId === u.id, isOrganizer: false, userId: u.id };
  } catch {
    return { allowed: false, isOrganizer: false, userId: u.id };
  }
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const dbx = adminTables();
  let slug = base || "attendee";
  let i = 2;
  // Loop until we find a slug not in use
  // (rare collision, capped by 100 attempts)
  for (let attempts = 0; attempts < 100; attempts++) {
    const res = await dbx.listRows({
      databaseId: db,
      tableId: TABLES.attendees,
      queries: [Query.equal("slug", slug), Query.limit(2)]
    });
    const taken = res.rows.find((d) => d.$id !== ignoreId);
    if (!taken) return slug;
    slug = `${base}-${i++}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function attendeePermissions(userId?: string): string[] {
  const permissions = [
    Permission.read(Role.any()),
    Permission.update(Role.label("organizer")),
    Permission.delete(Role.label("organizer"))
  ];
  if (userId) permissions.push(Permission.update(Role.user(userId)));
  return permissions;
}

async function syncUserName(userId: string | undefined, name: string, currentUserId: string): Promise<void> {
  const cleanName = sanitize(name, 128).trim();
  if (!userId || !cleanName) return;

  if (userId === currentUserId) {
    await sessionAccount().updateName({ name: cleanName });
    return;
  }

  await adminUsers().updateName({ userId, name: cleanName });
}

function cleanLevelInput(data: Record<string, unknown>, createdAt: string): LevelAttendeeInput {
  return {
    createdAt,
    bio: sanitizeMultiline(data.bio, 4000),
    role_title: sanitize(data.role_title, 200),
    company: sanitize(data.company, 200),
    location: sanitize(data.location, 200),
    avatar_file_id: sanitize(data.avatar_file_id, 100),
    linkedin_url: sanitize(data.linkedin_url, 500),
    github_url: sanitize(data.github_url, 500),
    website_url: sanitize(data.website_url, 500),
    preferred_stack: sanitize(data.preferred_stack, 200),
    favorite_topic: sanitize(data.favorite_topic, 200),
    tag_ids: Array.isArray(data.tag_ids) ? (data.tag_ids as string[]) : []
  };
}

async function badgeRaritiesForAttendee(attendeeId: string): Promise<Rarity[]> {
  const dbx = adminTables();
  const links = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    queries: [Query.equal("attendee_id", attendeeId), Query.limit(500)]
  });
  const badgeIds = Array.from(
    new Set(links.rows.map((d) => (d as unknown as { badge_id?: string }).badge_id).filter(Boolean))
  ) as string[];
  if (badgeIds.length === 0) return [];

  const badges = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.badges,
    queries: [Query.equal("$id", badgeIds), Query.limit(badgeIds.length)]
  });
  return badges.rows.map(
    (d) => ((d as unknown as { rarity?: Rarity }).rarity ?? "common") as Rarity
  );
}

async function recomputeAttendeeLevel(attendeeId: string): Promise<void> {
  const dbx = adminTables();
  const attendee = await dbx.getRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: attendeeId
  });
  const rarities = await badgeRaritiesForAttendee(attendeeId);
  const score = calculateLevelScore(
    cleanLevelInput(attendee as unknown as Record<string, unknown>, attendee.$createdAt),
    rarities
  );

  if (Number((attendee as unknown as { level?: number }).level ?? 1) !== score.level) {
    await dbx.updateRow({
      databaseId: db,
      tableId: TABLES.attendees,
      rowId: attendeeId,
      data: { level: score.level }
    });
  }
}

export async function createMyAttendeeProfile(
  payload: AttendeeFormPayload
): Promise<SaveAttendeeResult> {
  const u = await getCurrentUser();
  if (!u) return { ok: false, error: "Sign in first." };

  const dbx = adminTables();
  const existing = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendees,
    queries: [Query.equal("user_id", u.id), Query.limit(1)]
  });
  if (existing.rows[0]) {
    return {
      ok: true,
      slug: (existing.rows[0] as unknown as { slug?: string }).slug
    };
  }

  const name = sanitize(payload.name, 200).trim();
  if (!name) return { ok: false, error: "Name is required." };

  const slug = await ensureUniqueSlug(slugify(payload.slug || name));
  const data = {
    name,
    slug,
    bio: sanitizeMultiline(payload.bio, 4000),
    role_title: sanitize(payload.role_title, 200),
    company: sanitize(payload.company, 200),
    location: sanitize(payload.location, 200),
    avatar_file_id: sanitize(payload.avatar_file_id, 100),
    cover_file_id: sanitize(payload.cover_file_id, 100),
    linkedin_url: sanitize(payload.linkedin_url, 500),
    github_url: sanitize(payload.github_url, 500),
    website_url: sanitize(payload.website_url, 500),
    status: "active",
    user_id: u.id,
    preferred_stack: sanitize(payload.preferred_stack, 200),
    favorite_topic: sanitize(payload.favorite_topic, 200),
    tag_ids: (payload.tag_ids ?? []).slice(0, 30).map((t) => sanitize(t, 100))
  };
  const createdAt = new Date().toISOString();
  const dataWithLevel = {
    ...data,
    level: calculateLevelScore(cleanLevelInput(data, createdAt), []).level
  };

  const row = await dbx.createRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: ID.unique(),
    data: dataWithLevel,
    permissions: attendeePermissions(u.id)
  });
  await recomputeAttendeeLevel(row.$id);
  await syncUserName(u.id, name, u.id);
  revalidatePath("/");
  revalidatePath("/dex");
  revalidatePath("/admin");
  revalidatePath("/profile");
  return { ok: true, slug: (row as unknown as { slug: string }).slug };
}

export async function createAttendee(payload: AttendeeFormPayload): Promise<SaveAttendeeResult> {
  const u = await getCurrentUser();
  if (!u) return { ok: false, error: "Not signed in." };
  if (!u.labels.includes("organizer")) {
    return { ok: false, error: "Only organizers can create attendees." };
  }

  const name = sanitize(payload.name, 200).trim();
  if (!name) return { ok: false, error: "Name is required." };

  const slug = await ensureUniqueSlug(slugify(payload.slug || name));
  const data = {
    name,
    slug,
    bio: sanitizeMultiline(payload.bio, 4000),
    role_title: sanitize(payload.role_title, 200),
    company: sanitize(payload.company, 200),
    location: sanitize(payload.location, 200),
    avatar_file_id: sanitize(payload.avatar_file_id, 100),
    cover_file_id: sanitize(payload.cover_file_id, 100),
    linkedin_url: sanitize(payload.linkedin_url, 500),
    github_url: sanitize(payload.github_url, 500),
    website_url: sanitize(payload.website_url, 500),
    status: payload.status === "archived" ? "archived" : "active",
    user_id: sanitize(payload.user_id, 100),
    preferred_stack: sanitize(payload.preferred_stack, 200),
    favorite_topic: sanitize(payload.favorite_topic, 200),
    tag_ids: (payload.tag_ids ?? []).slice(0, 30).map((t) => sanitize(t, 100))
  };
  const createdAt = new Date().toISOString();
  const dataWithLevel = {
    ...data,
    level: calculateLevelScore(cleanLevelInput(data, createdAt), []).level
  };

  const row = await adminTables().createRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: ID.unique(),
    data: dataWithLevel,
    permissions: attendeePermissions(data.user_id)
  });
  await recomputeAttendeeLevel(row.$id);
  await syncUserName(data.user_id, name, u.id);
  revalidatePath("/dex");
  revalidatePath("/admin");
  return { ok: true, slug: (row as unknown as { slug: string }).slug };
}

export async function updateAttendee(payload: AttendeeFormPayload): Promise<SaveAttendeeResult> {
  if (!payload.id) return { ok: false, error: "Missing attendee id." };
  const gate = await canEditAttendee(payload.id);
  if (!gate.allowed) return { ok: false, error: "Not allowed." };

  const dbx = adminTables();
  const existing = (await dbx.getRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: payload.id
  })) as unknown as {
    slug: string;
  };

  const requestedSlug = slugify(payload.slug || payload.name);
  const slug =
    requestedSlug && requestedSlug !== existing.slug
      ? await ensureUniqueSlug(requestedSlug, payload.id)
      : existing.slug;

  const update: Record<string, unknown> = {
    name: sanitize(payload.name, 200).trim() || (existing as unknown as { name: string }).name,
    slug,
    bio: sanitizeMultiline(payload.bio, 4000),
    role_title: sanitize(payload.role_title, 200),
    company: sanitize(payload.company, 200),
    location: sanitize(payload.location, 200),
    avatar_file_id: sanitize(payload.avatar_file_id, 100),
    cover_file_id: sanitize(payload.cover_file_id, 100),
    linkedin_url: sanitize(payload.linkedin_url, 500),
    github_url: sanitize(payload.github_url, 500),
    website_url: sanitize(payload.website_url, 500),
    preferred_stack: sanitize(payload.preferred_stack, 200),
    favorite_topic: sanitize(payload.favorite_topic, 200),
    tag_ids: (payload.tag_ids ?? []).slice(0, 30).map((t) => sanitize(t, 100))
  };

  // Only organizers may change status or user_id.
  if (gate.isOrganizer) {
    update.status = payload.status === "archived" ? "archived" : "active";
    update.user_id = sanitize(payload.user_id, 100);
  }

  await dbx.updateRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: payload.id,
    data: update
  });
  await syncUserName(
    gate.isOrganizer ? (update.user_id as string) : gate.userId ?? undefined,
    update.name as string,
    gate.userId ?? ""
  );

  // Keep per-row update permission in sync with user_id changes.
  if (gate.isOrganizer) {
    const newUserId = update.user_id as string;
    await dbx.updateRow({
      databaseId: db,
      tableId: TABLES.attendees,
      rowId: payload.id,
      data: {},
      permissions: attendeePermissions(newUserId)
    });
  }
  await recomputeAttendeeLevel(payload.id);

  revalidatePath("/dex");
  revalidatePath("/admin");
  revalidatePath("/profile");
  revalidatePath(`/attendees/${slug}`);
  return { ok: true, slug };
}

export async function archiveAttendee(id: string): Promise<{ ok: boolean; error?: string }> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };
  await adminTables().updateRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: id,
    data: { status: "archived" }
  });
  revalidatePath("/dex");
  revalidatePath("/admin");
  return { ok: true };
}

export async function mergeAttendees(
  sourceId: string,
  targetId: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };
  if (!sourceId || !targetId || sourceId === targetId) {
    return { ok: false, error: "Invalid ids." };
  }
  const dbx = adminTables();
  const src = (await dbx.getRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: sourceId
  })) as unknown as {
    tag_ids?: string[];
  };
  const tgt = (await dbx.getRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: targetId
  })) as unknown as {
    tag_ids?: string[];
  };

  // Merge tag arrays (dedupe).
  const mergedTags = Array.from(new Set([...(tgt.tag_ids ?? []), ...(src.tag_ids ?? [])]));
  await dbx.updateRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: targetId,
    data: { tag_ids: mergedTags }
  });

  // Move attendee_badges from source -> target (dedupe by badge_id).
  const links = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    queries: [Query.equal("attendee_id", [sourceId, targetId]), Query.limit(500)]
  });
  const seen = new Set<string>();
  for (const l of links.rows) {
    const link = l as unknown as { $id: string; attendee_id: string; badge_id: string };
    if (link.attendee_id === targetId) {
      seen.add(link.badge_id);
    }
  }
  for (const l of links.rows) {
    const link = l as unknown as { $id: string; attendee_id: string; badge_id: string };
    if (link.attendee_id !== sourceId) continue;
    if (seen.has(link.badge_id)) {
      await dbx.deleteRow({
        databaseId: db,
        tableId: TABLES.attendee_badges,
        rowId: link.$id
      });
    } else {
      await dbx.updateRow({
        databaseId: db,
        tableId: TABLES.attendee_badges,
        rowId: link.$id,
        data: { attendee_id: targetId }
      });
      seen.add(link.badge_id);
    }
  }

  await dbx.updateRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: sourceId,
    data: { status: "archived" }
  });
  await recomputeAttendeeLevel(targetId);
  revalidatePath("/dex");
  revalidatePath("/admin");
  return { ok: true };
}

// ===== Tags =====

const TAG_TYPES = new Set(["skill", "interest", "industry", "topic"]);

export interface CreateTagResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface DeleteTagResult {
  ok: boolean;
  error?: string;
}

export async function createTag(formData: FormData): Promise<CreateTagResult> {
  try {
    const u = await getCurrentUser();
    if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };

    const name = sanitize(formData.get("name"), 100).trim();
    if (!name) return { ok: false, error: "Name is required." };

    const rawType = sanitize(formData.get("type"), 16).trim();
    const type = (TAG_TYPES.has(rawType) ? rawType : "skill") as TagType;

    const dbx = adminTables();
    const existing = await dbx.listRows({
      databaseId: db,
      tableId: TABLES.tags,
      queries: [Query.equal("name", name), Query.limit(1)]
    });
    if (existing.rows[0]) {
      revalidatePath("/admin/tags");
      return { ok: true, id: existing.rows[0].$id };
    }

    const row = await dbx.createRow({
      databaseId: db,
      tableId: TABLES.tags,
      rowId: ID.unique(),
      data: { name, type }
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/tags");
    revalidatePath("/dex");
    revalidatePath("/profile/setup");
    return { ok: true, id: row.$id };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to create tag." };
  }
}

export async function deleteTag(tagId: string): Promise<DeleteTagResult> {
  try {
    const u = await getCurrentUser();
    if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };

    const id = sanitize(tagId, 100).trim();
    if (!id) return { ok: false, error: "Missing tag id." };

    const dbx = adminTables();
    while (true) {
      const attendees = await dbx.listRows({
        databaseId: db,
        tableId: TABLES.attendees,
        queries: [Query.contains("tag_ids", id), Query.limit(100)]
      });

      for (const row of attendees.rows) {
        const attendee = row as unknown as { $id: string; slug?: string; tag_ids?: string[] };
        const nextTags = Array.isArray(attendee.tag_ids)
          ? attendee.tag_ids.filter((tag) => tag !== id)
          : [];
        await dbx.updateRow({
          databaseId: db,
          tableId: TABLES.attendees,
          rowId: attendee.$id,
          data: { tag_ids: nextTags }
        });
        await recomputeAttendeeLevel(attendee.$id);
        if (attendee.slug) revalidatePath(`/attendees/${attendee.slug}`);
      }

      if (attendees.rows.length < 100) break;
    }

    await dbx.deleteRow({
      databaseId: db,
      tableId: TABLES.tags,
      rowId: id
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/tags");
    revalidatePath("/dex");
    revalidatePath("/profile");
    revalidatePath("/profile/setup");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to delete tag." };
  }
}

// ===== Meetups =====

export interface CreateMeetupResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createMeetup(formData: FormData): Promise<CreateMeetupResult> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };

  const title = sanitize(formData.get("title"), 200).trim();
  const description = sanitizeMultiline(formData.get("description"), 4000).trim();
  const date = sanitize(formData.get("date"), 10).trim();
  const externalUrl = sanitize(formData.get("external_url"), 500).trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Enter a valid event date." };
  }
  if (externalUrl && !/^https?:\/\/\S+$/i.test(externalUrl)) {
    return { ok: false, error: "External URL must start with http:// or https://." };
  }

  const row = await adminTables().createRow({
    databaseId: db,
    tableId: TABLES.events,
    rowId: ID.unique(),
    data: {
      title,
      description,
      date,
      external_url: externalUrl
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true, id: row.$id };
}

export async function updateMeetup(formData: FormData): Promise<CreateMeetupResult> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };

  const id = sanitize(formData.get("id"), 100).trim();
  const title = sanitize(formData.get("title"), 200).trim();
  const description = sanitizeMultiline(formData.get("description"), 4000).trim();
  const date = sanitize(formData.get("date"), 10).trim();
  const externalUrl = sanitize(formData.get("external_url"), 500).trim();

  if (!id) return { ok: false, error: "Missing event id." };
  if (!title) return { ok: false, error: "Title is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Enter a valid event date." };
  }
  if (externalUrl && !/^https?:\/\/\S+$/i.test(externalUrl)) {
    return { ok: false, error: "External URL must start with http:// or https://." };
  }

  await adminTables().updateRow({
    databaseId: db,
    tableId: TABLES.events,
    rowId: id,
    data: {
      title,
      description,
      date,
      external_url: externalUrl
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { ok: true, id };
}

// ===== Badges =====

const RARITIES = new Set(["common", "rare", "epic", "legendary"]);

export interface CreateBadgeResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createBadge(formData: FormData): Promise<CreateBadgeResult> {
  try {
    const u = await getCurrentUser();
    if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };

    const name = sanitize(formData.get("name"), 100).trim();
    if (!name) return { ok: false, error: "Name is required." };
    const description = sanitize(formData.get("description"), 500).trim();
    const icon = sanitize(formData.get("icon"), 50).trim();
    const rarityRaw = sanitize(formData.get("rarity"), 16);
    const rarity = RARITIES.has(rarityRaw) ? rarityRaw : "common";

    const dbx = adminTables();

    // Idempotent on name; lets organizers re-run the Speaker seed without dupes.
    const existing = await dbx.listRows({
      databaseId: db,
      tableId: TABLES.badges,
      queries: [Query.equal("name", name), Query.limit(1)]
    });
    if (existing.rows[0]) {
      revalidatePath("/admin/badges");
      return { ok: true, id: existing.rows[0].$id };
    }

    const row = await dbx.createRow({
      databaseId: db,
      tableId: TABLES.badges,
      rowId: ID.unique(),
      data: {
        name,
        description,
        icon,
        rarity
      }
    });
    revalidatePath("/admin");
    revalidatePath("/admin/badges");
    return { ok: true, id: row.$id };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Failed to create badge." };
  }
}

export async function seedSpeakerBadge(): Promise<CreateBadgeResult> {
  const fd = new FormData();
  fd.set("name", "Speaker");
  fd.set("description", "Took the stage at a Doon Tech Community event.");
  fd.set("icon", "🎤");
  fd.set("rarity", "epic");
  return createBadge(fd);
}

export async function assignBadgeToAttendee(
  attendeeId: string,
  badgeId: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };
  if (!attendeeId || !badgeId) return { ok: false, error: "Missing ids." };

  const dbx = adminTables();
  const dup = await dbx.listRows({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    queries: [
      Query.equal("attendee_id", attendeeId),
      Query.equal("badge_id", badgeId),
      Query.limit(1)
    ]
  });
  if (dup.rows[0]) {
    await recomputeAttendeeLevel(attendeeId);
    return { ok: true };
  }

  await dbx.createRow({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    rowId: ID.unique(),
    data: {
      attendee_id: attendeeId,
      badge_id: badgeId,
      awarded_at: new Date().toISOString()
    }
  });
  await recomputeAttendeeLevel(attendeeId);

  // Find slug to revalidate the public page.
  try {
    const a = (await dbx.getRow({
      databaseId: db,
      tableId: TABLES.attendees,
      rowId: attendeeId
    })) as unknown as {
      slug?: string;
    };
    if (a.slug) revalidatePath(`/attendees/${a.slug}`);
  } catch {
    /* ignore */
  }
  revalidatePath("/dex");
  revalidatePath("/admin");
  return { ok: true };
}

export async function unassignAttendeeBadge(
  attendeeBadgeId: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) return { ok: false, error: "Not allowed." };
  const dbx = adminTables();
  let slug: string | undefined;
  let attendeeId: string | undefined;
  try {
    const link = (await dbx.getRow({
      databaseId: db,
      tableId: TABLES.attendee_badges,
      rowId: attendeeBadgeId
    })) as unknown as { attendee_id?: string };
    attendeeId = link.attendee_id;
    if (link.attendee_id) {
      const a = (await dbx.getRow({
        databaseId: db,
        tableId: TABLES.attendees,
        rowId: link.attendee_id
      })) as unknown as { slug?: string };
      slug = a.slug;
    }
  } catch {
    /* ignore */
  }
  await dbx.deleteRow({
    databaseId: db,
    tableId: TABLES.attendee_badges,
    rowId: attendeeBadgeId
  });
  if (attendeeId) await recomputeAttendeeLevel(attendeeId);
  if (slug) revalidatePath(`/attendees/${slug}`);
  revalidatePath("/dex");
  revalidatePath("/admin");
  return { ok: true };
}

// ===== Photo upload =====

export interface UploadAvatarResult {
  ok: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const u = await getCurrentUser();
  if (!u) return { ok: false, error: "Sign in to upload." };
  const file = formData.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "No file provided." };
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_BYTES) return { ok: false, error: "File too large (max 5 MB)." };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: "Unsupported file type." };

  const buf = Buffer.from(await file.arrayBuffer());
  const created = await adminStorage().createFile({
    bucketId: APPWRITE_BUCKET_AVATARS,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(buf, file.name || "avatar")
  });
  return {
    ok: true,
    fileId: created.$id,
    url: `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_AVATARS}/files/${created.$id}/view?project=${APPWRITE_PROJECT_ID}`
  };
}

// ===== Self-claim =====

// Link the logged-in user to an existing attendee profile (organizer-only path
// is via updateAttendee.user_id; self-claim path is here).
export async function claimAttendee(
  attendeeId: string
): Promise<{ ok: boolean; error?: string }> {
  const u = await getCurrentUser();
  if (!u) return { ok: false, error: "Sign in first." };
  const dbx = adminTables();
  const row = (await dbx.getRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: attendeeId
  })) as unknown as {
    user_id?: string;
  };
  if (row.user_id && row.user_id !== u.id) {
    return { ok: false, error: "This profile is already claimed." };
  }
  await dbx.updateRow({
    databaseId: db,
    tableId: TABLES.attendees,
    rowId: attendeeId,
    data: { user_id: u.id },
    permissions: attendeePermissions(u.id)
  });
  revalidatePath("/admin");
  return { ok: true };
}
