function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export default function Avatar({
  name,
  url,
  size = 48
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  const dim = `${size}px`;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: dim, height: dim }}
        className="rounded-xl object-cover ring-2 ring-ink/25 shadow-[0_2px_4px_rgba(11,42,62,0.25)]"
      />
    );
  }
  const hue = hashHue(name);
  return (
    <div
      aria-hidden
      style={{
        width: dim,
        height: dim,
        background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 35%))`,
        fontSize: Math.floor(size * 0.4)
      }}
      className="rounded-xl ring-2 ring-ink/25 shadow-[0_2px_4px_rgba(11,42,62,0.25)] flex items-center justify-center font-bold text-white"
    >
      {initials(name)}
    </div>
  );
}
