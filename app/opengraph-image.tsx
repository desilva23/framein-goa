import { ImageResponse } from "next/og";
import { COLORS, EVENT } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Frame in Goa — Hacker House Goa 2026";

/**
 * Preview for the homepage itself; each generated share gets its own under /i/[id].
 * Satori needs an explicit `display` on every element, so each node sets it.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.green,
          color: COLORS.cream,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            color: COLORS.yellow,
            fontWeight: 700,
          }}
        >
          {`${EVENT.name} ${EVENT.place}`}
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, marginTop: 14 }}>
          FRAME IN GOA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            marginTop: 18,
            opacity: 0.85,
          }}
        >
          {EVENT.dates}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            background: COLORS.pink,
            color: COLORS.cream,
            fontSize: 26,
            fontWeight: 700,
            padding: "12px 30px",
            borderRadius: 999,
          }}
        >
          {EVENT.hashtag}
        </div>
      </div>
    ),
    size,
  );
}
