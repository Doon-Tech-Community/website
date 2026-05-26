import "server-only";
import { cookies } from "next/headers";
import { Account, Client, Storage, TablesDB, Users } from "node-appwrite";

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const APPWRITE_ENDPOINT = env("NEXT_PUBLIC_APPWRITE_ENDPOINT");
export const APPWRITE_PROJECT_ID = env("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
export const APPWRITE_DATABASE_ID = env("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
export const APPWRITE_BUCKET_AVATARS = env("NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS");
export const SESSION_COOKIE = `a_session_${APPWRITE_PROJECT_ID}`;
export const LEGACY_SESSION_COOKIE = "appwrite-session";

export const COLLECTIONS = {
  attendees: "attendees",
  tags: "tags",
  meetups: "meetups",
  badges: "badges",
  attendee_badges: "attendee_badges",
  featured: "featured"
} as const;

function baseClient(): Client {
  return new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

function sessionCookieValue(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
}

// Client tied to the current request's user session cookie.
// Use for "act as the logged-in user" — reads from public collections work
// without a session; writes require organizer label or matching document
// permissions.
export function sessionClient(): Client {
  const client = baseClient();
  const session = sessionCookieValue();
  if (session) client.setSession(session);
  return client;
}

// Admin client using the project API key. Use only for operations that the
// session client can't do (creating accounts pre-login, reading other users'
// labels, etc.) — never expose the API key to the browser.
export function adminClient(): Client {
  return baseClient().setKey(env("APPWRITE_API_KEY"));
}

export function sessionAccount() {
  return new Account(sessionClient());
}

export function adminAccount() {
  return new Account(adminClient());
}

export function sessionTables() {
  return new TablesDB(sessionClient());
}

export function sessionStorage() {
  return new Storage(sessionClient());
}

export function adminUsers() {
  return new Users(adminClient());
}

export function adminTables() {
  return new TablesDB(adminClient());
}

export function adminStorage() {
  return new Storage(adminClient());
}

export function avatarUrl(fileId: string, size?: number): string {
  if (!fileId) return "";
  const base = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_AVATARS}/files/${fileId}`;
  if (!size) {
    return `${base}/view?project=${APPWRITE_PROJECT_ID}`;
  }
  const px = size * 2;
  const params = new URLSearchParams({
    project: APPWRITE_PROJECT_ID,
    width: String(px),
    height: String(px),
    gravity: "center",
    quality: "85",
    output: "webp"
  });
  return `${base}/preview?${params.toString()}`;
}
