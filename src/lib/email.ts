import { Resend } from "resend";
import { buildInviteLink } from "@/components/guest-dashboard/invite-link";
import { getEventTypeLabel } from "@/lib/event-types";
import type { EventRecord } from "@/lib/data/events";
import { isUnsubscribed } from "@/lib/data/email-unsubscribes";
import { signUnsubscribeToken } from "@/lib/unsubscribe-token";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

// Constructed lazily (not at module load) so importing this file never fails
// just because Resend isn't configured yet — only actually sending an email
// requires RESEND_API_KEY.
function getResendClient() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

// Deliverability: a bare address with no display name (RESEND_FROM_EMAIL is
// just an address, e.g. "noreply@ahvaan.tejanarra.space") renders in most
// inbox lists as the raw address instead of a recognizable brand name —
// wrapping it here means every send gets "ahvaan <...>" regardless of how
// the env var itself is set, with no risk of double-wrapping if it's ever
// changed to already include one.
function fromAddress() {
  const raw = requireEnv("RESEND_FROM_EMAIL");
  return raw.includes("<") ? raw : `ahvaan <${raw}>`;
}

// Same support inbox linked from the Privacy Policy (src/app/privacy/page.tsx)
// — every outgoing email sets this as Reply-To so a guest or host hitting
// "reply" reaches a monitored inbox instead of bouncing off RESEND_FROM_EMAIL
// (typically a noreply@ address with nobody reading it).
const SUPPORT_EMAIL = "support@ahvaan.tejanarra.space";

