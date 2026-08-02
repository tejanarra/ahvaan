import { Resend } from "resend";
import { buildInviteLink } from "@/components/guest-dashboard/invite-link";
import { getEventTypeLabel } from "@/lib/event-types";
import type { EventRecord } from "@/lib/data/events";

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
// the product uses, not a generic gray/black scheme.
const INK = "#211E19";
const MUTED = "#6E6A61";
const MUTED_FOREGROUND = "#A3A099";
const ACCENT = "#2F5D46";
const ACCENT_FOREGROUND = "#FFFFFF";
const BORDER = "#E7E4DD";

// Fraunces (the product's actual display face) isn't a web font any email
// client will load — Georgia is the closest widely-supported serif
// fallback, used only for the heading exactly like Fraunces is reserved
// for headings elsewhere in the product.
const DISPLAY_FONT_STACK = "Georgia, 'Times New Roman', serif";
const BODY_FONT_STACK = "Arial, Helvetica, sans-serif";

function emailShell(event: EventRecord, invite: InviteEmailTarget, heading: string, body: string) {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const link = buildInviteLink(event.slug, invite.id, siteUrl);
  const dateLine = eventDateLine(event);

  return `
    <div style="font-family: ${BODY_FONT_STACK}; max-width: 480px; margin: 0 auto; color: ${INK};">
      <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: ${MUTED};">
        ${getEventTypeLabel(event.event_type)}
      </p>
      <h1 style="font-family: ${DISPLAY_FONT_STACK}; font-weight: normal; font-size: 26px; margin: 4px 0 16px;">
        ${event.title}
      </h1>
      <p style="font-size: 16px; line-height: 1.5;">${body}</p>
      ${
        dateLine || event.venue_name
          ? `<p style="font-size: 14px; color: ${MUTED};">${[dateLine, event.venue_name]
              .filter(Boolean)
              .join(" — ")}</p>`
          : ""
      }
      <p style="margin-top: 24px;">
        <a href="${link}" style="display: inline-block; background: ${ACCENT}; color: ${ACCENT_FOREGROUND}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
          ${heading}
        </a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: ${MUTED_FOREGROUND};">
        Or copy this link: ${link}
      </p>
      <hr style="margin-top: 24px; border: none; border-top: 1px solid ${BORDER};" />
      <table role="presentation" style="margin-top: 16px;">
        <tr>
          <td style="vertical-align: middle; padding-right: 6px;">
            <a href="${siteUrl}"><img src="${siteUrl}/icon.png" width="18" height="18" alt="ahvaan" style="display: block;" /></a>
          </td>
          <td style="vertical-align: middle;">
            <a href="${siteUrl}" style="font-size: 12px; color: ${MUTED}; text-decoration: none;">Sent via ahvaan — create your own invite</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Every HTML email needs a plain-text alternative (docs/08) — spam filters
// weigh its absence, and it's the only version some clients show at all.
// Same content, no markup.
function emailPlainText(event: EventRecord, invite: InviteEmailTarget, body: string) {
  const link = buildInviteLink(event.slug, invite.id, requireEnv("NEXT_PUBLIC_SITE_URL"));
  const dateLine = eventDateLine(event);
  const details = [dateLine, event.venue_name].filter(Boolean).join(" — ");

  return [event.title, "", body, details, "", link].filter((line) => line !== "").join("\n");
}

export async function deliverInviteEmail(event: EventRecord, invite: InviteEmailTarget) {
  const resend = getResendClient();
  const from = requireEnv("RESEND_FROM_EMAIL");
  const body = `Hi ${invite.name}, you're invited! Please RSVP using the button below.`;

  const { error } = await resend.emails.send({
    from,
    to: invite.email,
    subject: `You're invited: ${event.title}`,
    html: emailShell(event, invite, "RSVP now", body),
    text: emailPlainText(event, invite, body),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deliverReminderEmail(event: EventRecord, invite: InviteEmailTarget) {
  const resend = getResendClient();
  const from = requireEnv("RESEND_FROM_EMAIL");
  const body = `Hi ${invite.name}, just a friendly reminder to RSVP for ${event.title} if you haven't already.`;

  const { error } = await resend.emails.send({
    from,
    to: invite.email,
    subject: `Reminder: RSVP for ${event.title}`,
    html: emailShell(event, invite, "RSVP now", body),
    text: emailPlainText(event, invite, body),
  });

  if (error) {
    throw new Error(error.message);
  }
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
export async function deliverVerificationEmail(email: string, verifyUrl: string, code: string, subjectTitle: string) {
  const resend = getResendClient();
  const from = requireEnv("RESEND_FROM_EMAIL");
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");

  const html = `
    <div style="font-family: ${BODY_FONT_STACK}; max-width: 480px; margin: 0 auto; color: ${INK};">
      <h1 style="font-family: ${DISPLAY_FONT_STACK}; font-weight: normal; font-size: 22px; margin: 4px 0 16px;">
        ${subjectTitle}
      </h1>
      <p style="font-size: 16px; line-height: 1.5;">Click below to verify your email and finish:</p>
      <p style="margin-top: 16px;">
        <a href="${verifyUrl}" style="display: inline-block; background: ${ACCENT}; color: ${ACCENT_FOREGROUND}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
          Verify email
        </a>
      </p>
      <p style="font-size: 14px; color: ${MUTED};">Or enter this code where you started: <strong style="letter-spacing: 0.1em;">${code}</strong></p>
      <p style="font-size: 14px; color: ${MUTED};">This expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      <hr style="margin-top: 24px; border: none; border-top: 1px solid ${BORDER};" />
      <table role="presentation" style="margin-top: 16px;">
        <tr>
          <td style="vertical-align: middle; padding-right: 6px;">
            <a href="${siteUrl}"><img src="${siteUrl}/icon.png" width="18" height="18" alt="ahvaan" style="display: block;" /></a>
          </td>
          <td style="vertical-align: middle;">
            <a href="${siteUrl}" style="font-size: 12px; color: ${MUTED}; text-decoration: none;">Sent via ahvaan</a>
          </td>
        </tr>
      </table>
    </div>
  `;
  const text = `${subjectTitle}\n\nVerify: ${verifyUrl}\n\nOr enter this code where you started: ${code}\n\nThis expires in 10 minutes. If you didn't request this, you can ignore this email.`;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Verify your email to finish",
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }
}
