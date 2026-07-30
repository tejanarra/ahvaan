"use client";

import { useActionState, useState } from "react";
import { createEvent, type EventFormState } from "../../actions";
import { THEMES } from "@/lib/themes";
import { EventDetailsFields, type EventDetailsValue } from "@/components/event-details-form";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const initialState: EventFormState = { status: "idle" };

const INITIAL_VALUE: EventDetailsValue = {
  title: "",
  subtitle: "",
  eventType: "other",
  themeId: THEMES[0].id,
  eventDate: "",
  eventTime: "",
  venueName: "",
  venueAddress: "",
  description: "",
};

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [value, setValue] = useState<EventDetailsValue>(INITIAL_VALUE);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground">Create an event</h1>

      <Card className="mt-6">
        <CardBody>
          <form action={formAction} className="space-y-5">
            <EventDetailsFields
              value={value}
              onChange={(key, next) => setValue((v) => ({ ...v, [key]: next }))}
            />

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
