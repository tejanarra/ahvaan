import type { FormSchema, FormField, Responses } from "@/lib/schemas/form-schema";
import type { CustomComponentMap } from "./context";

// Lets a host embed the *real, working* RSVP form or venue map inside a
// sandboxed custom-HTML/CSS/JS block or the whole-page custom mode, styled
// however they want — writing "{{rsvp_form}}" or "{{venue_map}}" anywhere
// in their HTML gets it swapped, server-side, for real functional markup
// before the sandboxed iframe is built. The venue map is pure static HTML
// (a Maps embed + a link, no server round-trip needed); the RSVP form
// posts to the public /api/rsvp route (src/app/api/rsvp/route.ts) since a
// sandboxed opaque-origin iframe can't invoke a Next.js Server Action —
// only a plain HTML <form method="post"> works there, with no CORS
// restriction on the submission itself.

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function escapeAttr(s: string) {
  return escapeHtml(s);
}

export function renderVenueMapHtml(venueName: string, venueAddress: string): string {
  const query = encodeURIComponent(venueAddress);
  const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  return [
    `<div class="gatherie-venue-map">`,
    `<p>${escapeHtml(venueName)}</p>`,
    `<p>${escapeHtml(venueAddress)}</p>`,
    `<iframe src="${escapeAttr(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:280px;border:0" title="Venue location map"></iframe>`,
    `<p><a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noreferrer">Get directions</a></p>`,
    `</div>`,
  ].join("");
}

