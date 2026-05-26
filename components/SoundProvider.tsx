"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Retro 8-bit audio system using the WebAudio API.
 * - Click/hover blips for interactive elements.
 * - Looping chiptune "loading music" using a square-wave melody + triangle bass.
 * - All sounds are synthesized at runtime, no asset downloads.
 *
 * Browser autoplay policies require a user gesture before audio plays;
 * the first user interaction unlocks the AudioContext and starts the loop.
 * A floating PWR/MUTE chip lets the user toggle audio on/off.
 */

const STORAGE_KEY = "dtc-sound-muted";

type Note = { f: number; d: number }; // frequency Hz, duration in beats

// Simple chiptune melody — public-domain style original riff in C minor pentatonic-ish.
// 8 bars, 4/4, 140 bpm => beat = 60/140 s.
const BPM = 138;
const BEAT = 60 / BPM;

const MELODY: Note[] = [
  { f: 523.25, d: 0.5 }, // C5
  { f: 659.25, d: 0.5 }, // E5
  { f: 783.99, d: 0.5 }, // G5
  { f: 659.25, d: 0.5 },
  { f: 698.46, d: 0.5 }, // F5
  { f: 587.33, d: 0.5 }, // D5
  { f: 523.25, d: 1.0 },
  { f: 0,      d: 0.5 },

  { f: 587.33, d: 0.5 },
  { f: 698.46, d: 0.5 },
  { f: 880.00, d: 0.5 }, // A5
  { f: 698.46, d: 0.5 },
  { f: 783.99, d: 0.5 },
  { f: 659.25, d: 0.5 },
  { f: 587.33, d: 1.0 },
  { f: 0,      d: 0.5 },

  { f: 523.25, d: 0.25 },
  { f: 659.25, d: 0.25 },
  { f: 783.99, d: 0.25 },
  { f: 1046.5, d: 0.25 }, // C6
  { f: 880.00, d: 0.5 },
  { f: 698.46, d: 0.5 },
  { f: 659.25, d: 0.5 },
  { f: 523.25, d: 0.5 },

  { f: 392.00, d: 0.5 }, // G4
  { f: 523.25, d: 0.5 },
  { f: 659.25, d: 0.5 },
  { f: 523.25, d: 0.5 },
  { f: 587.33, d: 0.5 },
  { f: 392.00, d: 0.5 },
  { f: 523.25, d: 1.0 },
  { f: 0,      d: 0.5 }
];

const BASS: Note[] = [
  { f: 130.81, d: 2 }, // C3
  { f: 130.81, d: 2 },
  { f: 174.61, d: 2 }, // F3
  { f: 130.81, d: 2 },
  { f: 196.00, d: 2 }, // G3
  { f: 174.61, d: 2 },
  { f: 196.00, d: 2 },
  { f: 130.81, d: 2 }
];

