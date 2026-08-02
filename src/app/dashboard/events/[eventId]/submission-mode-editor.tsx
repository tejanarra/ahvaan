"use client";

import { useState, useTransition } from "react";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { SubmissionMode } from "@/lib/schemas/submission-mode";

const MODE_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "anonymous", label: "Anonymous" },
  { value: "email_verified", label: "Email verified" },
];

const MODE_DESCRIPTIONS: Record<SubmissionMode, string> = {
  private:
    "Only guests opening their personal invite link can respond. One response per guest — reopening the link shows their previous answer and lets them edit it.",
  anonymous:
    "Anyone with the page link can respond, no identity check. Unlimited responses — refreshing shows a blank form again, with no way to edit a previous response.",
  email_verified:
    "A guest opening their personal invite link can respond right away, same as Private — the host already knows that's their real email. Anyone else has to verify their email (a link and code sent by email) before anything is saved. One response per verified email — resubmitting updates it instead of creating a duplicate, and a guest can retrieve and edit their response with an “Already responded?” link (also verified).",
};

// One event-wide setting (events.submission_mode) that governs both the
// RSVP form and every generic Forms form on this event — a host wanting
// email verification wants it everywhere on the event, not toggled
// form-by-form, so there's a single editor in the event Settings page
// (event-settings-form.tsx's "RSVP" card) rather than a second copy
// under Forms.
export function SubmissionModeEditor({
  initialMode,
  emailFieldMissing = false,
  onSave,
}: {
  initialMode: SubmissionMode;
  // Whether switching to 'email_verified' will auto-add an Email field —
  // just an informational note here; the actual seeding happens
  // server-side in the action this component's onSave calls.
  emailFieldMissing?: boolean;
  onSave: (mode: SubmissionMode) => Promise<void>;
}) {
  const [mode, setMode] = useState<SubmissionMode>(initialMode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await onSave(mode);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Who can submit</h2>
        <p className="mt-0.5 text-xs text-muted">
          Choose how identity and resubmission are handled — applies to RSVP and every form on this event.
        </p>
      </div>

      <ToggleGroup
        options={MODE_OPTIONS}
        value={mode}
        onChange={(v) => setMode(v as SubmissionMode)}
        fullWidth="mobile"
      />
      <p className="text-sm text-muted">{MODE_DESCRIPTIONS[mode]}</p>
      {mode === "email_verified" && emailFieldMissing && (
        <p className="text-xs text-muted">An Email field will be added automatically to RSVP and every form when you save.</p>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        {saved && <span className="text-sm text-success">Saved.</span>}
        <Button size="sm" onClick={handleSave} loading={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
