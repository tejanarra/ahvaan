"use client";

import { useState } from "react";
import { CopyIconButton, ShareIconButton } from "./copy-share-icons";
import { ConfirmIconButton } from "./confirm-icon-button";
import { EditIcon } from "./icons";
import { deleteInvite, deleteRsvp } from "./actions";
import { EditRsvpDialog } from "./edit-rsvp-dialog";

export type PendingInvite = {
  id: string;
  name: string;
  createdAt: string;
};

export type RespondedGuest = {
  id: string;
  inviteId: string | null;
  name: string;
  attending: boolean;
  additionalGuests: string[];
  createdAt: string;
};

// Pinned to the venue's timezone rather than the runtime's default: without
// an explicit zone, a server (often UTC) and the admin's browser (e.g. US
// Eastern) can render a different calendar date for the same timestamp —
// especially for anything submitted near midnight — causing a hydration
// mismatch or just a visibly wrong date.
const VENUE_TIME_ZONE = "America/New_York";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: VENUE_TIME_ZONE,
  });
}

export function PendingGuestCard({ invite }: { invite: PendingInvite }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{invite.name}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            Invited {formatDate(invite.createdAt)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-lavender/50 px-2 py-0.5 text-xs font-medium text-foreground/70">
          Pending
        </span>
      </div>
      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-gold/10 pt-2">
        <CopyIconButton inviteId={invite.id} />
        <ShareIconButton inviteId={invite.id} guestName={invite.name} />
        <ConfirmIconButton
          label="Delete invite"
          confirmText={`Delete invite for ${invite.name}?`}
          onConfirm={() => deleteInvite(invite.id)}
        />
      </div>
    </div>
  );
}

export function RespondedGuestCard({ guest }: { guest: RespondedGuest }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-2xl border border-gold/20 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{guest.name}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            Responded {formatDate(guest.createdAt)}
          </p>
        </div>
        <span
          className={
            guest.attending
              ? "shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
              : "shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
          }
        >
          {guest.attending ? "Attending" : "Not attending"}
        </span>
      </div>

      {guest.attending && guest.additionalGuests.length > 0 && (
        <p className="mt-2 inline-block rounded-full bg-lavender/40 px-2.5 py-1 text-xs text-foreground/80">
          +{guest.additionalGuests.length} &middot; {guest.additionalGuests.join(", ")}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-gold/10 pt-2">
        {guest.inviteId && (
          <>
            <CopyIconButton inviteId={guest.inviteId} />
            <ShareIconButton inviteId={guest.inviteId} guestName={guest.name} />
          </>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit RSVP"
          title="Edit RSVP"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gold-dark transition hover:bg-lavender/40"
        >
          <EditIcon />
        </button>
        <ConfirmIconButton
          label="Delete response"
          confirmText={`Delete ${guest.name}'s response?`}
          onConfirm={() => deleteRsvp(guest.id)}
        />
      </div>

      {editing && <EditRsvpDialog guest={guest} onClose={() => setEditing(false)} />}
    </div>
  );
}
