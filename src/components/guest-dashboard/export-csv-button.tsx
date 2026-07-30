"use client";

import { buildGuestsCsv } from "@/lib/csv-export";
import type { PendingInvite, RespondedGuest } from "./guest-card";
import type { FormSchema } from "@/lib/schemas/form-schema";
import { Button } from "@/components/ui/button";

// Built entirely from data the Guests page already fetched (schema +
// pending/responded guests) — no extra round trip, and always reflects
// exactly what's on screen (docs/01: "cheap, high-value, replaces the
// spreadsheet").
export function ExportCsvButton({
  eventSlug,
  schema,
  pendingInvites,
  respondedGuests,
}: {
  eventSlug: string;
  schema: FormSchema;
  pendingInvites: PendingInvite[];
  respondedGuests: RespondedGuest[];
}) {
  const handleExport = () => {
    const csv = buildGuestsCsv(schema, pendingInvites, respondedGuests);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${eventSlug}-guests.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleExport}>
      Export CSV
    </Button>
  );
}
