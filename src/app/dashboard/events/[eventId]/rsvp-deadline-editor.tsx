"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// `<input type="datetime-local">` reads/writes "YYYY-MM-DDTHH:mm" in the
// browser's local time zone, with no timezone info of its own — converting
// through a real Date (both directions) is what maps that local wall-clock
// value to/from the timestamptz actually stored.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Lives in the event Settings page's "RSVP" card, alongside
// SubmissionModeEditor — both are "who/when can guests submit" controls
// (this one governs *when* the window closes, submission mode governs
// *who* can respond). They used to be split across two different
// "Settings" destinations (this one under Guests, that one at the
// top level), which was confusing regardless of what was in either —
// now there's exactly one Settings page for the whole event.
export function RsvpDeadlineEditor({
  initialDeadline,
  onSave,
}: {
  initialDeadline: string | null;
  onSave: (deadlineIso: string | null) => Promise<void>;
}) {
  const { show } = useToast();
  const [deadlineInput, setDeadlineInput] = useState(() => toLocalInputValue(initialDeadline));
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        const iso = deadlineInput ? new Date(deadlineInput).toISOString() : null;
        await onSave(iso);
        show(iso ? "RSVP deadline saved." : "RSVP deadline removed.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to save deadline.", "error");
      }
    });
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-sm font-semibold text-foreground">RSVP deadline</h2>
      <p className="mt-0.5 text-xs text-muted">When the RSVP window closes for this event.</p>

      <div className="mt-4">
        <Field label="Guests can respond until" hint="Optional — leave blank to accept RSVPs indefinitely.">
          <Input
            type="datetime-local"
            value={deadlineInput}
            onChange={(e) => setDeadlineInput(e.target.value)}
            className="max-w-xs"
          />
        </Field>
        <p className="mt-2 text-xs text-muted">
          After this time, the guest page shows a closed note instead of the RSVP form (guests who already
          responded can still see their confirmation). You can still edit any RSVP yourself from Guests → Data.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={handleSave} loading={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          {deadlineInput && (
            <Button size="sm" variant="ghost" onClick={() => setDeadlineInput("")} disabled={isPending}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
