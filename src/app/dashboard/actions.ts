"use server";

import { redirect } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import * as eventsData from "@/lib/data/events";
import { defaultPageSchema } from "@/lib/blocks/types";
import { eventInputSchema, readEventFormInput, toEventRow } from "@/lib/schemas/event-input";
import type { EventFormInput } from "@/lib/schemas/event-input";

// Not re-exported from this file — it's a "use server" module, and Next's
// server-action transform mishandles a type-only `export type {}` re-export
// here (emits a runtime reference to a name that was fully elided).
// Consumers import EventFormInput directly from @/lib/schemas/event-input.
export type EventFormState = { status: "idle" | "error"; message?: string };

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const host = await requireHost();
  const parsed = readEventFormInput(formData);

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid event details." };
  }

  const row = toEventRow(parsed.data);
  let eventId: string;
  try {
    eventId = await eventsData.createEvent({
      hostId: host.id,
      ...row,
      pageSchema: defaultPageSchema(),
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Failed to create event." };
  }

  redirect(`/dashboard/events/${eventId}`);
}

export async function updateEvent(eventId: string, input: EventFormInput) {
  const host = await requireHost();
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid event details.");
  }

  await eventsData.updateEventDetails(host.id, eventId, toEventRow(parsed.data));
}

export async function setEventStatus(eventId: string, status: "draft" | "published") {
  const host = await requireHost();
  await eventsData.updateEventStatus(host.id, eventId, status);
}

export async function deleteEvent(eventId: string) {
  const host = await requireHost();
  await eventsData.deleteEvent(host.id, eventId);
  // Deliberately no redirect() here: this action is invoked programmatically
  // from a client component (a confirm-delete button), not a <form action>.
  // redirect() throws a special signal that a wrapping try/catch on the
  // client would swallow as a real error — the caller navigates to
  // /dashboard itself once this resolves successfully.
}
