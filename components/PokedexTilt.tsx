"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PokedexTilt() {
  const pathname = usePathname();

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".dex-shell");
    if (!shell) return;

    // Keep the shell static for hit-testing. Moving a transformed parent under
    // the pointer can make clicks land on the surrounding panel instead.
    shell.classList.remove("dex-shell--alive");
    shell.style.removeProperty("--tilt-x");
    shell.style.removeProperty("--tilt-y");
  }, [pathname]);

  return null;
}
