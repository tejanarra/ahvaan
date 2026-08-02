import type { NavItem } from "@/components/ui/section-nav";
import type { SideNavGroup } from "@/components/ui/side-nav";

// Guests' three sub-pages are siblings of design/forms/settings under
// [eventId], not their own sub-tree. "Who can submit" and "RSVP deadline"
// used to live here as a fourth "Settings" sub-item, but that meant two
// different things were both called "Settings" in the same workspace (this
// one, and the top-level event Settings) — confusing regardless of what
// was inside either. Both now live in the one event-wide Settings page
// instead (event-settings-form.tsx's "RSVP" card), so there's exactly one
// Settings destination. Rendered as a `SectionNav` pill row in each Guests
// page's own `PageHeader` (every breakpoint, not just mobile) — the
// sidebar only ever shows the flat top-level "Guests" link.
export function guestsSubItems(eventId: string): NavItem[] {
  const base = `/dashboard/events/${eventId}`;
  return [
    { href: base, label: "Data" },
    { href: `${base}/fields`, label: "Fields" },
    { href: `${base}/actions`, label: "Actions" },
  ];
}

// The event workspace's flat top-level nav tree. "Guests" and "Forms" are
// section links whose `isActive` covers routes beyond their own href
// (Guests also covers its four sub-page routes; Forms also covers every
// form workspace route) — SideNav uses this only to decide the highlight;
// each section's own sub-pages live in that page's PageHeader instead.
export function eventNavGroups(eventId: string): SideNavGroup[] {
  const base = `/dashboard/events/${eventId}`;
  return [
    {
      href: base,
      label: "Guests",
      isActive: (pathname) =>
        pathname === base ||
        pathname.startsWith(`${base}/fields`) ||
        pathname.startsWith(`${base}/actions`),
    },
    {
      href: `${base}/design`,
      label: "Invite page",
      isActive: (pathname) => pathname === `${base}/design`,
    },
    {
      href: `${base}/forms`,
      label: "Forms",
      isActive: (pathname) => pathname.startsWith(`${base}/forms`),
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      isActive: (pathname) => pathname === `${base}/settings`,
    },
  ];
}