export default function SoundProvider() {
  const [muted, setMuted] = useState(true); // start muted until user opts in
  const [ready, setReady] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const loopTimerRef = useRef<number | null>(null);

  // Restore preference on mount.
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "0") setMuted(false);
    } catch {}
  }, []);

  // Ensure an AudioContext exists. Must be called from a user gesture.
  function ensureCtx(): AudioContext | null {
    if (ctxRef.current) return ctxRef.current;
    if (typeof window === "undefined") return null;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
    const music = ctx.createGain();
    music.gain.value = 0.18;
    music.connect(master);
    const sfx = ctx.createGain();
    sfx.gain.value = 0.5;
    sfx.connect(master);
    ctxRef.current = ctx;
    masterRef.current = master;
    musicGainRef.current = music;
    sfxGainRef.current = sfx;
    return ctx;
  }

  // Small percussive blip for clicks.
  function blip(freq: number, duration: number, type: OscillatorType = "square", vol = 0.5) {
    const ctx = ctxRef.current;
    const dest = sfxGainRef.current;
    if (!ctx || !dest) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  function playClick() {
    blip(880, 0.06, "square", 0.35);
    blip(1320, 0.05, "square", 0.2);
  }
  function playHover() {
    blip(1760, 0.03, "square", 0.12);
  }

  // Schedule a single tone at an absolute audio time on the music bus.
  function scheduleTone(when: number, freq: number, dur: number, type: OscillatorType, vol: number) {
    const ctx = ctxRef.current;
    const dest = musicGainRef.current;
    if (!ctx || !dest || freq <= 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    const attack = 0.01;
    const release = Math.min(0.05, dur * 0.4);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + attack);
    g.gain.setValueAtTime(vol, when + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  // Queue one pass of melody + bass starting at audio time `startAt`. Returns its total duration.
  function queueLoop(startAt: number): number {
    // Melody (square)
    let t = startAt;
    for (const n of MELODY) {
      const dur = n.d * BEAT;
      if (n.f > 0) scheduleTone(t, n.f, dur * 0.95, "square", 0.22);
      t += dur;
    }
    const melodyEnd = t;
    // Bass (triangle), restart from startAt
    let b = startAt;
    for (const n of BASS) {
      const dur = n.d * BEAT;
      if (n.f > 0) scheduleTone(b, n.f, dur * 0.9, "triangle", 0.28);
      b += dur;
    }
    return Math.max(melodyEnd, b) - startAt;
  }

  function startMusic() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Schedule the first pass slightly in the future, then keep queueing.
    let next = ctx.currentTime + 0.1;
    const tick = () => {
      if (!ctxRef.current || muted) return;
      const len = queueLoop(next);
      next += len;
      // Re-arm a little before the next pass ends.
      const ms = Math.max(100, (len - 0.5) * 1000);
      loopTimerRef.current = window.setTimeout(tick, ms);
    };
    tick();
  }

  function stopMusic() {
    if (loopTimerRef.current != null) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    // Fade master to silence so already-scheduled notes don't ring out harshly.
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      window.setTimeout(() => {
        if (masterRef.current) masterRef.current.gain.value = 0.45;
      }, 120);
    }
  }

  // Bridge: listen for external toggle requests (e.g. the speaker grille on the chassis)
  // and broadcast the current mute state so other UI can stay in sync.
  useEffect(() => {
    function onToggle() { toggleMute(); }
    window.addEventListener("dtc:sound-toggle", onToggle);
    return () => window.removeEventListener("dtc:sound-toggle", onToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dtc:sound-changed", { detail: { muted } }));
  }, [muted]);

  // Global click + hover listeners for interactive elements.
  useEffect(() => {
    function isInteractive(el: EventTarget | null): boolean {
      if (!(el instanceof Element)) return false;
      const node = el.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"], summary, .btn, .chip'
      );
      if (!node) return false;
      if (node.hasAttribute("disabled")) return false;
      if (node.getAttribute("aria-disabled") === "true") return false;
      return true;
    }
    function onClick(e: MouseEvent) {
      if (muted) return;
      if (!isInteractive(e.target)) return;
      ensureCtx();
      playClick();
    }
    function onOver(e: MouseEvent) {
      if (muted) return;
      if (!isInteractive(e.target)) return;
      ensureCtx();
      playHover();
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onOver, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onOver, true);
    };
  }, [muted]);

  // Toggle handler — must run inside the user gesture so AudioContext can resume.
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {}
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (next) {
      stopMusic();
    } else {
      // Tiny confirmation chirp + start music.
      blip(523.25, 0.08, "square", 0.4);
      blip(783.99, 0.1, "square", 0.4);
      setReady(true);
      window.setTimeout(startMusic, 120);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      title={muted ? "Sound: OFF" : "Sound: ON"}
      className="sound-fab fixed bottom-3 right-3 z-50 btn pixel"
      style={{ fontSize: "0.55rem", padding: "0.5rem 0.6rem" }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          marginRight: 6,
          background: muted ? "#7A0E12" : "var(--led-grn, #00E676)",
          boxShadow: muted ? "none" : "0 0 6px var(--led-grn, #00E676)",
          verticalAlign: "middle"
        }}
      />
      {muted ? "SOUND OFF" : ready ? "SOUND ON" : "SOUND ON"}
    </button>
  );
}
