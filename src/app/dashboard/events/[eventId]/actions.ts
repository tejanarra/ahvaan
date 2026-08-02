"use server";

import { requireHost } from "@/lib/supabase/auth-server";
import { deliverInviteEmail, deliverReminderEmail } from "@/lib/email";
import {
  getEventFull,
  updateFormSchema as updateFormSchemaData,
  updatePageSchema as updatePageSchemaData,
  updateRsvpActions as updateRsvpActionsData,
  updateSubmissionMode as updateSubmissionModeData,
} from "@/lib/data/events";
import { parsePostSubmitActionStrict } from "@/lib/schemas/post-submit-actions";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";
import { parseSubmissionMode } from "@/lib/schemas/submission-mode";
import * as invitesData from "@/lib/data/invites";
import * as rsvpsData from "@/lib/data/rsvps";
import * as formsData from "@/lib/data/forms";
import { ensureCustomFormEmailField } from "@/lib/forms/registry";
import { logEmailSend, logEmailSends } from "@/lib/data/email-log";
import { NotFoundError } from "@/lib/data/errors";
import { resolveFormSchema, deriveLegacyScalars, enforceRoleLock, ensureEmailField } from "@/lib/schemas/form-schema";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";
import { sanitizeResponses, validateResponses, assertResponsesWithinSizeBudget } from "@/lib/schemas/responses";
import { parsePageSchema } from "@/lib/schemas/page-schema";
import type { PageSchema, BlockInstance, CustomHtmlConfig } from "@/lib/blocks/types";
import { parseCustomComponentInput } from "@/lib/schemas/custom-component";
import { upsertComponentByName } from "@/lib/data/custom-components";
import { uploadEventImage } from "@/lib/data/storage";

export async function createInvite(eventId: string, name: string, email?: string) {
  const host = await requireHost();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Guest name is required.");
  }

  return invitesData.createInvite(host.id, eventId, trimmed, email?.trim() || null);
}

export async function deleteInvite(eventId: string, inviteId: string) {
  const host = await requireHost();
  await invitesData.deleteInvite(host.id, eventId, inviteId);
}

export async function deleteRsvp(eventId: string, rsvpId: string) {
  const host = await requireHost();
  await rsvpsData.deleteRsvp(host.id, eventId, rsvpId);
}

export async function updateRsvp(eventId: string, rsvpId: string, rawResponses: Responses) {
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) throw new NotFoundError("Event not found.");

  const schema = resolveFormSchema(event.form_schema);
  const responses = sanitizeResponses(schema, rawResponses);
  assertResponsesWithinSizeBudget(responses);
  validateResponses(schema, responses);
  const existingName = await rsvpsData.getRsvpName(host.id, eventId, rsvpId);
  const scalars = deriveLegacyScalars(schema, responses, existingName ?? undefined);

  await rsvpsData.updateRsvp(host.id, eventId, rsvpId, responses, scalars);
}

export async function updateFormSchema(eventId: string, rawSchema: FormSchema) {
  const host = await requireHost();

  // Never trust a role-tagged field's type/options from the request as-is —
  // force them back to the canonical shape for that role (e.g. role
  // "attending" is always a yes/no radio), so a crafted or buggy client
  // can't silently break stats/derivation that assume the role is
  // trustworthy (see deriveLegacyScalars).
  const schema: FormSchema = { fields: rawSchema.fields.map(enforceRoleLock) };

  const roles = schema.fields.map((f) => f.role).filter((r): r is "name" | "attending" | "plus_ones" => r !== null);
  if (new Set(roles).size !== roles.length) {
    throw new Error("Only one field can be tagged for each of name/attending/plus-ones.");
  }
  const ids = schema.fields.map((f) => f.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Field ids must be unique.");
  }
  for (const field of schema.fields) {
    if (!field.label.trim()) {
      throw new Error("Every field needs a label.");
    }
    if (field.type === "select" || field.type === "radio" || field.type === "checkbox") {
      // Every option must be non-empty and distinct — both a rendering
      // correctness issue (option components key off the option string
      // itself; a blank or duplicate value collides with another option or
      // the select's own placeholder) and a data-integrity one (two
      // identically-valued options are indistinguishable once saved).
      const trimmed = (field.options ?? []).map((o) => o.trim());
      if (trimmed.length === 0 || trimmed.some((o) => !o)) {
        throw new Error(`"${field.label}" needs every option to be non-empty.`);
      }
      if (new Set(trimmed).size !== trimmed.length) {
        throw new Error(`"${field.label}" has duplicate options.`);
      }
    }
  }

  await updateFormSchemaData(host.id, eventId, schema);
}

export async function sendInviteEmailAction(eventId: string, inviteId: string): Promise<{ sent: boolean }> {
  const host = await requireHost();

  const [event, invite] = await Promise.all([
    getEventFull(host.id, eventId),
    invitesData.getEmailableInvite(host.id, eventId, inviteId),
  ]);
  if (!event) throw new NotFoundError("Event not found.");

  let result: { sent: boolean };
  try {
    result = await deliverInviteEmail(event, invite);
  } catch (err) {
    await logEmailSend({
      hostId: host.id,
      eventId,
      inviteId: invite.id,
      kind: "invite",
      status: "failed",
      error: err instanceof Error ? err.message : undefined,
    });
    throw err;
  }

  await logEmailSend({
    hostId: host.id,
    eventId,
    inviteId: invite.id,
    kind: "invite",
    status: result.sent ? "sent" : "suppressed",
  });
  return result;
}

