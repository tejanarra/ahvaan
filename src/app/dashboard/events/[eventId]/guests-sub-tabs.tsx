import { Tabs } from "@/components/ui/tabs";

// Shared by the three Guests-area pages (Data = the bare event route,
// Fields, Actions) — same "Fields/Data/Actions" pattern as every custom
// form under Forms → [form] (see forms/[formId]/layout.tsx), rendered
// inline in each page rather than via a shared nested layout.tsx: these
// three routes are siblings of design/forms/settings under [eventId], not
// their own sub-tree, so a shared layout here would need a route group to
// avoid also wrapping those — three small, identical `<GuestsSubTabs />`
// calls is simpler than that.
export function GuestsSubTabs({ eventId }: { eventId: string }) {
  const base = `/dashboard/events/${eventId}`;
  return (
    <Tabs
      items={[
        { href: base, label: "Data" },
        { href: `${base}/fields`, label: "Fields" },
        { href: `${base}/actions`, label: "Actions" },
      ]}
    />
  );
}
