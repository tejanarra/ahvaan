import { Tabs } from "@/components/ui/tabs";

// Shared by the four Guests-area pages (Data = the bare event route,
// Fields, Actions, Settings) — same "Fields/Data/Actions/Settings" pattern
// as every custom form under Forms → [form] (see forms/[formId]/layout.tsx),
// rendered inline in each page rather than via a shared nested layout.tsx:
// these routes are siblings of design/forms/settings under [eventId], not
// their own sub-tree, so a shared layout here would need a route group to
// avoid also wrapping those — four small, identical `<GuestsSubTabs />`
// calls is simpler than that. The route segment is `rsvp-settings`, not
// `settings`, since that would collide with the existing top-level event
// `/settings` tab (event details/theme/RSVP deadline) — the sub-tab label
// still just reads "Settings".
export function GuestsSubTabs({ eventId }: { eventId: string }) {
  const base = `/dashboard/events/${eventId}`;
  return (
    <Tabs
      items={[
        { href: base, label: "Data" },
        { href: `${base}/fields`, label: "Fields" },
        { href: `${base}/actions`, label: "Actions" },
        { href: `${base}/rsvp-settings`, label: "Settings" },
      ]}
    />
  );
}
