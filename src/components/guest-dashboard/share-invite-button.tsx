"use client";

import { useState } from "react";
import { createInvite } from "@/app/dashboard/events/[eventId]/actions";
import { buildInviteLink, buildInviteMessage } from "./invite-link";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ShareInviteButton({
  eventId,
  eventSlug,
  eventTitle,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOpen(false);
    setGuestName("");
    setGuestEmail("");
    setLink("");
    setCopied(false);
    setError("");
  };

  const handleGenerate = async () => {
    if (!guestName.trim()) {
      setError("Enter a guest name first.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const inviteId = await createInvite(eventId, guestName, guestEmail);
      setLink(buildInviteLink(eventSlug, inviteId));
    } catch {
      setError("Couldn't create the invite. Try again.");
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildInviteMessage(eventTitle, link));
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied/unsupported — the link is already visible and
      // selectable in the field above, so just point that out instead of
      // failing silently.
      setCopyFailed(true);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: eventTitle,
        text: "You're invited! Please RSVP here:",
        url: link,
      });
    } catch {
      // Cancelled — no-op.
    }
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Share invite link
      </Button>

      <Modal open={open} onClose={reset} title="Share invite">
        <p className="text-sm text-muted">
          Enter the guest&rsquo;s name to generate their personal invite link. Only this link will let them RSVP.
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Guest name">
            <Input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={Boolean(link)}
            />
          </Field>
          <Field label="Guest email" hint="Optional, to send by email">
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              disabled={Boolean(link)}
            />
          </Field>
        </div>

        {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}

        {!link ? (
          <Button onClick={handleGenerate} loading={pending} className="mt-4 w-full">
            {pending ? "Creating invite..." : "Generate link"}
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
              <input
                type="text"
                readOnly
                value={buildInviteMessage(eventTitle, link)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full truncate bg-transparent text-sm text-foreground focus:outline-none"
              />
              <Button size="sm" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            {copyFailed && (
              <p className="text-xs text-muted">Couldn&rsquo;t copy automatically — tap the link above to select it manually.</p>
            )}

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <Button variant="secondary" onClick={handleNativeShare} className="w-full">
                Share via...
              </Button>
            )}

            <button type="button" onClick={reset} className="w-full text-center text-xs text-muted hover:text-foreground">
              Done
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
