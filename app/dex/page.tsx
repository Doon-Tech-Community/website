import { Suspense } from "react";
import FiltersBar from "@/components/FiltersBar";
import InfiniteAttendeeList from "@/components/InfiniteAttendeeList";
import { listAllBadges, listAttendees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pokédex",
  description: "Browse every developer in the Doon Tech Community.",
  alternates: { canonical: "/dex" }
};

interface PageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

function toArr(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function DexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const badge = toArr(sp.badge);
  const sort = (typeof sp.sort === "string" ? sp.sort : "name") as "name" | "recent";

  const [{ items, total, nextCursor }, badges] = await Promise.all([
    listAttendees({ q, badge, sort, pageSize: 24 }),
    listAllBadges()
  ]);

  // Reset the client list when filters change so it doesn't keep stale items.
  const listKey = JSON.stringify({ q, badge, sort });

  return (
    <div className="dex-page pt-4 sm:pt-5 flex flex-col gap-4">
      <header className="dex-page__header flex flex-col gap-1.5">
        <div className="dex-page__eyebrow flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-accent pixel">
          <span aria-hidden>►</span> Doon Tech Community
        </div>
        <h1 className="dex-page__title text-lg sm:text-xl xl:text-2xl pixel">THE POKÉDEX</h1>
        <p className="hidden sm:block max-w-3xl text-sm xl:text-base">
          A collectible developer index for every face in the Doon Tech Community. Browse profiles, scan skills, and remember the developers you meet at events.
        </p>
      </header>

      <Suspense>
        <FiltersBar badges={badges} />
      </Suspense>

      <div className="dex-page__meta flex items-center justify-between text-sm text-inkSoft">
        <span>{total} attendee{total === 1 ? "" : "s"}</span>
      </div>

      <InfiniteAttendeeList
        key={listKey}
        initialItems={items}
        initialCursor={nextCursor}
        q={q}
        badge={badge}
        sort={sort}
      />
    </div>
  );
}
