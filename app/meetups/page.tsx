import { listAllMeetups } from "@/lib/queries";

export const metadata = {
  title: "Meetups",
  description: "All Doon Tech Community meetups.",
  alternates: { canonical: "/meetups" }
};

export const dynamic = "force-dynamic";

export default async function MeetupsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const meetups = await listAllMeetups();
  return (
    <div className="pt-8 flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Meetups</h1>
        <p className="text-inkSoft">Every Doon Tech Community gathering, past and upcoming.</p>
      </header>
      <section className="card-frame rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <h2 className="pixel text-sm">SUBSCRIBE TO EVENT CALENDAR</h2>
          <p className="text-sm text-inkSoft mt-1">
            Get every upcoming Doon Tech Community meetup straight in your calendar via Luma.
          </p>
        </div>
        <a
          href="https://luma.com/doon-tech-community"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ fontSize: "0.65rem" }}
        >
          SUBSCRIBE ON LUMA
        </a>
      </section>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {meetups.map((m) => {
          const upcoming = m.date >= today;
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold">{m.title}</h2>
                <span className={"chip " + (upcoming ? "chip-epic" : "chip-success")}>
                  {upcoming ? "upcoming" : "completed"}
                </span>
              </div>
              <p className="text-sm text-inkSoft mt-1">{m.date}</p>
              <p className="text-sm mt-2 line-clamp-2">{m.description}</p>
              {m.external_url && <p className="text-xs text-accent mt-3 pixel">Open event ↗</p>}
            </>
          );
          return (
            <li key={m.id}>
              {m.external_url ? (
                <a
                  href={m.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-frame rounded-2xl p-5 block"
                >
                  {body}
                </a>
              ) : (
                <div className="card-frame rounded-2xl p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
