import { ImageResponse } from "next/og";
import { getAttendeeBySlug } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const size = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  let title = "Doon Tech Community Pokedex";
  let subtitle = "A collectible attendee index for every face in the Doon Tech Community.";
  let tagline = "DTC · DEHRADUN";

  if (slug) {
    const a = await getAttendeeBySlug(slug);
    if (a) {
      title = a.name;
      subtitle = `${a.role_title}${a.company ? ` @ ${a.company}` : ""}`;
      tagline = "DTC POKEDEX · ATTENDEE";
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 40,
          background: "#C8161D",
          color: "#9BBC0F",
          fontFamily: "monospace"
        }}
      >
        {/* Top bezel */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 9999,
              background: "radial-gradient(circle at 30% 30%, #BDE7FF 0%, #4FC3F7 40%, #0277BD 80%, #01415E 100%)",
              boxShadow: "0 0 0 8px #fff, 0 0 0 14px #2A0608"
            }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 9999, background: "#FF3344", boxShadow: "0 0 0 3px #2A0608" }} />
            <div style={{ width: 22, height: 22, borderRadius: 9999, background: "#FFD400", boxShadow: "0 0 0 3px #2A0608" }} />
            <div style={{ width: 22, height: 22, borderRadius: 9999, background: "#00E676", boxShadow: "0 0 0 3px #2A0608" }} />
          </div>
          <div style={{ marginLeft: "auto", color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: 6 }}>
            DTC POKÉDEX
          </div>
        </div>

        {/* LCD screen */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
            background: "linear-gradient(180deg, #143614 0%, #0F380F 100%)",
            color: "#9BBC0F",
            boxShadow: "inset 0 0 0 6px #9BBC0F, 0 0 0 8px #2A0608"
          }}
        >
          <div style={{ fontSize: 24, color: "#8BAC0F", letterSpacing: 6 }}>{tagline}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, color: "#9BBC0F" }}>{title}</div>
            <div style={{ fontSize: 32, color: "#8BAC0F" }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8BAC0F" }}>
            <span>doontech.community</span>
            <span>► PRESS START</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
