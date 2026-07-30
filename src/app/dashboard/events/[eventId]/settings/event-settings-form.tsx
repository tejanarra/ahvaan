"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEvent, deleteEvent } from "../../../actions";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { EVENT_TYPES } from "@/lib/event-types";
import type { EventRecord } from "@/lib/data/events";
import type { EventFormInput } from "@/lib/schemas/event-input";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

function toInput(event: EventRecord): EventFormInput {
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
  const [form, setForm] = useState<EventFormInput>(toInput(event));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateEvent(event.id, form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  const handleDelete = async () => {
    await deleteEvent(event.id);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <Field label="Event title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>

          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Event type">
              <Select value={form.eventType} onChange={(e) => set("eventType", e.target.value)}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Time">
              <Input value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} placeholder="4:00 PM" />
            </Field>
            <Field label="Venue name">
              <Input value={form.venueName} onChange={(e) => set("venueName", e.target.value)} />
            </Field>
          </div>

          <Field label="Venue address">
            <Input value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} />
          </Field>

          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} loading={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
            {saved && <span className="text-sm text-success">Saved.</span>}
          </div>
        </CardBody>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between">
          <p className="text-sm text-muted">Delete this event, its invites, and all RSVPs. This cannot be undone.</p>
          <ConfirmIconButton
            label="Delete event"
            confirmText={`Delete "${event.title}"? This removes all its invites and RSVPs.`}
            onConfirm={handleDelete}
          />
        </CardBody>
      </Card>
    </div>
  );
}
