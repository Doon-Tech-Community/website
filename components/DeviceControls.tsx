"use client";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const MAIN_PAGES = ["/dex", "/events", "/profile"] as const;
type MainPage = (typeof MAIN_PAGES)[number];

export default function DeviceControls() {
  const router = useRouter();
  const pathname = usePathname();
  const [muted, setMuted] = useState(true);

  const onLanding = pathname === "/";
  const onDex = pathname === "/dex";
  const mainIndex = MAIN_PAGES.indexOf(pathname as MainPage);
  const onMain = mainIndex !== -1;

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

  const cycleMain = useCallback(
    (dir: 1 | -1) => {
      if (!onMain) return;
      const next = MAIN_PAGES[(mainIndex + dir + MAIN_PAGES.length) % MAIN_PAGES.length];
      router.push(next);
    },
    [onMain, mainIndex, router]
  );

  const scrollPage = useCallback((dir: 1 | -1) => {
    if (typeof window === "undefined") return;
    // On mobile the .device-screen (.lcd-panel) is the actual scroll container
    // because the chassis is locked to the viewport. On desktop the window
    // scrolls. Pick whichever can actually move.
    const panel = document.querySelector<HTMLElement>(".device-screen");
    if (panel && panel.scrollHeight > panel.clientHeight) {
      panel.scrollBy({ top: dir * panel.clientHeight * 0.8, behavior: "smooth" });
    } else {
      window.scrollBy({ top: dir * window.innerHeight * 0.8, behavior: "smooth" });
    }
  }, []);

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

  // Keyboard shortcuts mirror the D-pad. ArrowLeft/Right cycle main pages
  // (only when on a main page). ArrowUp/Down scroll. A/Enter triggers the
  // action button. M toggles sound.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      const onInteractive = !!target?.closest('button, a, [role="button"]');
      switch (e.key) {
        case "ArrowLeft":  if (onMain) { e.preventDefault(); cycleMain(-1); } break;
        case "ArrowRight": if (onMain) { e.preventDefault(); cycleMain(1); } break;
        case "ArrowUp":    e.preventDefault(); scrollPage(-1); break;
        case "ArrowDown":  e.preventDefault(); scrollPage(1); break;
        case "a":
        case "A":          if (!onInteractive) { e.preventDefault(); onAction(); } break;
        case "Enter":      if (!onInteractive) { e.preventDefault(); onAction(); } break;
        case "m":
        case "M":          if (!onInteractive) { e.preventDefault(); toggleSound(); } break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onMain, cycleMain, scrollPage, onAction, toggleSound]);

  return (
    <div className="device-controls flex items-center justify-between mt-5 gap-4">
      {/* D-pad */}
      <div className="device-controls__left flex items-center gap-3">
        <div className="dpad" role="group" aria-label="Device controls">
          <button
            type="button"
            className="dpad-btn dpad-up"
            onClick={() => scrollPage(-1)}
            aria-label="Scroll up"
            title="Scroll up"
          >
            <span aria-hidden>▲</span>
          </button>
          <button
            type="button"
            className="dpad-btn dpad-left"
            disabled={!onMain}
            onClick={() => cycleMain(-1)}
            aria-label="Previous section"
            title="Previous section"
          >
            <span aria-hidden>◀</span>
          </button>
          <span className="dpad-hub" aria-hidden />
          <button
            type="button"
            className="dpad-btn dpad-right"
            disabled={!onMain}
            onClick={() => cycleMain(1)}
            aria-label="Next section"
            title="Next section"
          >
            <span aria-hidden>▶</span>
          </button>
          <button
            type="button"
            className="dpad-btn dpad-down"
            onClick={() => scrollPage(1)}
            aria-label="Scroll down"
            title="Scroll down"
          >
            <span aria-hidden>▼</span>
          </button>
        </div>
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
