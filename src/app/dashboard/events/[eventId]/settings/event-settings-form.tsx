"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEvent, deleteEvent, setEventStatus, setRsvpDeadline } from "../../../actions";
import { EventDetailsFields, type EventDetailsValue } from "@/components/event-details-form";
import type { EventRecord } from "@/lib/data/events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

export function EventSettingsForm({ event }: { event: EventRecord }) {
  const router = useRouter();
  const { show } = useToast();
  const [value, setValue] = useState<EventDetailsValue>(toValue(event));
  const [status, setStatus] = useState(event.status);
  const [deadlineInput, setDeadlineInput] = useState(() => toLocalInputValue(event.rsvp_deadline));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [isSavingDeadline, startDeadlineTransition] = useTransition();

  const handleSaveDeadline = () => {
    startDeadlineTransition(async () => {
      try {
        const iso = deadlineInput ? new Date(deadlineInput).toISOString() : null;
        await setRsvpDeadline(event.id, iso);
        show(iso ? "RSVP deadline saved." : "RSVP deadline removed.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to save deadline.", "error");
      }
    });
  };

  const handleTogglePublish = () => {
    const next = status === "published" ? "draft" : "published";
    startPublishTransition(async () => {
      try {
        await setEventStatus(event.id, next);
        setStatus(next);
        show(next === "published" ? "Published — your guest page is live." : "Unpublished — the guest page is hidden again.");
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to update status.", "error");
      }
    });
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        // coverImageUrl isn't part of this form (it's set from the Hero
        // block in the page builder) — carry the event's current value
        // through unchanged so saving Settings never blanks it.
        await updateEvent(event.id, { ...value, coverImageUrl: event.cover_image_url ?? "" });
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
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={status === "published" ? "success" : "neutral"}>
                {status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {status === "published"
                ? "Your guest page is live at its public link."
                : "Only you can see this event's page while it's a draft — design it first, then publish when ready."}
            </p>
          </div>
          <Button
            variant={status === "published" ? "secondary" : "primary"}
            size="sm"
            onClick={handleTogglePublish}
            loading={isPublishing}
          >
            {isPublishing ? "Saving..." : status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </CardBody>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>RSVP deadline</CardTitle>
        </CardHeader>
        <CardBody>
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
            responded can still see their confirmation). You can still edit any RSVP yourself from the Guests tab.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={handleSaveDeadline} loading={isSavingDeadline}>
              {isSavingDeadline ? "Saving..." : "Save"}
            </Button>
            {deadlineInput && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeadlineInput("")}
                disabled={isSavingDeadline}
              >
                Clear
              </Button>
            )}
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
