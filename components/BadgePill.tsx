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
  description
}: {
  name: string;
  rarity: Rarity;
  description?: string;
}) {
  return (
    <span className={rarityClass[rarity]} title={description}>
      <span aria-hidden>●</span> {name}
    </span>
  );
}
