import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getEventBySlugPublic } from "@/lib/data/events";
import { getInvitePublic } from "@/lib/data/invites";
import { getRsvpForInvitePublic } from "@/lib/data/rsvps";
import { resolveThemeColors } from "@/lib/themes";
import { resolveFormSchema, getFieldValue } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";
import { defaultPageSchema } from "@/lib/blocks/types";
import { parsePageSchema } from "@/lib/schemas/page-schema";
import { PageRenderer } from "@/lib/blocks/page-renderer";
import { CustomPageFrame } from "@/lib/blocks/custom-page-frame";

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

  const event = await getEventBySlugPublic(slug);
  if (!event) {
    notFound();
  }

  const schema = resolveFormSchema(event.form_schema);

  let inviteId: string | null = null;
  let guestName: string | null = null;
  let initialResponses: Responses | null = null;

  if (invite) {
    // A malformed invite param (not a valid uuid) errors rather than
    // returning no rows — either way, fall back to the view-only experience.
    const inviteRow = await getInvitePublic(event.id, invite);

    if (inviteRow) {
      inviteId = inviteRow.id;
      guestName = inviteRow.name;

      const rsvp = await getRsvpForInvitePublic(inviteId);
      if (rsvp) {
        initialResponses = {};
        for (const field of schema.fields) {
          const value = getFieldValue(rsvp, field);
          if (value !== undefined) initialResponses[field.id] = value;
        }
      }
    }
  }

  // Older events created before the page builder existed (or a schema that
  // fails validation) have no usable page_schema — fall back to the same
  // default layout (hero + RSVP form + venue map) a brand-new event is
  // seeded with, so every event renders through the one page-block system
  // rather than a second hardcoded layout or a crash.
  const pageSchema = parsePageSchema(event.page_schema) ?? defaultPageSchema();
  const themeColors = resolveThemeColors(event.theme_id, pageSchema.themeOverrides);

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
          event,
          inviteId,
          guestName,
          schema,
          initialResponses,
        }}
      />
    </div>
  );
}
