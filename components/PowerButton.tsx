"use client";
import { usePathname, useRouter } from "next/navigation";

export default function PowerButton() {
  const router = useRouter();
  const pathname = usePathname();
  const onLanding = pathname === "/";

  return (
    <button
      type="button"
      className="pwr-btn"
      onClick={() => { if (!onLanding) router.push("/"); }}
      disabled={onLanding}
      aria-label={onLanding ? "Already on landing" : "Power off — back to landing"}
      title={onLanding ? "Already at landing" : "Power off — back to landing"}
    >
      <span className="led led-blue" aria-hidden />
      <span className="pixel text-[10px]">PWR</span>
    </button>
  );
}
