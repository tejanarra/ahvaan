import { VenueMap } from "@/components/venue-map";
import type { VenueMapBlockConfig } from "../types";
import type { PageRenderContext } from "../context";

export const venueMapDefaultConfig: VenueMapBlockConfig = {};

export function VenueMapEdit() {
  return <p className="text-sm text-foreground/60">Uses this event&rsquo;s venue name/address.</p>;
}

export function VenueMapRender({ ctx }: { config: VenueMapBlockConfig; ctx: PageRenderContext }) {
  const { event } = ctx;
  if (!event.venue_address) return null;
  return <VenueMap venueName={event.venue_name || "Venue"} venueAddress={event.venue_address} />;
}
