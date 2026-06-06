import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" } }
    ).then((r) => r.text());
    const fontUrl = css.match(/url\(([^)]+\.woff2)\)/)?.[1];
    if (!fontUrl) return null;
    return fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadLogo(baseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/logo.png`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function OGImage() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const [fontData, logoSrc] = await Promise.all([
    loadFont(),
    loadLogo(baseUrl),
  ]);

  const font = fontData ? "Bebas Neue" : "Impact, Arial Black, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#001E62",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px 72px",
          fontFamily: font,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative grid lines */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Left column */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          zIndex: 1,
        }}>
          {/* Top */}
          <div style={{ color: "#F0C040", fontSize: 22, letterSpacing: "0.3em", fontFamily: font }}>
            ARGENTINA · 2026
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.9 }}>
            <div style={{ color: "#FFFFFF", fontSize: 148, fontFamily: font, letterSpacing: "-1px" }}>
              MUNDIAL
            </div>
            <div style={{ color: "#E31837", fontSize: 148, fontFamily: font, letterSpacing: "-1px", marginTop: -8 }}>
              DE CLAVOS
            </div>
          </div>

          {/* Bottom badge + URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#E31837",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: 14,
              fontSize: 24,
              fontFamily: font,
              letterSpacing: "0.05em",
              width: "fit-content",
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "white", opacity: 0.9 }} />
              CLASIFICACIONES ABIERTAS — NOMINÁ AHORA
            </div>
            <div style={{ color: "rgba(240,244,255,0.35)", fontSize: 18, fontFamily: "system-ui, sans-serif" }}>
              mundialdeclavos.vercel.app
            </div>
          </div>
        </div>

        {/* Right column — trophy */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 340,
          zIndex: 1,
        }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              width={300}
              height={520}
              style={{ objectFit: "contain", filter: "drop-shadow(0 0 40px rgba(240,192,64,0.4))" }}
              alt="trofeo"
            />
          ) : (
            <div style={{
              fontSize: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.15,
            }}>
              🏆
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "Bebas Neue", data: fontData, weight: 400 }] : [],
    }
  );
}
