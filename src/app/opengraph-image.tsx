import { ImageResponse } from "next/og";
import { getTheme } from "@/lib/themes";

// No `runtime = "edge"` — this image is fully static (no per-request
// data), so the default Node runtime lets Next prerender it once at build
// time instead of regenerating it on every request.
export const alt = "Ahvan — RSVP made easy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A static Stage-vignette-style card (docs/06 "OG image rendered from a
// Stage vignette") rather than a generic text-on-color card — built with
// next/og's ImageResponse so it regenerates automatically instead of going
// stale like a hand-exported PNG would.
export default async function OpengraphImage() {
  const theme = getTheme("classic-gold");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ec",
        }}
      >
        <div
          style={{
            width: 920,
            height: 470,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24,
            background: theme.colors.background,
            color: theme.colors.foreground,
            boxShadow: "0 24px 64px rgba(30,20,10,0.18)",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: theme.colors.accent,
              marginBottom: 20,
            }}
          >
            Sam &amp; Alex
          </div>
          <div
            style={{
              fontSize: 84,
              fontFamily: "serif",
              fontStyle: "italic",
              color: theme.colors.foreground,
            }}
          >
            Ahvan
          </div>
          <div
            style={{
              marginTop: 10,
              height: 2,
              width: 90,
              background: theme.colors.accent,
            }}
          />
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              color: theme.colors.foreground,
              opacity: 0.75,
              textAlign: "center",
              maxWidth: 700,
            }}
          >
            Design the invitation. Share one link. Watch the RSVPs arrive.
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 18,
              padding: "10px 28px",
              borderRadius: 999,
              background: theme.colors.accentDark,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            RSVP
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
