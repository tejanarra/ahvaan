import { z } from "zod";
import { MAX_NAME_LENGTH } from "@/lib/rsvp-limits";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

// Shared by the `new` and `settings` actions (docs/03 W6) — one place that
// defines what a valid event looks like, instead of hand-trimming/slicing
// FormData fields separately in each action.
export const eventInputSchema = z.object({
  title: z.string().trim().min(1, "Give your event a title.").max(MAX_TITLE_LENGTH),
  eventType: z.string().min(1).default("other"),
  themeId: z.string().min(1).default("classic-gold"),
  eventDate: z.string().max(20).optional().default(""),
  eventTime: z.string().trim().max(20).optional().default(""),
  venueName: z.string().trim().max(MAX_NAME_LENGTH).optional().default(""),
  venueAddress: z.string().trim().max(200).optional().default(""),
  subtitle: z.string().trim().max(MAX_TITLE_LENGTH).optional().default(""),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional().default(""),
});

export type EventFormInput = z.infer<typeof eventInputSchema>;

export function readEventFormInput(formData: FormData) {
  return eventInputSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    eventType: String(formData.get("eventType") ?? "other"),
    themeId: String(formData.get("themeId") ?? "classic-gold"),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventTime: String(formData.get("eventTime") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    venueAddress: String(formData.get("venueAddress") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
}

// Converts blank optional strings to null the way the DB columns expect —
// used at both the create and update call sites.
export function toEventRow(input: EventFormInput) {
  return {
    title: input.title,
    eventType: input.eventType,
    themeId: input.themeId,
    eventDate: input.eventDate || null,
    eventTime: input.eventTime || null,
    venueName: input.venueName || null,
    venueAddress: input.venueAddress || null,
    subtitle: input.subtitle || null,
    description: input.description || null,
  };
}
