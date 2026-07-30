import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveThemeColors } from "@/lib/themes";
import type { EventRecord } from "@/lib/event";
import { resolveFormSchema, getFieldValue } from "@/lib/form-schema";
import type { Responses } from "@/lib/form-schema";
import { resolvePageSchema, defaultPageSchema } from "@/lib/page-blocks/types";
import { PageRenderer } from "@/lib/page-blocks/page-renderer";
import { CustomPageFrame } from "@/lib/page-blocks/custom-page-frame";

export const dynamic = "force-dynamic";

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ i?: string }>;
}) {
  const { slug } = await params;
  const { i: invite } = await searchParams;

  const supabase = createServiceRoleClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const schema = resolveFormSchema((event as EventRecord).form_schema);

  let inviteId: string | null = null;
  let guestName: string | null = null;
  let initialResponses: Responses | null = null;

  if (invite) {
    // A malformed invite param (not a valid uuid) errors rather than
    // returning no rows — either way, fall back to the view-only experience.
    const { data } = await supabase
      .from("invites")
      .select("id, name")
      .eq("id", invite)
      .eq("event_id", event.id)
      .maybeSingle();

    if (data) {
      inviteId = data.id;
      guestName = data.name;

      const { data: rsvp } = await supabase
        .from("rsvps")
        .select("name, attending, additional_guests, responses")
        .eq("invite_id", inviteId)
        .maybeSingle();

      if (rsvp) {
        initialResponses = {};
        for (const field of schema.fields) {
          const value = getFieldValue(rsvp, field);
          if (value !== undefined) initialResponses[field.id] = value;
        }
      }
    }
  }

  // Older events created before the page builder existed have no saved
  // page_schema — fall back to the same default layout (hero + RSVP form +
  // venue map) a brand-new event is seeded with, so every event renders
  // through the one page-block system rather than a second hardcoded layout.
  const pageSchema = resolvePageSchema((event as EventRecord).page_schema) ?? defaultPageSchema();
  const themeColors = resolveThemeColors((event as EventRecord).theme_id, pageSchema.themeOverrides);

  if (pageSchema.customPage?.enabled) {
    return <CustomPageFrame {...pageSchema.customPage} />;
  }

  return (
    <div
      className="min-h-dvh bg-[var(--t-bg)]"
      style={
        {
          "--t-bg": themeColors.background,
          "--t-fg": themeColors.foreground,
          "--t-accent": themeColors.accent,
          "--t-accent-dark": themeColors.accentDark,
          "--t-surface": themeColors.surface,
        } as CSSProperties
      }
    >
      <PageRenderer
        schema={pageSchema}
        ctx={{
          event: event as EventRecord,
          inviteId,
          guestName,
          schema,
          initialResponses,
        }}
      />
    </div>
  );
}
