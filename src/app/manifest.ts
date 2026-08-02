import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest and auto-links it from every
// page's <head> — no manual <link rel="manifest"> needed. Icons reuse the
// existing icon.png/apple-icon.png convention files (see src/app/icon.png,
// apple-icon.png), which the build serves as static routes at those exact
// paths (confirmed in `next build` route output), so no separate PWA-only
// icon assets are needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ahvaan — RSVP made easy",
    short_name: "ahvaan",
    description: "Design a beautiful invitation page for any event, share one link with your guests, and track every RSVP in one place.",
    // Was "/dashboard" — that route is auth-gated (src/proxy.ts), so a
    // logged-out install launched straight into a redirect to /login
    // instead of anything useful (docs-audit Low). "/" works regardless of
    // auth state and gets a logged-in host to their dashboard in one tap.
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF8",
    theme_color: "#2F5D46",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
