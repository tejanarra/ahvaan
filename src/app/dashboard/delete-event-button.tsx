"use client";

import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { deleteEvent } from "./actions";

export function DeleteEventButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  return (
    <ConfirmIconButton
      label="Delete event"
      confirmText={`Delete "${eventTitle}"? This removes all its invites and RSVPs.`}
      onConfirm={() => deleteEvent(eventId)}
    />
  );
}
