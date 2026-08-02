import type { CustomFormSchema } from "./types";
import type { FormSubmissionRecord } from "@/lib/data/form-submissions";

const UTF8_BOM = "﻿";

// Same RFC 4180 quoting rule as src/lib/csv-export.ts's csvCell (a value
// needs quoting if it contains the delimiter, a quote, or a line break) —
// small enough, and specific enough to a different row shape (submissions,
// not guests), that duplicating this one helper reads clearer than forcing
// the two csv builders to share it.
//
// Every value here originates as free-text guest input (a text/textarea/
// select-other answer, ...), not host-authored data — a guest can type a
// leading `=`, `+`, `-`, or `@` (or a tab/CR) that Excel/Sheets interpret
// as a formula prefix when the host opens the exported CSV, e.g.
// `=HYPERLINK("https://evil.example","Click")` in a text field. Prefixing
// a `'` neutralizes that (spreadsheet apps treat it as "force text" and
// don't display the quote itself) without changing what a normal value
// looks like once opened.
const FORMULA_TRIGGER_CHARS = /^[=+\-@\t\r]/;
function csvCell(value: string): string {
  const guarded = FORMULA_TRIGGER_CHARS.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replace(/"/g, '""')}"`;
  return guarded;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join("; ");
  if (value && typeof value === "object") {
    const addr = value as Record<string, string>;
    return [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(", ");
  }
  return typeof value === "string" ? value : "";
}

// One column per current schema field, by label — a submission for a
// since-removed field just renders blank (its data still exists in the
// row's own `responses`, only the column header/order is schema-driven).
export function buildSubmissionsCsv(schema: CustomFormSchema, submissions: FormSubmissionRecord[]): string {
  const header = ["Submitted at", ...schema.fields.map((f) => f.label)];
  const rows = submissions.map((s) => [
    new Date(s.submitted_at).toLocaleString("en-US"),
    ...schema.fields.map((field) => formatValue(s.responses[field.id])),
  ]);
  const body = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return UTF8_BOM + body;
}
