"use client";

import { useEffect } from "react";
import { VenueMap } from "@/components/venue-map";
import { buildSandboxSrcDoc } from "@/lib/blocks/sandbox";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";
import type { CustomFormSchema, FormResponses } from "./types";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.length > 0 ? value.map(String).join(", ") : "—";
  if (value && typeof value === "object") {
    const addr = value as Record<string, string>;
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  }
  return typeof value === "string" && value ? value : "—";
}

function renderResponsesSummaryHtml(schema: CustomFormSchema, responses: FormResponses): string {
  return schema.fields
    .map(
      (field) =>
        `<p><span class="ahvan-summary-label">${escapeHtml(field.label)}: </span>${escapeHtml(formatFieldValue(responses[field.id]))}</p>`
    )
    .join("");
}

// Renders whichever post-submit action fired — shared by the RSVP form
// (src/app/e/[slug]/rsvp-form.tsx) and every generic form
// (src/app/e/[slug]/custom-form.tsx), see src/lib/schemas/post-submit-
// actions.ts. `schema`/`responses` are only used by the custom_html kind's
// `{{responses_summary}}` shortcode; `venueName`/`venueAddress` only ever
// render for the RSVP context (message kind's `showVenue`) since generic
// forms carry no venue data.
export function PostSubmitOutcome({
  action,
  schema,
  responses,
  venueName,
  venueAddress,
}: {
  action: PostSubmitAction;
  schema: CustomFormSchema;
  responses: FormResponses;
  venueName?: string | null;
  venueAddress?: string | null;
}) {
  // Hooks can't be called conditionally — this effect always runs, and
  // only *acts* when the resolved action is a redirect.
  useEffect(() => {
    if (action.kind === "redirect") {
      window.location.href = action.url;
    }
  }, [action]);

  if (action.kind === "redirect") {
    return <p className="w-full text-center text-sm text-[var(--t-fg)]/70">Redirecting…</p>;
  }

  if (action.kind === "custom_html") {
    const height = Number.isFinite(action.heightPx) ? Math.min(4000, Math.max(50, action.heightPx)) : 300;
    const html = action.html.includes("{{responses_summary}}")
      ? action.html.replaceAll("{{responses_summary}}", renderResponsesSummaryHtml(schema, responses))
      : action.html;
    return (
      <iframe
        srcDoc={buildSandboxSrcDoc({ html, css: action.css, js: "" })}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        title="Confirmation"
        style={{ height: `${height}px` }}
        className="w-full rounded-lg border-0"
      />
    );
  }

  // "message"
  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-[var(--t-accent)]/25 bg-[var(--t-surface)] p-5 text-center sm:p-6">
        <p className="text-xl text-[var(--t-accent-dark)]" style={{ fontFamily: "var(--t-font-display)" }}>
          {action.heading}
        </p>
        {action.message && <p className="mt-2 text-sm text-[var(--t-fg)]/80">{action.message}</p>}
      </div>
      {action.showVenue && venueAddress && <VenueMap venueName={venueName || "Venue"} venueAddress={venueAddress} />}
    </div>
  );
}
