import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLockup } from "@/components/brand";
import { getEventBySlugPublic } from "@/lib/data/events";
import { getHostProfilePublic } from "@/lib/data/host-profile";
import { PublicHostCard } from "@/components/public-host-card";
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
import { listFormsForEventPublic } from "@/lib/data/forms";
import { listSubmissionsForInvitePublic, listSubmissionsForEmailPublic } from "@/lib/data/form-submissions";
import { getVerifiedRsvpResponses, getResponsesForEmail } from "@/lib/rsvp-submit";
import { getVerifiedFormResponses } from "@/lib/form-submit";
import { getVerifiedGuestEmail } from "@/lib/guest-session";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
import { VerificationBroadcaster } from "./verification-broadcaster";
import { GuestIdentityFooter } from "./guest-identity-footer";
import type { CustomComponentMap, CustomFormMap, CustomFormResponsesMap } from "@/lib/blocks/context";

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

// Same "only query if a block might need it" shape as
// hasCustomComponentTag above, for the "form" block instead.
function hasFormBlock(blocks: BlockInstance[]): boolean {
  return blocks.some((b) => b.type === "form" || ("children" in b && hasFormBlock(b.children)));
}

export const dynamic = "force-dynamic";

// docs/08 SEO: title/subtitle only — never invite/guest data (this only
// ever reads the event row) — and always `noindex` (guest pages are
// semi-private; robots.ts also disallows crawling /e/ entirely, this is
// the per-page belt-and-suspenders). A draft's real title is withheld too,
// on the same "nothing about a draft leaks before the host publishes it"
// principle as the page body's own draft/preview check below — so a draft
// also gets no og:image (opengraph-image.tsx below has its own matching
// draft/not-found fallback, but link previews shouldn't hit it at all
// while noindex/notFound already keep drafts out of reach).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlugPublic(slug);

  if (!event || event.status === "draft") {
    return { title: "ahvaan", robots: { index: false, follow: false } };
  }

  const title = event.title;
  const description = event.subtitle || `You're invited to ${event.title}.`;
  // A relative path resolves against root layout.tsx's `metadataBase` — a
  // host's own upload (cover_image_url) is already an absolute Supabase
  // Storage URL, so takes precedence untouched; otherwise this event's own
  // route segment doubles as the fallback image endpoint (see the sibling
  // opengraph-image.tsx file, which Next serves at this same path).
  const image = event.cover_image_url || `/events/${slug}/opengraph-image`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "ahvaan",
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ i?: string; preview?: string; verified?: string; vtype?: string; vform?: string; verifyError?: string }>;
}) {
  const { slug } = await params;
  const { i: invite, preview, verified, vtype, vform, verifyError } = await searchParams;

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

  // A no-invite guest who's already passed the page-level "verify your
  // email once for this event" gate (src/lib/guest-session.ts's cookie,
  // set by src/lib/guest-verification.ts on success) — every RSVP/Forms
  // block treats this exactly like having an invite for identity
  // purposes, prefilled the same way. Only trusted while the event is
  // still in 'email_verified' mode: a host can switch modes after a guest
  // already verified, and the cookie (valid up to 30 days) would otherwise
  // outlive that choice — e.g. under 'anonymous' mode every submit is a
  // fresh insert (see rsvp-submit.ts/form-submit.ts), so prefilling from a
  // stale verified email here would show one guest's old answers as if
  // they were about to edit them in place, while the actual submit path
  // silently inserts a brand-new row instead of updating it.
  const submissionMode = parseSubmissionMode(event.submission_mode);
  const verifiedEmail = inviteId || submissionMode !== "email_verified" ? null : await getVerifiedGuestEmail(event.id);
  if (!initialResponses && verifiedEmail) {
    initialResponses = await getResponsesForEmail(schema, event.id, verifiedEmail);
  }

  // Fallback path (rare): a guest verified via the older per-form
  // submit-with-payload flow (no page-level gate cookie involved — used
  // only by the no-JS embedded-HTML-form API route, see
  // rsvp-submit.ts's OTP-with-payload branch) and just clicked that magic
  // link (redirected back here with `?verified=<id>`). getVerifiedRsvpResponses
  // re-checks the verification actually was consumed before trusting this,
  // so a guest can't just paste a random id into the URL.
  if (!initialResponses && verified && vtype === "rsvp") {
    const responses = await getVerifiedRsvpResponses(schema, event.id, verified);
    if (responses) {
      initialResponses = responses;
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

  const needsForms = hasFormBlock(pageSchema.blocks);
  const customForms: CustomFormMap = needsForms
    ? Object.fromEntries((await listFormsForEventPublic(event.id)).map((f) => [f.id, f]))
    : {};
  // 'private'-mode prefill-on-return, batched across every form on the
  // page in one query — only meaningful once we know who the guest is.
  const customFormResponses: CustomFormResponsesMap =
    needsForms && inviteId ? await listSubmissionsForInvitePublic(event.id, inviteId) : {};

  // Same page-level verified-email prefill as RSVP above, batched across
  // every form on the page in one query.
  if (needsForms && verifiedEmail) {
    Object.assign(customFormResponses, await listSubmissionsForEmailPublic(event.id, verifiedEmail));
  }

  // Fallback path (rare) mirroring the RSVP one above, for whichever one
  // specific form the guest verified against via the older per-form
  // submit-with-payload flow (vform) — a page can embed several forms,
  // only one of which that particular link was ever about.
  if (needsForms && verified && vtype === "form" && vform) {
    const responses = await getVerifiedFormResponses(vform, verified);
    if (responses) {
      customFormResponses[vform] = responses;
    }
  }

  const hostProfile = await getHostProfilePublic(event.host_id);

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
        <div className="fixed bottom-4 left-4 right-4 z-10 flex justify-center sm:left-auto sm:right-4 sm:justify-end">
          <div className="max-w-xs rounded-xl border border-[#E7E4DD] bg-white/95 px-4 py-3 text-center shadow-md backdrop-blur">
            {hostProfile && (hostProfile.display_name || hostProfile.bio || hostProfile.avatar_url) && (
              <div className="mb-2 flex flex-col items-center gap-1.5">
                {hostProfile.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hostProfile.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full border border-[#E7E4DD] object-cover"
                  />
                )}
                {hostProfile.display_name && (
                  <p className="text-xs font-medium text-[#211E19]/80">Hosted by {hostProfile.display_name}</p>
                )}
              </div>
            )}
            <p className="text-[10px] leading-relaxed text-[#211E19]/50">
              This page and any data collected here are managed solely by its host — ahvaan
              provides the platform only.
            </p>
            <Link
              href="/"
              className="mt-2 flex items-center justify-center gap-1.5 text-sm font-medium tracking-wide text-[#211E19]/80 hover:text-[#211E19]"
            >
              Made with
              <BrandLockup className="inline-flex items-center gap-1 text-foreground" markClassName="h-4 w-4" textClassName="text-sm font-medium" />
            </Link>
          </div>
        </div>
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
      {verifyError && (
        <p className="bg-[color-mix(in_oklab,var(--warning)_15%,transparent)] py-1.5 text-center text-xs font-medium text-[var(--warning)]">
          {verifyError}
        </p>
      )}
      <VerificationBroadcaster verificationId={verified ?? null} />
      <PageRenderer
        schema={pageSchema}
        ctx={{
          event,
          inviteId,
          guestName,
          schema,
          initialResponses,
          customComponents,
          customForms,
          customFormResponses,
          verifiedEmail,
        }}
      />
      {verifiedEmail && <GuestIdentityFooter eventId={event.id} email={verifiedEmail} />}
      <PublicHostCard profile={hostProfile} />
      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 pb-8 text-sm tracking-wide text-[var(--t-fg)]/60 hover:text-[var(--t-fg)]/90"
      >
        Made with
        <BrandLockup
          className="inline-flex items-center gap-1 text-foreground"
          markClassName="h-4 w-4 opacity-70"
          textClassName="text-sm font-normal underline decoration-dotted underline-offset-2"
        />
      </Link>
    </div>
  );
}
