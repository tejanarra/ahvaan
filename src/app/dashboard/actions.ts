"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireHost } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { makeEventSlug } from "@/lib/event";
import { MAX_NAME_LENGTH } from "@/lib/rsvp-limits";
import { defaultPageSchema } from "@/lib/page-blocks/types";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;

export type EventFormInput = {
  title: string;
  eventType: string;
  themeId: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  subtitle: string;
  description: string;
};

function readEventForm(formData: FormData): EventFormInput {
  return {
    title: String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE_LENGTH),
    eventType: String(formData.get("eventType") ?? "other"),
    themeId: String(formData.get("themeId") ?? "classic-gold"),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventTime: String(formData.get("eventTime") ?? "").trim().slice(0, 20),
    venueName: String(formData.get("venueName") ?? "").trim().slice(0, MAX_NAME_LENGTH),
    venueAddress: String(formData.get("venueAddress") ?? "").trim().slice(0, 200),
    subtitle: String(formData.get("subtitle") ?? "").trim().slice(0, MAX_TITLE_LENGTH),
    description: String(formData.get("description") ?? "")
      .trim()
      .slice(0, MAX_DESCRIPTION_LENGTH),
  };
}

export type EventFormState = { status: "idle" | "error"; message?: string };

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const host = await requireHost();
  const input = readEventForm(formData);

  if (!input.title) {
    return { status: "error", message: "Give your event a title." };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: host.id,
      slug: makeEventSlug(input.title),
      event_type: input.eventType,
      theme_id: input.themeId,
      title: input.title,
      subtitle: input.subtitle || null,
      event_date: input.eventDate || null,
      event_time: input.eventTime || null,
      venue_name: input.venueName || null,
      venue_address: input.venueAddress || null,
      description: input.description || null,
      page_schema: defaultPageSchema(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Failed to create event." };
  }

  redirect(`/dashboard/events/${data.id}`);
}

export async function updateEvent(eventId: string, input: EventFormInput) {
  const host = await requireHost();

  if (!input.title.trim()) {
    throw new Error("Give your event a title.");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      event_type: input.eventType,
      theme_id: input.themeId,
      title: input.title.trim().slice(0, MAX_TITLE_LENGTH),
      subtitle: input.subtitle.trim() || null,
      event_date: input.eventDate || null,
      event_time: input.eventTime.trim() || null,
      venue_name: input.venueName.trim() || null,
      venue_address: input.venueAddress.trim() || null,
      description: input.description.trim() || null,
    })
    .eq("id", eventId)
    .eq("host_id", host.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Event not found.");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const host = await requireHost();

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("host_id", host.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  // Deliberately no redirect() here: this action is invoked programmatically
  // from a client component (a confirm-delete button), not a <form action>.
  // redirect() throws a special signal that a wrapping try/catch on the
  // client would swallow as a real error — the caller navigates to
  // /dashboard itself once this resolves successfully.
}
