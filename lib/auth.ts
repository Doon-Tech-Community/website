import "server-only";
import { cache } from "react";
import { sessionAccount } from "./appwrite";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  labels: string[];
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const user = await sessionAccount().get();
    return {
      id: user.$id,
      email: user.email,
      name: user.name,
      labels: user.labels ?? []
    };
  } catch {
    return null;
  }
});

export async function isOrganizer(): Promise<boolean> {
  const u = await getCurrentUser();
  return !!u && u.labels.includes("organizer");
}

export async function requireOrganizer(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u || !u.labels.includes("organizer")) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return u;
}
