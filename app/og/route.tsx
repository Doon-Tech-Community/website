import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };
const siteName = "DTC Pokedex";

interface AttendeeRow {
  name?: string;
  bio?: string;
  role_title?: string;
  company?: string;
  location?: string;
}

interface RowListResponse {
  rows?: AttendeeRow[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const attendee = slug ? await getAttendeeForOg(slug) : null;

  const title = attendee?.name || "Doon Tech Community";
  const subtitle = attendee
    ? [attendee.role_title, attendee.company].filter(Boolean).join(" @ ")
    : "A collectible developer index for every face in the community.";
  const titleLines = wrapText(clip(title, 48), 18).slice(0, 2);
  const subtitleLines = wrapText(clip(subtitle, 82), 42).slice(0, 2);
  const titleFontSize = titleLines.length > 1 ? 56 : 70;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 34,
          background: "#2a1416",
          color: "#0b2a3e",
          fontFamily: "monospace"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: 30,
            borderRadius: 34,
            background: "linear-gradient(145deg, #ffa8ab 0%, #f26b6f 42%, #b8383d 100%)",
            border: "6px solid #3a0a0d",
            boxShadow: "inset 0 4px 0 rgba(255,255,255,0.55)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22, height: 82 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "#6ccff6",
                border: "6px solid #ffffff",
                boxShadow: "0 0 0 5px #0b3950"
              }}
            />
            <div style={{ display: "flex", gap: 11 }}>
              <Dot color="#ff6b6f" />
              <Dot color="#ffd54f" />
              <Dot color="#5de39a" />
            </div>
            <div
              style={{
                marginLeft: "auto",
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 5
              }}
            >
              {siteName.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              height: 8,
              marginTop: 16,
              marginBottom: 22,
              borderRadius: 999,
              background: "#7a1f23",
              borderTop: "2px solid rgba(255,255,255,0.35)"
            }}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 34,
              padding: 42,
              borderRadius: 24,
              background: "linear-gradient(180deg, #e7f6fd 0%, #a8d5ec 62%, #7abdde 100%)",
              border: "7px solid #e8ecef",
              boxShadow: "0 0 0 5px #3a0a0d, inset 0 8px 22px rgba(11,42,62,0.28)"
            }}
          >
            <div
              style={{
                minWidth: 0,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", marginBottom: 18 }}>
                {titleLines.map((line) => (
                  <div
                    key={line}
                    style={{
                      color: "#0b2a3e",
                      fontSize: titleFontSize,
                      fontWeight: 900,
                      lineHeight: 1.05
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {subtitleLines.map((line) => (
                  <div
                    key={line}
                    style={{
                      color: "#2f5670",
                      fontSize: 32,
                      lineHeight: 1.15
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
      }
    }
  );
}

function Dot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        background: color,
        border: "3px solid #3a0a0d"
      }}
    />
  );
}

async function getAttendeeForOg(slug: string): Promise<AttendeeRow | null> {
  const endpoint = env("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId = env("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const databaseId = env("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
  const apiUrl = new URL(
    `${endpoint.replace(/\/$/, "")}/tablesdb/${encodeURIComponent(databaseId)}/tables/attendees/rows`
  );

  apiUrl.searchParams.append("queries[0]", query("equal", "slug", slug));
  apiUrl.searchParams.append("queries[1]", query("limit", undefined, 1));
  apiUrl.searchParams.append("total", "false");

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "X-Appwrite-Project": projectId
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) return null;
    const data = (await res.json()) as RowListResponse;
    return data.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

function query(method: string, attribute: string | undefined, value: string | number): string {
  return JSON.stringify({
    method,
    attribute,
    values: [value]
  });
}

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}...` : value;
}

function wrapText(value: string, maxLineLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxLineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [value];
}
