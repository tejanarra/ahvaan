import { Resend } from "resend";
import { buildInviteLink } from "@/components/guest-dashboard/invite-link";
import { getEventTypeLabel } from "@/lib/event-types";
import type { EventRecord } from "@/lib/event";

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

function emailShell(event: EventRecord, invite: InviteEmailTarget, heading: string, body: string) {
  const link = buildInviteLink(event.slug, invite.id, requireEnv("NEXT_PUBLIC_SITE_URL"));
  const dateLine = eventDateLine(event);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #18181b;">
      <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: #71717a;">
        ${getEventTypeLabel(event.event_type)}
      </p>
      <h1 style="font-size: 24px; margin: 4px 0 16px;">${event.title}</h1>
      <p style="font-size: 16px; line-height: 1.5;">${body}</p>
      ${
        dateLine || event.venue_name
          ? `<p style="font-size: 14px; color: #52525b;">${[dateLine, event.venue_name]
              .filter(Boolean)
              .join(" — ")}</p>`
          : ""
      }
      <p style="margin-top: 24px;">
        <a href="${link}" style="display: inline-block; background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
          ${heading}
        </a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #a1a1aa;">
        Or copy this link: ${link}
      </p>
    </div>
  `;
}

export async function sendInviteEmail(event: EventRecord, invite: InviteEmailTarget) {
  const resend = getResendClient();
  const from = requireEnv("RESEND_FROM_EMAIL");

  const { error } = await resend.emails.send({
    from,
    to: invite.email,
    subject: `You're invited: ${event.title}`,
    html: emailShell(
      event,
      invite,
      "RSVP now",
      `Hi ${invite.name}, you're invited! Please RSVP using the button below.`
    ),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendReminderEmail(event: EventRecord, invite: InviteEmailTarget) {
  const resend = getResendClient();
  const from = requireEnv("RESEND_FROM_EMAIL");

  const { error } = await resend.emails.send({
    from,
    to: invite.email,
    subject: `Reminder: RSVP for ${event.title}`,
    html: emailShell(
      event,
      invite,
      "RSVP now",
      `Hi ${invite.name}, just a friendly reminder to RSVP for ${event.title} if you haven't already.`
    ),
  });

  if (error) {
    throw new Error(error.message);
  }
}