export async function sendReminderEmails(eventId: string) {
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) throw new NotFoundError("Event not found.");

  const respondedInviteIds = await rsvpsData.listRespondedInviteIds(host.id, eventId);
  const pending = await invitesData.listPendingInvitesWithEmail(host.id, eventId, respondedInviteIds);

  // Sends stay sequential (respecting the email provider's own rate
  // limits), but the resulting audit-log rows are batched into one insert
  // at the end instead of one round trip per invite (docs-audit M11).
  let sent = 0;
  let suppressed = 0;
  const logEntries: Array<{
    hostId: string;
    eventId: string;
    inviteId: string;
    kind: "reminder";
    status: "sent" | "failed" | "suppressed";
    error?: string;
  }> = [];
  for (const invite of pending) {
    try {
      const result = await deliverReminderEmail(event, invite);
      logEntries.push({ hostId: host.id, eventId, inviteId: invite.id, kind: "reminder", status: result.sent ? "sent" : "suppressed" });
      if (result.sent) sent += 1;
      else suppressed += 1;
    } catch (err) {
      logEntries.push({
        hostId: host.id,
        eventId,
        inviteId: invite.id,
        kind: "reminder",
        status: "failed",
        error: err instanceof Error ? err.message : undefined,
      });
    }
  }
  // Best-effort: the reminders themselves are already sent by this point
  // (or recorded as failed above) — a problem writing the audit log alone
  // (e.g. one bad row in the batch) shouldn't make this action throw and
  // read to the host as "reminders failed to send" when they didn't.
  try {
    await logEmailSends(logEntries);
  } catch (err) {
    console.error(`Failed to log ${logEntries.length} email_sends rows for event ${eventId}:`, err);
  }

  return { sent, suppressed, total: pending.length };
}

export async function uploadImage(eventId: string, formData: FormData) {
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) throw new NotFoundError("Event not found.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image file provided.");
  }

  return uploadEventImage(host.id, eventId, file);
}

export async function updatePageSchema(eventId: string, schema: PageSchema) {
  const host = await requireHost();

  // The page builder is a client component — the `PageSchema` type only
  // constrains what TypeScript lets *this app's own UI* send, not what a
  // Server Action actually receives over the wire. Every other JSONB write
  // path (updateFormSchema above) re-validates server-side before persisting
  // rather than trusting the client-typed shape; this one didn't, which is
  // exactly the "never as-cast" JSONB invariant this data is supposed to
  // honor. parsePageSchema is the same validator the read path already
  // trusts (page.tsx, the public /events/[slug] page) — reused here so corrupt
  // blocks are dropped (or the whole write rejected, if nothing valid
  // remains) before ever reaching the database, not just after reading it
  // back.
  const validated = parsePageSchema(schema);
  if (!validated) {
    throw new Error("That page layout isn't valid — nothing was saved.");
  }

  await updatePageSchemaData(host.id, eventId, validated);

  // A host makes a Custom HTML/CSS/JS block reusable purely by naming it
  // (see CustomHtmlEdit's "Reusable name" field) — no separate save action,
  // it just piggybacks on this normal page save. Every named block, at any
  // nesting depth, upserts into the host's shared component library so
  // <custom-component name="..."> tags anywhere (this event or any other)
  // pick up the latest version. A validation failure on one named block
  // (e.g. an empty name after trimming) is skipped rather than failing the
  // whole page save — the page itself already saved successfully above.
  for (const named of findNamedCustomHtmlBlocks(validated.blocks)) {
    const result = parseCustomComponentInput(named);
    if (result.ok) {
      await upsertComponentByName(host.id, result.value);
    }
  }
}

export async function updateRsvpActionsAction(eventId: string, rawAction: PostSubmitAction) {
  const host = await requireHost();
  const action = parsePostSubmitActionStrict(rawAction);
  await updateRsvpActionsData(host.id, eventId, action);
}

// One event-wide setting (events.submission_mode) governing BOTH the RSVP
// form and every generic Forms form under this event — not a separate
// per-form choice (see src/lib/data/forms.ts's comment on why Forms
// dropped its own independent submission_mode column).
export async function updateSubmissionModeAction(eventId: string, rawMode: unknown) {
  const host = await requireHost();
  const mode = parseSubmissionMode(rawMode);
  await updateSubmissionModeData(host.id, eventId, mode);

  // 'email_verified' needs a trustworthy email value to dedup/key
  // submissions by — seed one into RSVP's schema, and into every form on
  // this event, if missing, so switching modes is a single click rather
  // than a manual "now add an Email field" step repeated per form (see
  // ensureEmailField/ensureCustomFormEmailField's own comments).
  if (mode === "email_verified") {
    const event = await getEventFull(host.id, eventId);
    if (event) {
      const schema = resolveFormSchema(event.form_schema);
      const updated = ensureEmailField(schema);
      if (updated !== schema) {
        await updateFormSchemaData(host.id, eventId, updated);
      }
    }

    const forms = await formsData.listForms(host.id, eventId);
    // Each form's update is independent of every other's — run concurrently
    // instead of one at a time (docs-audit M11).
    await Promise.all(
      forms.map((form) => {
        const updated = ensureCustomFormEmailField(form.schema);
        return updated !== form.schema ? formsData.updateFormSchema(host.id, eventId, form.id, updated) : null;
      })
    );
  }
}

function findNamedCustomHtmlBlocks(blocks: BlockInstance[]): { name: string; html: string; css: string; js: string }[] {
  const found: { name: string; html: string; css: string; js: string }[] = [];
  for (const block of blocks) {
    if (block.type === "custom-html") {
      const config = block.config as CustomHtmlConfig;
      if (config.reusableName) {
        found.push({ name: config.reusableName, html: config.html, css: config.css, js: config.js });
      }
    }
    if ("children" in block) {
      found.push(...findNamedCustomHtmlBlocks(block.children));
    }
  }
  return found;
}
