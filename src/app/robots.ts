import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// docs/08 SEO checklist: index the marketing page only. /dashboard is
// auth-gated anyway (nothing to index), but /events/[slug] guest pages are
// reachable without an account — keeping them out of crawlers is a
// deliberate privacy choice (guest names never belong in a search index),
// on top of the `noindex` on the pages themselves.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/events/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
