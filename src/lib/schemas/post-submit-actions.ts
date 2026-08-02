import { z } from "zod";
import type { RsvpFormBlockConfig, LegacyRsvpConfirmationFields } from "@/lib/blocks/types";

// What happens right after a guest submits — shared shape for both the
// RSVP form (events.rsvp_actions) and every generic form (forms.actions),
// so one editor UI and one renderer serve both instead of drifting into
// two implementations of the same idea. `showVenue` only ever renders for
// the RSVP context (only events carry venue data) — the shared editor
// hides that toggle via a prop, not a schema difference, so the stored
// shape stays identical either way.
export type PostSubmitAction =
  | {
      kind: "message";
      heading: string;
      message: string;
      showVenue?: boolean;
      // RSVP-only: when set, a guest who declined sees this heading instead
      // of `heading` — generic forms have no "declining" concept and never
      // set this. Kept on the shared type (rather than a second RSVP-only
      // type) so redirect/custom_html and the ActionsEditor UI stay one
      // implementation for both contexts; see rsvp-form.tsx's Render.
      headingNo?: string;
    }
  | { kind: "redirect"; url: string }
  | { kind: "custom_html"; html: string; css: string; heightPx: number };

export const DEFAULT_POST_SUBMIT_ACTION: PostSubmitAction = {
  kind: "message",
  heading: "Thanks!",
  message: "Your response has been recorded.",
};

const postSubmitActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    heading: z.string().max(200),
    message: z.string().max(2000),
    showVenue: z.boolean().optional(),
    headingNo: z.string().max(200).optional(),
  }),
  z.object({ kind: z.literal("redirect"), url: z.string().max(2000) }),
  z.object({
    kind: z.literal("custom_html"),
    html: z.string().max(20_000),
    css: z.string().max(20_000),
    heightPx: z.number().finite().positive().max(4000),
  }),
]);

// Never an `as`-cast: a null/malformed column (every existing event before
// this feature shipped) falls back to the default plain "Thanks!" message,
// not an error.
export function parsePostSubmitAction(raw: unknown): PostSubmitAction {
  const result = postSubmitActionSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_POST_SUBMIT_ACTION;
}

// events.rsvp_actions is null until a host visits the Guests → Actions tab
// and saves something — every event that existed before this feature
// shipped falls in here. Reads the rsvp-form block's own now-untyped
// legacy confirmation fields (still physically present in already-saved
// page_schema JSON — page-schema.ts's block config validation is
// deliberately loose, so old keys round-trip even though
// RsvpFormBlockConfig no longer declares them) and reproduces the exact
// same behavior those fields used to drive. Shared by the public render
// (rsvp-form.tsx) and the Guests → Actions editor page (so the editor
// shows what's actually live, not a generic default, before a host has
// ever saved anything there) — both need identical synthesis or the editor
// could silently overwrite a working legacy confirmation with a blank one.
export function synthesizeLegacyRsvpAction(config: RsvpFormBlockConfig | undefined): PostSubmitAction {
  const legacy = (config ?? {}) as RsvpFormBlockConfig & LegacyRsvpConfirmationFields;
  if (legacy.confirmationHtml) {
    return {
      kind: "custom_html",
      html: legacy.confirmationHtml,
      css: legacy.confirmationCss ?? "",
      heightPx: legacy.confirmationHeightPx ?? 300,
    };
  }
  return {
    kind: "message",
    heading: legacy.confirmedYesHeading || "You're on the list!",
    headingNo: legacy.confirmedNoHeading || "Thanks for letting us know",
    message: "",
    showVenue: legacy.showVenueOnConfirmation !== false,
  };
}
