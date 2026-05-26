import Link from "next/link";
import { countActiveAttendees, countMeetups } from "@/lib/queries";

export const metadata = {
  title: "Welcome",
  description: "The Doon Tech Community - a Pokedex of the people building in the hills.",
  alternates: { canonical: "/" }
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [attendees, meetups] = await Promise.all([
    countActiveAttendees(),
    countMeetups()
  ]);

  return (
    <div className="landing pt-6 sm:pt-10 pb-4 flex flex-col items-center text-center gap-6">
      <div className="pixel text-[0.55rem] sm:text-[0.65rem] tracking-[0.3em] text-accent flex items-center gap-2">
        <span className="led led-grn" aria-hidden /> SYSTEM READY
      </div>

      <h1 className="pixel text-base sm:text-xl leading-relaxed">
        DOON&nbsp;TECH<br />COMMUNITY
      </h1>

      <p className="max-w-xl text-base sm:text-lg" style={{ fontFamily: "'VT323', monospace" }}>
        A community-built Pokedex for the people shaping tech in Dehradun and the hills.
        Scan developers, track meetups, remember the faces you meet in real life.
      </p>

      <dl className="grid grid-cols-2 gap-3 max-w-md w-full">
        <Stat label="Developers" value={attendees} />
        <Stat label="Meetups" value={meetups} />
      </dl>

      <Link
        href="/dex"
        data-action="enter"
        className="btn btn-primary"
        style={{ fontSize: "0.7rem", padding: "0.85rem 1.4rem" }}
      >
        ENTER POKEDEX
      </Link>

      <div className="pixel text-[0.55rem] text-inkSoft mt-2 flex items-center justify-center gap-2">
        <span>CLICK</span>
        <span className="a-button-icon" aria-label="A button">A</span>
        <span>BELOW TO START</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-block text-center">
      <div className="pixel text-[0.55rem] text-inkSoft mb-1">{label}</div>
      <div className="text-2xl font-bold text-accent" style={{ fontFamily: "'VT323', monospace" }}>
        {value}
      </div>
    </div>
  );
}
