import type { Tag } from "@/lib/types";

const typeClass: Record<Tag["type"], string> = {
  skill: "chip",
  interest: "chip chip-rare",
  industry: "chip chip-success",
  topic: "chip chip-epic"
};

export default function TagChip({ tag }: { tag: Pick<Tag, "id" | "name" | "type"> }) {
  return <span className={typeClass[tag.type]}>{tag.name}</span>;
}
