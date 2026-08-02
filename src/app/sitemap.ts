import type { MetadataRoute } from "next";
import { DOCS_FLAT_ITEMS } from "@/components/docs/docs-nav-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Marketing page + the public /docs site (docs/08) — /dashboard is
// auth-gated and /events/[slug] guest pages are deliberately excluded from
// indexing (see robots.ts). Docs pages are pulled from the same nav-data
// list DocsNav renders, so a new page added to that list is automatically
// picked up here too — nothing to remember to update by hand.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/docs`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // /docs/examples is already included via DOCS_FLAT_ITEMS below (it's a
    // real nav entry under Guides > "Start here") — no separate entry here.
    ...DOCS_FLAT_ITEMS.map((item) => ({
      url: `${siteUrl}${item.href}`,
      changeFrequency: "monthly" as const,
      priority: item.href === "/docs/examples" ? 0.7 : 0.6,
    })),
  ];
}