function renderFieldHtml(field: FormField): string {
  const required = field.required ? " required" : "";
  const label = `<label for="f_${escapeAttr(field.id)}">${escapeHtml(field.label)}</label>`;

  if (field.type === "textarea") {
    return `${label}<textarea id="f_${escapeAttr(field.id)}" name="${escapeAttr(field.id)}"${required} maxlength="${field.maxLength ?? 5000}"></textarea>`;
  }
  if (field.type === "select") {
    const options = (field.options ?? [])
      .map((o) => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`)
      .join("");
    return `${label}<select id="f_${escapeAttr(field.id)}" name="${escapeAttr(field.id)}"${required}><option value="" disabled selected>${escapeHtml(field.placeholder ?? "Select...")}</option>${options}</select>`;
  }
  if (field.type === "radio" || field.type === "checkbox") {
    const inputType = field.type;
    const options = (field.options ?? [])
      .map(
        (o, i) =>
          `<label><input type="${inputType}" name="${escapeAttr(field.id)}" value="${escapeAttr(o)}"${
            field.type === "radio" && i === 0 ? required : ""
          } /> ${escapeHtml(o)}</label>`
      )
      .join(" ");
    return `<fieldset><legend>${escapeHtml(field.label)}</legend>${options}</fieldset>`;
  }
  if (field.type === "plus_ones") {
    const max = Math.min(field.maxItems ?? 5, 10);
    const inputs = Array.from({ length: max }, (_, i) =>
      `<input type="text" name="${escapeAttr(field.id)}" placeholder="Guest ${i + 1} name" maxlength="${field.maxLength ?? 100}" />`
    ).join("");
    return `<fieldset><legend>${escapeHtml(field.label)}</legend>${inputs}</fieldset>`;
  }
  // "text"
  return `${label}<input type="text" id="f_${escapeAttr(field.id)}" name="${escapeAttr(field.id)}"${required} maxlength="${field.maxLength ?? 100}" placeholder="${escapeAttr(field.placeholder ?? "")}" />`;
}

export function renderRsvpFormHtml(schema: FormSchema, eventId: string, inviteId: string | null): string {
  if (!inviteId) {
    return `<div class="gatherie-rsvp-form"><p>By invitation only — open this page from your personal invite link to RSVP.</p></div>`;
  }
  const fields = schema.fields.map(renderFieldHtml).join("");
  return [
    `<form class="gatherie-rsvp-form" method="post" action="/api/rsvp">`,
    `<input type="hidden" name="eventId" value="${escapeAttr(eventId)}" />`,
    `<input type="hidden" name="inviteId" value="${escapeAttr(inviteId)}" />`,
    fields,
    `<button type="submit">Submit RSVP</button>`,
    `</form>`,
  ].join("");
}

function formatResponseValue(field: FormField, value: string | string[] | undefined): string {
  if (field.type === "plus_ones" || field.type === "checkbox") {
    const list = Array.isArray(value) ? value : [];
    return list.length > 0 ? list.map(escapeHtml).join(", ") : "—";
  }
  if (field.role === "attending") {
    return (typeof value === "string" ? value : "") === "yes" ? "Yes" : "No";
  }
  const str = typeof value === "string" ? value : "";
  return str ? escapeHtml(str) : "—";
}

// Only meaningful right after a guest's own submission (the post-submit
// confirmation screen), never during a page's normal render — that's why
// it's a separate optional field on the context rather than always present.
export function renderResponsesSummaryHtml(schema: FormSchema, responses: Responses): string {
  const rows = schema.fields
    .map(
      (field) =>
        `<p><span class="gatherie-summary-label">${escapeHtml(field.label)}: </span>${formatResponseValue(field, responses[field.id])}</p>`
    )
    .join("");
  return `<div class="gatherie-responses-summary">${rows}</div>`;
}

// Parses `name="value"`/`name='value'` pairs out of a self-closing tag's
// attribute text — deliberately simple (no boolean-attribute or unquoted-
// value support) since this is only ever a host's own <custom-component>
// tag, not general HTML.
function parseTagAttrs(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(attrText))) {
    attrs[match[1]] = match[2] ?? match[3] ?? "";
  }
  return attrs;
}

// A saved reusable component (see lib/data/custom-components.ts) is
// referenced with a plain self-closing tag —
// `<custom-component name="message-card" message="Hi!" />` — anywhere in a
// custom-html block's HTML, the whole-page custom mode, or the RSVP
// confirmation override. Every attribute besides `name` becomes a
// `{{attr}}` token inside that saved snippet's own html/css, exactly like
// the RSVP-form/venue-map shortcodes below use `{{...}}` — no separate prop
// schema to author up front. Single-pass only: a referenced snippet's own
// html is not re-scanned for further <custom-component> tags, so this can
// never infinite-loop on a component that (accidentally or not) references
// itself.
function substituteCustomComponentTags(html: string, components: CustomComponentMap): string {
  return html.replace(/<custom-component\s+([^>]*?)\/>/g, (_match, attrText: string) => {
    const { name, ...values } = parseTagAttrs(attrText);
    const component = name ? components[name] : undefined;
    if (!component) return `<!-- custom-component "${escapeAttr(name ?? "")}" not found -->`;

    const substitute = (text: string) => {
      let result = text;
      for (const [key, value] of Object.entries(values)) {
        result = result.replaceAll(`{{${key}}}`, value);
      }
      return result;
    };

    const styleTag = component.css ? `<style>${substitute(component.css)}</style>` : "";
    // Wrapped in an IIFE so a referenced component's own top-level
    // `const`/`let` declarations can't collide with the parent block's
    // script (both ultimately land in the same sandboxed document).
    const scriptTag = component.js ? `<script>(function(){${component.js}})();</script>` : "";
    return `${styleTag}${substitute(component.html)}${scriptTag}`;
  });
}

export type ShortcodeContext = {
  eventId: string;
  inviteId: string | null;
  venueName: string | null;
  venueAddress: string | null;
  schema: FormSchema;
  // Present only when substituting into a guest's own post-submit
  // confirmation screen — enables {{responses_summary}}.
  responses?: Responses;
  // The current host's saved component library — enables <custom-component>.
  customComponents?: CustomComponentMap;
};

export function applyComponentShortcodes(html: string, ctx: ShortcodeContext): string {
  let result = html;
  if (result.includes("<custom-component") && ctx.customComponents) {
    result = substituteCustomComponentTags(result, ctx.customComponents);
  }
  if (result.includes("{{rsvp_form}}")) {
    result = result.replaceAll("{{rsvp_form}}", renderRsvpFormHtml(ctx.schema, ctx.eventId, ctx.inviteId));
  }
  if (result.includes("{{venue_map}}") && ctx.venueAddress) {
    result = result.replaceAll("{{venue_map}}", renderVenueMapHtml(ctx.venueName || "Venue", ctx.venueAddress));
  }
  if (result.includes("{{responses_summary}}") && ctx.responses) {
    result = result.replaceAll("{{responses_summary}}", renderResponsesSummaryHtml(ctx.schema, ctx.responses));
  }
  return result;
}
