import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  // Load Bebas Neue from Google Fonts
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" } }
    ).then((r) => r.text());

    const fontUrl = css.match(/url\(([^)]+\.woff2)\)/)?.[1];
    if (fontUrl) {
      fontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
    }
  } catch {
    // Falls back to system font
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#001E62",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          justifyContent: "space-between",
          fontFamily: fontData ? "Bebas Neue" : "Impact, Arial Black, sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            color: "#F0C040",
            fontSize: 22,
            letterSpacing: "0.3em",
            fontFamily: fontData ? "Bebas Neue" : "Impact, sans-serif",
          }}
        >
          ARGENTINA · 2026
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 160,
              letterSpacing: "-1px",
              fontFamily: fontData ? "Bebas Neue" : "Impact, sans-serif",
            }}
          >
            MUNDIAL
          </div>
          <div
            style={{
              color: "#E31837",
              fontSize: 160,
              letterSpacing: "-1px",
              marginTop: -16,
              fontFamily: fontData ? "Bebas Neue" : "Impact, sans-serif",
            }}
          >
            DE CLAVOS
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              background: "#E31837",
              color: "#FFFFFF",
              padding: "14px 28px",
              borderRadius: 16,
              fontSize: 26,
              fontFamily: fontData ? "Bebas Neue" : "Impact, sans-serif",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "white",
              }}
            />
            CLASIFICACIONES ABIERTAS — NOMINÁ AHORA
          </div>

          <div
            style={{
              color: "rgba(240, 244, 255, 0.4)",
              fontSize: 20,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            mundialdeclavos.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Bebas Neue", data: fontData, weight: 400 }]
        : [],
    }
  );
}
