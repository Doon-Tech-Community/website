import type { Rarity } from "@/lib/types";

const rarityClass: Record<Rarity, string> = {
  common: "chip",
  rare: "chip chip-rare",
  epic: "chip chip-epic",
  legendary: "chip chip-legendary"
};

export default function BadgePill({
  name,
  rarity,
  description,
  size = "md"
}: {
  name: string;
  rarity: Rarity;
  description?: string;
  size?: "sm" | "md";
}) {
  const compact =
    size === "sm"
      ? { fontSize: "0.42rem", padding: "0.2rem 0.4rem", gap: "0.2rem" }
      : undefined;
  return (
    <span className={rarityClass[rarity]} title={description ?? name} style={compact}>
      <span aria-hidden>●</span> {name}
    </span>
  );
}
