"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import BadgePill from "@/components/BadgePill";
import { createBadge, seedSpeakerBadge } from "@/lib/actions";
import type { Badge, Rarity } from "@/lib/types";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

export default function BadgesAdmin({
  badges,
  hasSpeaker
}: {
  badges: Badge[];
  hasSpeaker: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [rarity, setRarity] = useState<Rarity>("common");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("icon", icon);
    fd.set("rarity", rarity);
    start(async () => {
      try {
        const r = await createBadge(fd);
        if (!r.ok) {
          setError(r.error || "Failed to create badge.");
          return;
        }
        setName("");
        setDescription("");
        setIcon("");
        setRarity("common");
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Failed to create badge.");
      }
    });
  }

  function seed() {
    setError(null);
    start(async () => {
      try {
        const r = await seedSpeakerBadge();
        if (!r.ok) {
          setError(r.error || "Failed to seed badge.");
          return;
        }
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Failed to seed badge.");
      }
    });
  }

  return (
    <>
      {!hasSpeaker && (
        <section className="card-frame rounded-2xl p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-2">
            Get started
          </h2>
          <p className="text-sm text-inkSoft mb-3">
            The Speaker badge is our first reward — award it to anyone who&apos;s taken the stage
            at a DTC event.
          </p>
          <button onClick={seed} disabled={pending} className="btn btn-primary">
            {pending ? "Seeding…" : "🎤 Seed Speaker badge"}
          </button>
        </section>
      )}

      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Badges ({badges.length})
        </h2>
        {badges.length === 0 ? (
          <p className="text-sm text-inkSoft">No badges yet. Create your first one below.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {badges.map((b) => (
              <li key={b.id} className="py-2 flex items-start gap-3">
                <div className="text-2xl leading-none w-8 text-center" aria-hidden>
                  {b.icon || "🏅"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{b.name}</span>
                    <BadgePill name={b.rarity} rarity={b.rarity} />
                  </div>
                  {b.description && (
                    <p className="text-sm text-slate-300 mt-0.5">{b.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-frame rounded-2xl p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate-300 font-semibold mb-3">
          Create a new badge
        </h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="label">Name *</span>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Icon (emoji)</span>
            <input
              className="input"
              value={icon}
              maxLength={8}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🏆"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="label">Description</span>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this badge celebrate?"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Rarity</span>
            <select
              className="input"
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity)}
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="md:col-span-2 chip chip-legendary">{error}</div>}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={pending || !name.trim()} className="btn btn-primary">
              {pending ? "Saving…" : "Create badge"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