// One signed, no-login-required unsubscribe link embedded in every email
// this product sends about a specific event (invite, reminder,
// verification) — see src/lib/unsubscribe-token.ts and
// supabase/schema-saas.sql's email_unsubscribes table comment for why it's
// scoped per-event rather than a single global opt-out.
function unsubscribeUrl(eventId: string, hostId: string, email: string): string {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const token = signUnsubscribeToken(eventId, hostId, email);
  return `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

type InviteEmailTarget = {
  id: string;
  name: string;
  email: string;
};

function eventDateLine(event: EventRecord) {
  if (!event.event_date) return null;
  const date = new Date(`${event.event_date}T00:00:00`);
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return event.event_time ? `${formatted} at ${event.event_time}` : formatted;
}

// docs/04 "paper & ink" tokens, hand-copied (email clients strip CSS custom
// properties, so these have to be literal hex) — same palette the rest of
// the product uses, not a generic gray/black scheme. Also mirrored (kept in
// sync by hand — see scripts/build-auth-email-templates.mjs) in the
// Supabase Auth email templates under supabase/email-templates/, so every
// email this product sends, whether via Resend or Supabase's own auth
// mailer, reads as the same brand.
const INK = "#211E19";
const MUTED = "#6E6A61";
const MUTED_FOREGROUND = "#A3A099";
const ACCENT = "#2F5D46";
const ACCENT_FOREGROUND = "#FFFFFF";
const BACKGROUND = "#FBFAF8";
const SURFACE = "#FFFFFF";
const BORDER = "#E7E4DD";

// Fraunces (the product's actual display face) isn't a web font any email
// client will load — Georgia is the closest widely-supported serif
// fallback, used only for the heading exactly like Fraunces is reserved
// for headings elsewhere in the product.
const DISPLAY_FONT_STACK = "Georgia, 'Times New Roman', serif";
const BODY_FONT_STACK = "Arial, Helvetica, sans-serif";

// The one shared card shell every email in this product renders inside —
// wordmark header, heading, arbitrary body HTML, optional CTA button,
// hairline-divided footer. `deliverInviteEmail`/`deliverReminderEmail` and
// `deliverVerificationEmail` used to each hand-roll a near-identical copy
// of this; a single function means the two can never drift apart again.
function emailFrame({
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerText = "Sent via ahvaan",
  unsubscribeLink,
}: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerText?: string;
  // Every event-related email passes this (see unsubscribeUrl above) —
  // optional only so emailFrame itself doesn't hard-require an eventId,
  // since it's a generic shell reused by non-event emails too.
  unsubscribeLink?: string;
}) {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");

  return `
    <div style="background: ${BACKGROUND}; padding: 32px 16px; font-family: ${BODY_FONT_STACK};">
      <table role="presentation" width="100%" style="max-width: 480px; margin: 0 auto; background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 12px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 32px 32px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 6px; vertical-align: middle;">
                  <a href="${siteUrl}"><img src="${siteUrl}/icon.png" width="20" height="20" alt="ahvaan" style="display: block; border-radius: 4px;" /></a>
                </td>
                <td style="vertical-align: middle;">
                  <a href="${siteUrl}" style="font-family: ${DISPLAY_FONT_STACK}; font-size: 18px; color: ${INK}; text-decoration: none;">ahvaan</a>
                </td>
                <td style="vertical-align: middle; padding-left: 8px;">
                  <span style="font-size: 12px; color: ${MUTED};">Invitations made easy</span>
                </td>
              </tr>
            </table>
            <h1 style="font-family: ${DISPLAY_FONT_STACK}; font-weight: normal; font-size: 22px; margin: 24px 0 12px; color: ${INK};">${heading}</h1>
            ${bodyHtml}
            ${
              ctaUrl
                ? `<p style="margin-top: 20px;">
              <a href="${ctaUrl}" style="display: inline-block; background: ${ACCENT}; color: ${ACCENT_FOREGROUND}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">${ctaLabel}</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: ${MUTED_FOREGROUND}; word-break: break-all;">Or copy this link: ${ctaUrl}</p>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 28px;">
            <hr style="border: none; border-top: 1px solid ${BORDER}; margin: 0 0 16px;" />
            <a href="${siteUrl}" style="font-size: 12px; color: ${MUTED}; text-decoration: none;">${footerText}</a>
            ${
              unsubscribeLink
                ? `<span style="font-size: 12px; color: ${MUTED_FOREGROUND};"> · </span><a href="${unsubscribeLink}" style="font-size: 12px; color: ${MUTED_FOREGROUND}; text-decoration: underline;">Unsubscribe</a>`
                : ""
            }
          </td>
        </tr>
      </table>
    </div>
  `;
}

function emailShell(event: EventRecord, invite: InviteEmailTarget, heading: string, body: string, unsubscribeLink: string) {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const link = buildInviteLink(event.slug, invite.id, siteUrl);
  const dateLine = eventDateLine(event);

  const bodyHtml = `
    <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: ${MUTED}; margin: -8px 0 16px;">
      ${getEventTypeLabel(event.event_type)}
    </p>
    <p style="font-size: 16px; line-height: 1.5; color: ${INK}; margin: 0;">${body}</p>
    ${
      dateLine || event.venue_name
        ? `<p style="font-size: 14px; color: ${MUTED}; margin: 12px 0 0;">${[dateLine, event.venue_name]
            .filter(Boolean)
            .join(" — ")}</p>`
        : ""
    }
  `;

  return emailFrame({
    heading: event.title,
    bodyHtml,
    ctaLabel: heading,
    ctaUrl: link,
    footerText: "Sent via ahvaan — create your own invite",
    unsubscribeLink,
  });
}

// Every HTML email needs a plain-text alternative (docs/08) — spam filters
// weigh its absence, and it's the only version some clients show at all.
// Same content, no markup.
function emailPlainText(event: EventRecord, invite: InviteEmailTarget, body: string, unsubscribeLink: string) {
  const link = buildInviteLink(event.slug, invite.id, requireEnv("NEXT_PUBLIC_SITE_URL"));
  const dateLine = eventDateLine(event);
  const details = [dateLine, event.venue_name].filter(Boolean).join(" — ");

  return [event.title, "", body, details, "", link, "", `Unsubscribe: ${unsubscribeLink}`]
    .filter((line) => line !== "")
    .join("\n");
}

// Both invite and reminder check the suppression list before sending and
// return `{ sent: false }` instead of throwing when suppressed — a
// deliberate no-op, not an error, so a bulk reminder loop
// (sendReminderEmails in dashboard/events/[eventId]/actions.ts) can log it
// distinctly ("suppressed") rather than counting it as failed.
export async function deliverInviteEmail(event: EventRecord, invite: InviteEmailTarget): Promise<{ sent: boolean }> {
  if (await isUnsubscribed(event.id, invite.email)) return { sent: false };

  const resend = getResendClient();
  const body = `Hi ${invite.name}, you're invited! Please RSVP using the button below.`;
  const unsubscribeLink = unsubscribeUrl(event.id, event.host_id, invite.email);

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: invite.email,
    replyTo: SUPPORT_EMAIL,
    headers: { "List-Unsubscribe": `<${unsubscribeLink}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>` },
    subject: `You're invited: ${event.title}`,
    html: emailShell(event, invite, "RSVP now", body, unsubscribeLink),
    text: emailPlainText(event, invite, body, unsubscribeLink),
  });

  if (error) {
    throw new Error(error.message);
  }
  return { sent: true };
}

