import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import AttendeeCard from "@/components/AttendeeCard";
import BadgePill from "@/components/BadgePill";
import TagChip from "@/components/TagChip";
import { avatarUrl } from "@/lib/appwrite";
import { calculateLevelScore } from "@/lib/levels";
import {
  badgesForAttendee,
  getAttendeeBySlug,
  relatedAttendees,
  tagsForAttendee
} from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const a = await getAttendeeBySlug(params.slug);
  if (!a) return { title: "Attendee not found" };
  const desc = `${a.role_title}${a.company ? ` @ ${a.company}` : ""} · ${a.location}. ${a.bio}`.slice(0, 200);
  const ogUrl = `/og?slug=${encodeURIComponent(a.slug)}`;
  return {
    title: a.name,
    description: desc,
    openGraph: {
      title: `${a.name} · DTC Pokedex`,
      description: desc,
      url: `/attendees/${a.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: a.name }]
    },
    twitter: { card: "summary_large_image", title: a.name, description: desc, images: [ogUrl] },
    alternates: { canonical: `/attendees/${a.slug}` }
  };
}

export default async function AttendeePage({ params }: PageProps) {
  const a = await getAttendeeBySlug(params.slug);
  if (!a) notFound();

  const [tags, badges, related] = await Promise.all([
    tagsForAttendee(a),
    badgesForAttendee(a.id),
    relatedAttendees(a)
  ]);
  const avatar = avatarUrl(a.avatar_file_id, 120);
  const level = calculateLevelScore(a, badges.map((b) => b.rarity)).level;

  return (
    <article className="pt-8 flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
        <Link href="/dex" className="hover:text-white">
          ← Back to Pokedex
        </Link>
      </nav>

      <header className="card-frame rounded-3xl overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-br from-accent/30 via-badge/20 to-highlight/20" />
        <div className="p-6 flex flex-col md:flex-row gap-6 -mt-12">
          <div className="shrink-0">
            <Avatar name={a.name} url={avatar} size={120} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{a.name}</h1>
              {a.status === "archived" && <span className="chip chip-legendary">Archived</span>}
            </div>
            <p className="text-slate-300 mt-1">
              {a.role_title}
              {a.company && <span className="text-slate-400"> · {a.company}</span>}
            </p>
            <p className="text-slate-400 text-sm">{a.location}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 self-start md:self-center">
            <Stat label="Level" value={level} />
            <Stat label="Badges" value={badges.length} />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {a.bio && (
            <Section title="Bio">
              <p className="text-slate-200 whitespace-pre-wrap">{a.bio}</p>
            </Section>
          )}

          <Section title="Developer card">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Preferred stack" value={a.preferred_stack || "—"} />
              <Field label="Favorite topic" value={a.favorite_topic || "—"} />
              <Field label="Company" value={a.company || "—"} />
              <Field label="Location" value={a.location || "—"} />
            </dl>
          </Section>
        </div>

        <aside className="flex flex-col gap-6">
          <Section title="Badges">
            {badges.length === 0 ? (
              <p className="text-slate-400 text-sm">No badges yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <li key={b!.id}>
                    <BadgePill name={b!.name} rarity={b!.rarity} description={b!.description} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Links">
            <ul className="flex flex-col gap-2 text-sm">
              {a.linkedin_url && <li><LinkRow label="LinkedIn" href={a.linkedin_url} /></li>}
              {a.github_url && <li><LinkRow label="GitHub" href={a.github_url} /></li>}
              {a.website_url && <li><LinkRow label="Website" href={a.website_url} /></li>}
              {!a.linkedin_url && !a.github_url && !a.website_url && (
                <li className="text-slate-400">No links added.</li>
              )}
            </ul>
          </Section>

          {related.length > 0 && (
            <Section title="Related attendees">
              <ul className="grid grid-cols-1 gap-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <AttendeeCard a={r} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
      </section>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-block rounded-xl px-4 py-3 text-center min-w-[80px]">
      <div className="text-xs uppercase tracking-wider text-slate-300">{label}</div>
      <div className="text-2xl font-bold text-accent">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-frame rounded-2xl p-5">
      <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}
function LinkRow({ label, href }: { label: string; href: string }) {
  const display = formatLinkDisplay(label, href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer me"
      className="flex items-center justify-between gap-3 hover:text-accent"
    >
      <span>{label}</span>
      <span className="text-slate-400 truncate max-w-[12rem] text-right">{display}</span>
    </a>
  );
}

function formatLinkDisplay(label: string, href: string): string {
  if (label === "LinkedIn") {
    const handle = extractLinkedInHandle(href);
    if (handle) return `/in/${handle}`;
  }

  if (label === "GitHub") {
    const handle = extractGitHubHandle(href);
    if (handle) return `@${handle}`;
  }

  return compactUrl(href);
}

function extractLinkedInHandle(href: string): string {
  const url = parseUrl(href);
  const segments = pathSegments(url?.pathname ?? href);
  const inIndex = segments.findIndex((segment) => segment.toLowerCase() === "in");
  return inIndex >= 0 ? segments[inIndex + 1] ?? "" : "";
}

function extractGitHubHandle(href: string): string {
  const url = parseUrl(href);
  const segments = pathSegments(url?.pathname ?? href);
  const handle = segments[0] ?? "";
  const reserved = new Set(["features", "login", "marketplace", "orgs", "settings", "topics", "users"]);
  return handle && !reserved.has(handle.toLowerCase()) ? handle : "";
}

function compactUrl(href: string): string {
  const url = parseUrl(href);
  if (!url) return href.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${host}${path}`;
}

function parseUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    try {
      return new URL(`https://${href}`);
    } catch {
      return null;
    }
  }
}

function pathSegments(path: string): string[] {
  return path
    .replace(/^https?:\/\/[^/]+/i, "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}
