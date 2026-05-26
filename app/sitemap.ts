import type { MetadataRoute } from "next";
import { Query } from "node-appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS, sessionTables } from "@/lib/appwrite";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/dex`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/meetups`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }
  ];

  const res = await sessionTables().listRows({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: COLLECTIONS.attendees,
    queries: [Query.equal("status", "active"), Query.limit(500)]
  });
  const attendees: MetadataRoute.Sitemap = res.rows.map((d) => ({
    url: `${base}/attendees/${(d as unknown as { slug: string }).slug}`,
    lastModified: new Date(d.$updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  return [...staticRoutes, ...attendees];
}
