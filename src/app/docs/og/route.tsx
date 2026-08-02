import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// One shared, parameterized OG/Twitter card image for every /docs page —
// each page's metadata points here with its own title/section as query
// params (see docs-ui.tsx's DocsArticle) instead of every page shipping its
// own opengraph-image.tsx file. Same paper/ink Studio palette as the rest
// of Docs (docs/10-docs-site.md's design note): calm reference material,
// not a themed guest-page vignette like the marketing OG image.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Documentation").slice(0, 120);
  const section = searchParams.get("section") ?? "Docs";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#FBFAF8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 20,
              borderRadius: 6,
              background: "#211E19",
              transform: "rotate(-8deg)",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 700, color: "#211E19" }}>ahvaan</div>
          <div
            style={{
              marginLeft: 8,
              fontSize: 16,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#6E6A61",
            }}
          >
            Docs
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#2F5D46",
              marginBottom: 20,
            }}
          >
            {section}
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#211E19",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 28,
              height: 4,
              width: 90,
              background: "#2F5D46",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
