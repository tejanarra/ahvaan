import type { EventRecord } from "@/lib/data/events";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";
import type { FormRecord } from "@/lib/data/forms";

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

// Threaded down to every block's Render component on the public page. Only
// the rsvp-form block actually needs the guest-specific fields; everything
// else just reads `event`. `customComponents`/`customForms` are required
// (default to `{}` at every call site) rather than optional, same as
// `schema`/`initialResponses`.
export type PageRenderContext = {
  event: EventRecord;
  inviteId: string | null;
  guestName: string | null;
  schema: FormSchema;
  initialResponses: Responses | null;
  customComponents: CustomComponentMap;
  customForms: CustomFormMap;
};
