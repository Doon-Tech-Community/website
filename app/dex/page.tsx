import Link from "next/link";
import { Suspense } from "react";
import AttendeeCard from "@/components/AttendeeCard";
import FiltersBar from "@/components/FiltersBar";
import { listAllTags, listAttendees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pokédex",
  description: "Browse every developer in the Doon Tech Community.",
  alternates: { canonical: "/dex" }
};

interface PageProps {
  searchParams: { [k: string]: string | string[] | undefined };
}

function toArr(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function DexPage({ searchParams }: PageProps) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const tag = toArr(searchParams.tag);
  const sort = (typeof searchParams.sort === "string" ? searchParams.sort : "name") as
    | "name"
    | "level"
    | "recent";
  const page = Number(searchParams.page) || 1;

  const [{ items, total, pageSize }, tags] = await Promise.all([
    listAttendees({ q, tag, sort, page, pageSize: 24 }),
    listAllTags()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qp = new URLSearchParams();
  if (q) qp.set("q", q);
  tag.forEach((t) => qp.append("tag", t));
  if (sort !== "name") qp.set("sort", sort);

  return (
    <div className="dex-page pt-8 flex flex-col gap-6">
      <header className="dex-page__header flex flex-col gap-2">
        <div className="dex-page__eyebrow flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-accent pixel">
          <span aria-hidden>►</span> Doon Tech Community
        </div>
        <h1 className="dex-page__title text-xl sm:text-2xl pixel">THE POKÉDEX</h1>
        <p className="hidden sm:block max-w-2xl">
          A collectible developer index for every face in the Doon Tech Community. Browse profiles, scan skills, and remember the developers you meet at events.
        </p>
      </header>

      <Suspense>
        <FiltersBar tags={tags} />
      </Suspense>

      <div className="dex-page__meta flex items-center justify-between text-sm text-inkSoft">
        <span>{total} attendee{total === 1 ? "" : "s"}</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {items.length === 0 ? (
        <div className="card-frame rounded-2xl p-10 text-center">
          <p className="text-lg font-semibold mb-2">No attendees match your filters.</p>
          <p className="text-sm text-inkSoft">Try clearing filters or check back after the next event.</p>
        </div>
      ) : (
        <ul className="attendee-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((a) => (
            <li key={a.id}>
              <AttendeeCard a={a} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Pagination">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const params = new URLSearchParams(qp);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/dex?${params.toString()}`}
                aria-current={p === page ? "page" : undefined}
                className={"chip cursor-pointer " + (p === page ? "!text-white" : "")}
                style={p === page ? { background: "linear-gradient(180deg,#8FDBF8,#1E78A8)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.25), 0 0 0 1px #0B3950, 0 1px 0 rgba(0,0,0,0.2)" } : undefined}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
