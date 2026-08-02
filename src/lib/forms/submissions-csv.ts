import type { CustomFormSchema } from "./types";
import type { FormSubmissionRecord } from "@/lib/data/form-submissions";

const UTF8_BOM = "﻿";

// Same RFC 4180 quoting rule as src/lib/csv-export.ts's csvCell (a value
// needs quoting if it contains the delimiter, a quote, or a line break) —
// small enough, and specific enough to a different row shape (submissions,
// not guests), that duplicating this one helper reads clearer than forcing
// the two csv builders to share it.
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
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
