import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlugPublic } from "@/lib/data/events";
import { getInvitePublic } from "@/lib/data/invites";
import { getRsvpForInvitePublic } from "@/lib/data/rsvps";
import { getSessionUser } from "@/lib/supabase/auth-server";
import { resolveThemeColors } from "@/lib/themes";
import { resolveThemeFonts } from "@/lib/theme-fonts";
import { cn } from "@/lib/cn";
import { resolveFormSchema, getFieldValue } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";
import { defaultPageSchema } from "@/lib/blocks/types";
import type { BlockInstance } from "@/lib/blocks/types";
import { parsePageSchema } from "@/lib/schemas/page-schema";
import { PageRenderer } from "@/lib/blocks/page-renderer";
import { CustomPageFrame } from "@/lib/blocks/custom-page-frame";
import { listComponentsForEventPublic } from "@/lib/data/custom-components";
import type { CustomComponentMap } from "@/lib/blocks/context";

// <custom-component> tags can appear in any custom-html block's HTML, at
// any nesting depth — this only decides whether the extra component-library
// query below is worth running at all (most pages use none).
function hasCustomComponentTag(blocks: BlockInstance[]): boolean {
  return blocks.some(
    (b) =>
      (b.type === "custom-html" && (b.config as { html?: string }).html?.includes("<custom-component")) ||
      ("children" in b && hasCustomComponentTag(b.children))
  );
}

export const dynamic = "force-dynamic";

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ i?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const { i: invite, preview } = await searchParams;

  const event = await getEventBySlugPublic(slug);
  if (!event) {
    notFound();
  }

  // A draft is only visible to its own host, and only via an explicit
  // `?preview=1` link (docs/02 W5) — never to the public, and never to a
  // signed-in host just by knowing the slug of someone else's draft.
  let isDraftPreview = false;
  if (event.status === "draft") {
    isDraftPreview = preview === "1" && (await getSessionUser())?.id === event.host_id;
    if (!isDraftPreview) {
      notFound();
    }
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
  const themeFonts = resolveThemeFonts(event.theme_id);

  // Only queried when the page might actually reference one — most won't.
  const mayNeedComponents =
    hasCustomComponentTag(pageSchema.blocks) || Boolean(pageSchema.customPage?.enabled && pageSchema.customPage.html.includes("<custom-component"));
  const customComponents: CustomComponentMap = mayNeedComponents
    ? Object.fromEntries((await listComponentsForEventPublic(event.id)).map((c) => [c.name, { html: c.html, css: c.css, js: c.js }]))
    : {};

  const draftBanner = isDraftPreview && (
    <p className="bg-[color-mix(in_oklab,var(--warning)_15%,transparent)] py-1.5 text-center text-xs font-medium text-[var(--warning)]">
      Draft preview — only you can see this page. Publish it from Settings to share the real link.
    </p>
  );

  if (pageSchema.customPage?.enabled) {
    return (
      <>
        {draftBanner}
        <CustomPageFrame
          {...pageSchema.customPage}
          shortcodes={{
            eventId: event.id,
            inviteId,
            venueName: event.venue_name,
            venueAddress: event.venue_address,
            schema,
            customComponents,
          }}
        />
      </>
    );
  }

  return (
    <div
      className={cn("min-h-dvh bg-[var(--t-bg)]", themeFonts.bodyClassName, themeFonts.displayClassName)}
      style={
        {
          "--t-bg": themeColors.background,
          "--t-fg": themeColors.foreground,
          "--t-accent": themeColors.accent,
          "--t-accent-dark": themeColors.accentDark,
          "--t-surface": themeColors.surface,
          "--t-font-display": themeFonts.displayVar,
          "--t-font-body": themeFonts.bodyVar,
          fontFamily: "var(--t-font-body)",
        } as CSSProperties
      }
    >
      {draftBanner}
      <PageRenderer
        schema={pageSchema}
        ctx={{
          event,
          inviteId,
          guestName,
          schema,
          initialResponses,
          customComponents,
        }}
      />
      <p className="pb-6 text-center text-[11px] tracking-wide text-[var(--t-fg)]/40">
        Made with{" "}
        <Link href="/" className="underline decoration-dotted underline-offset-2 hover:text-[var(--t-fg)]/70">
          Gatherie
        </Link>
      </p>
    </div>
  );
}
