"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Sort = "name" | "level" | "recent";
const SORTS: Sort[] = ["name", "level", "recent"];

export default function DeviceControls() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [muted, setMuted] = useState(true);

  const onDex = pathname === "/dex";
  const onLanding = pathname === "/";

  useEffect(() => {
    try {
      setMuted(localStorage.getItem("dtc-sound-muted") !== "0");
    } catch {}
    function onChange(e: Event) {
      const ce = e as CustomEvent<{ muted: boolean }>;
      if (ce.detail) setMuted(ce.detail.muted);
    }
    window.addEventListener("dtc:sound-changed", onChange);
    return () => window.removeEventListener("dtc:sound-changed", onChange);
  }, []);

  const patchSearch = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) params.delete(k);
        else params.set(k, v);
      }
      router.replace(`/dex?${params.toString()}`, { scroll: false });
    },
    [router, sp]
  );

  const currentPage = Math.max(1, Number(sp.get("page") || 1));
  const currentSort = (sp.get("sort") as Sort) || "name";

  const prevPage = useCallback(() => {
    if (!onDex) return;
    const next = Math.max(1, currentPage - 1);
    patchSearch({ page: next === 1 ? null : String(next) });
  }, [onDex, currentPage, patchSearch]);

  const nextPage = useCallback(() => {
    if (!onDex) return;
    patchSearch({ page: String(currentPage + 1) });
  }, [onDex, currentPage, patchSearch]);

  const cycleSort = useCallback(
    (dir: 1 | -1) => {
      if (!onDex) return;
      const idx = SORTS.indexOf(currentSort);
      const next = SORTS[(idx + dir + SORTS.length) % SORTS.length];
      patchSearch({ sort: next === "name" ? null : next, page: null });
    },
    [onDex, currentSort, patchSearch]
  );

  const onAction = useCallback(async () => {
    if (onLanding) {
      router.push("/dex");
      return;
    }
    if (onDex) {
      try {
        const res = await fetch("/api/attendees?pageSize=500", { cache: "no-store" });
        const list: { slug: string }[] = await res.json();
        if (list.length) {
          const pick = list[Math.floor(Math.random() * list.length)];
          router.push(`/attendees/${pick.slug}`);
        }
      } catch {}
      return;
    }
    router.push("/dex");
  }, [onLanding, onDex, router]);

  const onPower = useCallback(() => {
    if (onLanding) return;
    router.push("/");
  }, [onLanding, router]);

  const toggleSound = useCallback(() => {
    window.dispatchEvent(new CustomEvent("dtc:sound-toggle"));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      // If the user is focused on an interactive element, let the browser handle
      // Enter (and the actionable letters) naturally — don't hijack.
      const onInteractive = !!target?.closest('button, a, [role="button"]');
      switch (e.key) {
        case "ArrowLeft":  if (onDex) { e.preventDefault(); prevPage(); } break;
        case "ArrowRight": if (onDex) { e.preventDefault(); nextPage(); } break;
        case "ArrowUp":    if (onDex) { e.preventDefault(); cycleSort(-1); } break;
        case "ArrowDown":  if (onDex) { e.preventDefault(); cycleSort(1); } break;
        case "a":
        case "A":          if (!onInteractive) { e.preventDefault(); onAction(); } break;
        case "Enter":      if (!onInteractive) { e.preventDefault(); onAction(); } break;
        case "m":
        case "M":          if (!onInteractive) { e.preventDefault(); toggleSound(); } break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDex, prevPage, nextPage, cycleSort, onAction, toggleSound]);

  const dpadDisabled = !onDex;
  const sortLabel = currentSort.toUpperCase();

  return (
    <div className="device-controls flex items-center justify-between mt-5 gap-4">
      {/* D-pad */}
      <div className="device-controls__left flex items-center gap-3">
        <div className="dpad" role="group" aria-label="Pokédex navigation">
          <button
            type="button"
            className="dpad-btn dpad-up"
            disabled={dpadDisabled}
            onClick={() => cycleSort(-1)}
            aria-label="Previous sort order"
            title="Previous sort order"
          >
            <span aria-hidden>▲</span>
          </button>
          <button
            type="button"
            className="dpad-btn dpad-left"
            disabled={dpadDisabled}
            onClick={prevPage}
            aria-label="Previous page"
            title="Previous page"
          >
            <span aria-hidden>◀</span>
          </button>
          <span className="dpad-hub" aria-hidden />
          <button
            type="button"
            className="dpad-btn dpad-right"
            disabled={dpadDisabled}
            onClick={nextPage}
            aria-label="Next page"
            title="Next page"
          >
            <span aria-hidden>▶</span>
          </button>
          <button
            type="button"
            className="dpad-btn dpad-down"
            disabled={dpadDisabled}
            onClick={() => cycleSort(1)}
            aria-label="Next sort order"
            title="Next sort order"
          >
            <span aria-hidden>▼</span>
          </button>
        </div>
        {onDex && (
          <div className="device-controls__readout pixel text-[0.5rem] text-white/85" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.4)" }}>
            <div>PG {currentPage}</div>
            <div className="mt-1 opacity-80">{sortLabel}</div>
          </div>
        )}
      </div>

      {/* Right cluster: action button + speaker */}
      <div className="device-controls__right flex items-center gap-3">
        <button
          type="button"
          className="action-btn"
          onClick={onAction}
          aria-label={onLanding ? "Enter Pokédex" : onDex ? "Random attendee" : "Go to Pokédex"}
          title={onLanding ? "Enter Pokédex" : onDex ? "Random attendee" : "Go to Pokédex"}
        >
          <span aria-hidden>A</span>
        </button>
        <button
          type="button"
          className="speaker-grille speaker-btn"
          onClick={toggleSound}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          aria-pressed={!muted}
          title={muted ? "Sound off — click to enable" : "Sound on — click to mute"}
          data-muted={muted ? "true" : "false"}
        >
          <span /><span /><span /><span /><span />
          <span /><span /><span /><span /><span />
        </button>
      </div>
    </div>
  );
}
