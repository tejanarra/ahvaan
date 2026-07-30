"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEvent, deleteEvent } from "../../../actions";
import { EventDetailsFields, type EventDetailsValue } from "@/components/event-details-form";
import type { EventRecord } from "@/lib/data/events";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

function toValue(event: EventRecord): EventDetailsValue {
  return {
    title: event.title,
    eventType: event.event_type,
    themeId: event.theme_id,
    eventDate: event.event_date ?? "",
    eventTime: event.event_time ?? "",
    venueName: event.venue_name ?? "",
    venueAddress: event.venue_address ?? "",
    subtitle: event.subtitle ?? "",
    description: event.description ?? "",
  };
}

export function EventSettingsForm({ event }: { event: EventRecord }) {
  const router = useRouter();
  const { show } = useToast();
  const [value, setValue] = useState<EventDetailsValue>(toValue(event));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await updateEvent(event.id, value);
        show("Saved.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to save.", "error");
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteEvent(event.id);
        router.push("/dashboard");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to delete.", "error");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardBody>
          <EventDetailsFields value={value} onChange={(key, next) => setValue((v) => ({ ...v, [key]: next }))} />

          <div className="mt-5">
            <Button onClick={handleSave} loading={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between">
          <p className="text-sm text-muted">Delete this event, its invites, and all RSVPs. This cannot be undone.</p>
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete event
          </Button>
        </CardBody>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete event">
        <p className="text-sm text-muted">
          Delete &ldquo;{event.title}&rdquo;? This removes all its invites and RSVPs. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