export async function deliverReminderEmail(event: EventRecord, invite: InviteEmailTarget): Promise<{ sent: boolean }> {
  if (await isUnsubscribed(event.id, invite.email)) return { sent: false };

  const resend = getResendClient();
  const body = `Hi ${invite.name}, just a friendly reminder to RSVP for ${event.title} if you haven't already.`;
  const unsubscribeLink = unsubscribeUrl(event.id, event.host_id, invite.email);

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: invite.email,
    replyTo: SUPPORT_EMAIL,
    headers: { "List-Unsubscribe": `<${unsubscribeLink}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>` },
    subject: `Reminder: RSVP for ${event.title}`,
    html: emailShell(event, invite, "RSVP now", body, unsubscribeLink),
    text: emailPlainText(event, invite, body, unsubscribeLink),
  });

  if (error) {
    throw new Error(error.message);
  }
  return { sent: true };
}

// Guest-facing verification for the 'email_verified' submission mode (RSVP
// and generic Forms both send through this one function) — deliberately
// not built on emailShell/InviteEmailTarget above, since there's no invite
// (no invite-link CTA makes sense here, and the recipient may not have one
// at all in email_verified mode). Leads with a clickable magic link (see
// src/app/events/[slug]/verify/route.ts) — clicking it finishes
// verification directly, no code to type — but the raw code is also shown
// as text, both as a fallback for email clients that strip links/buttons
// and for the no-JS embedded-form path (src/app/api/rsvp/route.ts,
// src/app/api/forms/[formId]/route.ts), which has no way to auto-detect a
// clicked link and asks the guest to type the code instead.
export async function deliverVerificationEmail(
  email: string,
  verifyUrl: string,
  code: string,
  subjectTitle: string,
  event: { id: string; host_id: string }
) {
  const resend = getResendClient();
  const unsubscribeLink = unsubscribeUrl(event.id, event.host_id, email);

  const bodyHtml = `
    <p style="font-size: 16px; line-height: 1.5; color: ${INK}; margin: 0;">Click below to verify your email and finish:</p>
    <p style="font-size: 14px; color: ${MUTED}; margin: 16px 0 0;">Or enter this code where you started: <strong style="letter-spacing: 0.1em;">${code}</strong></p>
    <p style="font-size: 14px; color: ${MUTED}; margin: 8px 0 0;">This expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  `;

  const html = emailFrame({ heading: subjectTitle, bodyHtml, ctaLabel: "Verify email", ctaUrl: verifyUrl, unsubscribeLink });
  const text = `${subjectTitle}\n\nVerify: ${verifyUrl}\n\nOr enter this code where you started: ${code}\n\nThis expires in 10 minutes. If you didn't request this, you can ignore this email.\n\nUnsubscribe: ${unsubscribeLink}`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: email,
    replyTo: SUPPORT_EMAIL,
    headers: { "List-Unsubscribe": `<${unsubscribeLink}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>` },
    subject: "Verify your email to finish",
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// Double opt-in for the resubscribe self-service form (src/app/resubscribe)
// — sent only after that form's rate limit check passes; clicking the link
// is what actually clears every event's suppression for this address (see
// src/lib/resubscribe.ts), not the form submission itself, since the form
// only collects an email with no proof anyone owns that inbox.
export async function deliverResubscribeConfirmationEmail(email: string, confirmUrl: string) {
  const resend = getResendClient();

  const bodyHtml = `
    <p style="font-size: 16px; line-height: 1.5; color: ${INK}; margin: 0;">Click below to start receiving event emails at this address again.</p>
    <p style="font-size: 14px; color: ${MUTED}; margin: 16px 0 0;">This link expires in an hour. If you didn't request this, you can ignore this email — nothing changes until it's clicked.</p>
  `;

  const html = emailFrame({ heading: "Resubscribe to event emails", bodyHtml, ctaLabel: "Resubscribe", ctaUrl: confirmUrl });
  const text = `Resubscribe to event emails\n\nClick to confirm: ${confirmUrl}\n\nThis link expires in an hour. If you didn't request this, you can ignore this email — nothing changes until it's clicked.`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: email,
    replyTo: SUPPORT_EMAIL,
    subject: "Confirm: resubscribe to event emails",
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }
}
