import { Skeleton } from "@/components/ui/skeleton";

// Shared across every workspace tab (Guests/Invite page/RSVP form/Settings —
// docs/05 "System pages") since Next scopes one loading.tsx per segment and
// all four tabs live under this same [eventId] segment. Generic on purpose:
// it only needs to hold the layout steady for the moment between the shell
// (header/tabs) rendering and that specific tab's own data arriving.
export default function EventWorkspaceLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-2/3" />
    </div>
  );
}
