import type { EventRecord } from "@/lib/data/events";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";
import type { FormRecord } from "@/lib/data/forms";
import type { FormResponses } from "@/lib/forms/types";

// Saved reusable components, keyed by name — built once per page render
// (not queried per block instance). Referenced from any block's HTML via
// <custom-component name="..." attr="value" />, substituted in
// lib/blocks/shortcodes.ts. See lib/data/custom-components.ts.
export type CustomComponentMap = Record<string, { html: string; css: string; js: string }>;

// Every generic custom form for this event, keyed by id — same
// once-per-page-render shape as customComponents above, looked up by id at
// render time by the "form" block (lib/blocks/blocks/form.tsx) rather than
// each block instance querying its own. See lib/data/forms.ts.
export type CustomFormMap = Record<string, FormRecord>;

// This guest's own prior submission per form (only populated when an
// invite is present — 'private' mode's prefill-on-return), keyed by form
// id — the generic-forms equivalent of `initialResponses` below, which is
// RSVP-specific. See listSubmissionsForInvitePublic in
// lib/data/form-submissions.ts.
export type CustomFormResponsesMap = Record<string, FormResponses>;

// Threaded down to every block's Render component on the public page. Only
// the rsvp-form/form blocks actually need the guest-specific fields;
// everything else just reads `event`. `customComponents`/`customForms`/
// `customFormResponses` are required (default to `{}` at every call site)
// rather than optional, same as `schema`/`initialResponses`.
export type PageRenderContext = {
  event: EventRecord;
  inviteId: string | null;
  guestName: string | null;
  schema: FormSchema;
  initialResponses: Responses | null;
  customComponents: CustomComponentMap;
  customForms: CustomFormMap;
  customFormResponses: CustomFormResponsesMap;
  // Set once a no-invite guest has passed the page-level "verify your
  // email once for this event" gate (src/lib/guest-session.ts's cookie,
  // read in page.tsx) — every RSVP/Forms block treats this exactly like
  // having an invite for identity purposes (renders unlocked, prefilled
  // from their existing response). Null when there's an invite instead
  // (invite always wins) or when the guest hasn't verified yet — in which
  // case the block renders its form locked (see rsvp-form.tsx/form.tsx).
  verifiedEmail: string | null;
  // The current request's CSP nonce (src/lib/csp-nonce.ts), needed only by
  // the custom-html block to nonce its sandboxed iframe's inline <script>
  // (see sandbox.ts). Undefined in the dashboard builder's live preview
  // (a client component — next/headers isn't available there, and the
  // preview iframe isn't subject to the guest page's CSP anyway); real
  // pages set it from src/app/events/[slug]/page.tsx.
  nonce?: string;
};
