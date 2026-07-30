"use client";

import { useActionState, useState } from "react";
import { createEvent, type EventFormState } from "../../actions";
import { EVENT_TYPES } from "@/lib/event-types";
import { THEMES } from "@/lib/themes";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const initialState: EventFormState = { status: "idle" };

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [themeId, setThemeId] = useState(THEMES[0].id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground">Create an event</h1>

      <Card className="mt-6">
        <CardBody>
          <form action={formAction} className="space-y-5">
            <Field label="Event title" htmlFor="title" required>
              <Input id="title" name="title" type="text" required placeholder="Sam &amp; Alex's Wedding" />
            </Field>

            <Field label="Subtitle" htmlFor="subtitle" hint="Optional">
              <Input id="subtitle" name="subtitle" type="text" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Event type" htmlFor="eventType">
                <Select id="eventType" name="eventType" defaultValue="other">
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date" htmlFor="eventDate">
                <Input id="eventDate" name="eventDate" type="date" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Time" htmlFor="eventTime" hint="Optional">
                <Input id="eventTime" name="eventTime" type="text" placeholder="4:00 PM" />
              </Field>
              <Field label="Venue name" htmlFor="venueName">
                <Input id="venueName" name="venueName" type="text" />
              </Field>
            </div>

            <Field label="Venue address" htmlFor="venueAddress">
              <Input id="venueAddress" name="venueAddress" type="text" />
            </Field>

            <Field label="Description" htmlFor="description" hint="Optional">
              <Textarea id="description" name="description" rows={3} />
            </Field>

            <Field label="Theme">
              <input type="hidden" name="themeId" value={themeId} />
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      themeId === theme.id ? "border-accent ring-1 ring-accent" : "border-border hover:border-border-strong"
                    )}
                  >
                    <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
                      <div className="flex-1" style={{ background: theme.colors.background }} />
                      <div className="flex-1" style={{ background: theme.colors.accent }} />
                      <div className="flex-1" style={{ background: theme.colors.accentDark }} />
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{theme.label}</p>
                    <p className="text-xs text-muted">{theme.description}</p>
                  </button>
                ))}
              </div>
            </Field>

            {state.status === "error" && <p className="text-sm font-medium text-destructive">{state.message}</p>}

            <Button type="submit" loading={pending} className="w-full">
              {pending ? "Creating..." : "Create event"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
