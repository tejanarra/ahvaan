// Single source of truth for the /docs sidebar tree and for each page's
// prev/next footer links. Kept as plain data (not derived from the
// filesystem) since docs/10-docs-site.md's site map is the intentional,
// hand-curated IA — a generated nav would drift from that grouping.
export interface DocsNavItem {
  label: string;
  href: string;
}

export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

export interface DocsNavGroup {
  label: string;
  sections: DocsNavSection[];
}

export const DOCS_NAV: DocsNavGroup[] = [
  {
    label: "Guides",
    sections: [
      {
        title: "Start here",
        items: [
          { label: "Getting started", href: "/docs/getting-started" },
          { label: "Installing the app (PWA)", href: "/docs/pwa-install" },
          { label: "Live examples", href: "/docs/examples" },
        ],
      },
      {
        title: "Events",
        items: [{ label: "Events", href: "/docs/events" }],
      },
      {
        title: "The page builder",
        items: [
          { label: "Overview", href: "/docs/page-builder" },
          { label: "Layout controls", href: "/docs/page-builder/layout-controls" },
          { label: "Styling", href: "/docs/page-builder/styling" },
          { label: "Custom code & sandboxing", href: "/docs/page-builder/custom-code" },
        ],
      },
      {
        title: "Blocks",
        items: [
          { label: "Cover / hero", href: "/docs/page-builder/blocks/hero" },
          { label: "Text", href: "/docs/page-builder/blocks/text" },
          { label: "Image", href: "/docs/page-builder/blocks/image" },
          { label: "Image carousel", href: "/docs/page-builder/blocks/carousel" },
          { label: "Spacer", href: "/docs/page-builder/blocks/spacer" },
          { label: "Countdown", href: "/docs/page-builder/blocks/countdown" },
          { label: "Schedule / itinerary", href: "/docs/page-builder/blocks/schedule" },
          { label: "RSVP form", href: "/docs/page-builder/blocks/rsvp-form" },
          { label: "Form", href: "/docs/page-builder/blocks/form" },
          { label: "Venue map", href: "/docs/page-builder/blocks/venue-map" },
          { label: "Custom HTML/CSS/JS", href: "/docs/page-builder/blocks/custom-html" },
          { label: "Container", href: "/docs/page-builder/blocks/container" },
        ],
      },
      {
        title: "Forms & guests",
        items: [
          { label: "Themes", href: "/docs/themes" },
          { label: "RSVP form", href: "/docs/rsvp-form" },
          { label: "Custom forms", href: "/docs/custom-forms" },
          { label: "Guests & tracking", href: "/docs/guests" },
          { label: "Email invites & reminders", href: "/docs/email" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Your public profile", href: "/docs/profile" },
          { label: "Images", href: "/docs/images" },
          { label: "Account & security", href: "/docs/account-security" },
        ],
      },
    ],
  },
  {
    label: "Reference",
    sections: [
      {
        title: "Architecture",
        items: [
          { label: "Overview", href: "/docs/reference/architecture" },
          { label: "The host_id invariant", href: "/docs/reference/host-id-invariant" },
          { label: "JSONB validation", href: "/docs/reference/jsonb-validation" },
        ],
      },
      {
        title: "The block system",
        items: [
          { label: "Adding a block type", href: "/docs/reference/adding-a-block" },
          { label: "Sandboxing model", href: "/docs/reference/sandboxing" },
        ],
      },
      {
        title: "Platform",
        items: [
          { label: "Rate limiting & size budgets", href: "/docs/reference/rate-limiting" },
          { label: "Design tokens", href: "/docs/reference/design-tokens" },
          { label: "Testing & CI", href: "/docs/reference/testing-ci" },
          { label: "Caching", href: "/docs/reference/caching" },
        ],
      },
    ],
  },
];

export const DOCS_FLAT_ITEMS: DocsNavItem[] = DOCS_NAV.flatMap((group) => group.sections.flatMap((s) => s.items));

// Resolves a page's own href to its {group, section} for breadcrumb JSON-LD
// (see DocsArticle in docs-ui.tsx) — a plain lookup over the same tree
// DocsNav renders, so a breadcrumb can never point at a group/section that
// doesn't actually contain that page.
export function findNavContext(href: string): { group: DocsNavGroup; section: DocsNavSection } | null {
  for (const group of DOCS_NAV) {
    for (const section of group.sections) {
      if (section.items.some((item) => item.href === href)) return { group, section };
    }
  }
  return null;
}
