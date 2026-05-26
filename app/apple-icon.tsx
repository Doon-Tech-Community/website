import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(160deg,#FFA8AB 0%,#F26B6F 28%,#E6585D 62%,#B8383D 100%)",
          padding: 18,
          borderRadius: 38,
          border: "5px solid #3A0A0D",
          position: "relative"
        }}
      >
        {/* top sheen */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: 4,
            height: 22,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 34,
            background: "rgba(255,255,255,0.30)"
          }}
        />

        {/* small lens, top-left */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 9999,
            background: "#E8ECEF",
            border: "3px solid #3A0A0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 9999,
              background:
                "radial-gradient(circle at 28% 25%, #FFFFFF 0%, #D6F0FE 14%, #6CCFF6 42%, #1E78A8 80%, #0B3950 100%)"
            }}
          />
        </div>

        {/* LCD with DTC text */}
        <div
          style={{
            flex: 1,
            marginTop: 10,
            background: "#3A0A0D",
            borderRadius: 14,
            padding: 6,
            display: "flex"
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#E8ECEF",
              borderRadius: 10,
              padding: 4,
              display: "flex"
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: 8,
                background:
                  "linear-gradient(180deg,#E7F6FD 0%,#A8D5EC 60%,#7ABDDE 100%)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {/* glass gloss */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "55%",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0) 70%)",
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8
                }}
              />
              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: 60,
                  letterSpacing: 4,
                  color: "#0B2A3E",
                  position: "relative"
                }}
              >
                DTC
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
