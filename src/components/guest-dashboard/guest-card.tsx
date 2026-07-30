"use client";

import { useState, useTransition } from "react";
import { CopyIconButton, ShareIconButton } from "./copy-share-icons";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { EditIcon, MailIcon, CheckIcon } from "@/components/icons";
import {
  deleteInvite,
  deleteRsvp,
  sendInviteEmailAction,
} from "@/app/dashboard/events/[eventId]/actions";
import { EditRsvpDialog } from "./edit-rsvp-dialog";
import type { FormSchema, Responses } from "@/lib/schemas/form-schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";

export type PendingInvite = {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
};

function SendInviteEmailButton({ eventId, invite }: { eventId: string; invite: PendingInvite }) {
  const { show } = useToast();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!invite.email) return null;

  const handleSend = () => {
    setError("");
    startTransition(async () => {
      try {
        await sendInviteEmailAction(eventId, invite.id);
        setSent(true);
        show(`Invite emailed to ${invite.name}.`);
        setTimeout(() => setSent(false), 2000);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send.";
        setError(message);
        show(message, "error");
      }
    });
  };

  return (
    <Tooltip content={error || (sent ? "Sent" : "Email invite")}>
      <IconButton
        onClick={handleSend}
        disabled={isPending}
        aria-label={sent ? "Sent" : "Email invite"}
        className={sent ? "text-success" : error ? "text-destructive" : undefined}
      >
        {sent ? <CheckIcon /> : <MailIcon />}
      </IconButton>
    </Tooltip>
  );
}

export type RespondedGuest = {
  id: string;
  inviteId: string | null;
  name: string;
  attending: boolean | null;
  additionalGuests: string[];
  responses: Responses;
  createdAt: string;
};

type EventContext = {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  schema: FormSchema;
};

const EXTRA_ROLES = new Set(["name", "attending", "plus_ones"]);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PendingGuestCard({
  invite,
  event,
}: {
  invite: PendingInvite;
  event: EventContext;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{invite.name}</p>
          <p className="mt-0.5 text-xs text-muted">Invited {formatDate(invite.createdAt)}</p>
        </div>
        <Badge>Pending</Badge>
      </div>
      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-border pt-2">
        <CopyIconButton eventSlug={event.eventSlug} eventTitle={event.eventTitle} inviteId={invite.id} />
        <ShareIconButton
          eventSlug={event.eventSlug}
          eventTitle={event.eventTitle}
          inviteId={invite.id}
          guestName={invite.name}
        />
        <SendInviteEmailButton eventId={event.eventId} invite={invite} />
        <ConfirmIconButton
          label="Delete invite"
          confirmText={`Delete invite for ${invite.name}?`}
          onConfirm={() => deleteInvite(event.eventId, invite.id)}
        />
      </div>
    </Card>
  );
}

export function RespondedGuestCard({
  guest,
  event,
}: {
  guest: RespondedGuest;
  event: EventContext;
}) {
  const [editing, setEditing] = useState(false);

  const extraFields = event.schema.fields.filter((f) => !f.role || !EXTRA_ROLES.has(f.role));

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{guest.name}</p>
          <p className="mt-0.5 text-xs text-muted">Responded {formatDate(guest.createdAt)}</p>
        </div>
        {guest.attending !== null && (
          <Badge variant={guest.attending ? "success" : "destructive"}>
            {guest.attending ? "Attending" : "Not attending"}
          </Badge>
        )}
      </div>

      {guest.additionalGuests.length > 0 && (
        <p className="mt-2 inline-block rounded-full bg-surface px-2.5 py-1 text-xs text-foreground">
          +{guest.additionalGuests.length} &middot; {guest.additionalGuests.join(", ")}
        </p>
      )}

      {extraFields.length > 0 && (
        <div className="mt-2 space-y-1">
          {extraFields.map((field) => {
            const value = guest.responses[field.id];
            const display = Array.isArray(value) ? value.join(", ") : value;
            if (!display) return null;
            return (
              <p key={field.id} className="text-xs text-muted">
                <span className="font-medium text-muted-foreground">{field.label}: </span>
                {display}
              </p>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-0.5 border-t border-border pt-2">
        {guest.inviteId && (
          <>
            <CopyIconButton eventSlug={event.eventSlug} eventTitle={event.eventTitle} inviteId={guest.inviteId} />
            <ShareIconButton
              eventSlug={event.eventSlug}
              eventTitle={event.eventTitle}
              inviteId={guest.inviteId}
              guestName={guest.name}
            />
          </>
        )}
        <IconButton aria-label="Edit RSVP" title="Edit RSVP" onClick={() => setEditing(true)}>
          <EditIcon />
        </IconButton>
        <ConfirmIconButton
          label="Delete response"
          confirmText={`Delete ${guest.name}'s response?`}
          onConfirm={() => deleteRsvp(event.eventId, guest.id)}
        />
      </div>

      {editing && (
        <EditRsvpDialog eventId={event.eventId} schema={event.schema} guest={guest} onClose={() => setEditing(false)} />
      )}
    </Card>
  );
}
