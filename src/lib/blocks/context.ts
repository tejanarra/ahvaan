import type { EventRecord } from "@/lib/data/events";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";

// Threaded down to every block's Render component on the public page. Only
// the rsvp-form block actually needs the guest-specific fields; everything
// else just reads `event`.
export type PageRenderContext = {
  event: EventRecord;
  inviteId: string | null;
  guestName: string | null;
  schema: FormSchema;
  initialResponses: Responses | null;
};
