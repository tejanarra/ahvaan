import type { FormSchema } from "@/lib/schemas/form-schema";
import type { PendingInvite, RespondedGuest } from "@/components/guest-dashboard/guest-card";

const UTF8_BOM = "﻿";

// RFC 4180: a value needs quoting if it contains the delimiter, a quote, or
// a line break — embedded quotes double up. Everything else is left bare
// (matches how every spreadsheet app round-trips CSV).
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US");
}

function formatCsvValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join("; ");
  return value ?? "";
}

// One row per invite (sent or not) — matches the guest dashboard's own
// "pending vs. responded" model rather than only exporting who answered, so
// the export replaces the spreadsheet a host would otherwise keep by hand
// (docs/01, docs/07 Phase 4). Column set is schema-driven: one column per
// current form field, by label, so a host who customized the form sees
// exactly the questions they asked.
export function buildGuestsCsv(
  schema: FormSchema,
  pendingInvites: PendingInvite[],
  respondedGuests: RespondedGuest[]
): string {
  const header = ["Name", "Email", "Status", "Responded at", ...schema.fields.map((f) => f.label)];

  const pendingRows = pendingInvites.map((invite) => [
    invite.name,
    invite.email ?? "",
    "Pending",
    "",
    ...schema.fields.map(() => ""),
  ]);

  const respondedRows = respondedGuests.map((guest) => [
    guest.name,
    guest.email ?? "",
    "Responded",
    formatCsvDate(guest.createdAt),
    ...schema.fields.map((field) => formatCsvValue(guest.responses[field.id])),
  ]);

  const rows = [header, ...pendingRows, ...respondedRows];
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  // Leading BOM so Excel (Windows in particular) detects UTF-8 instead of
  // guessing a legacy codepage and mangling non-ASCII guest names.
  return UTF8_BOM + body;
}
