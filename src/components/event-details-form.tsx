"use client";

import { THEMES, type ThemeId } from "@/lib/themes";
import { EVENT_TYPES } from "@/lib/event-types";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

export type EventDetailsValue = {
  title: string;
  subtitle: string;
  eventType: string;
  themeId: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  description: string;
};

// Shared by events/new and settings (docs/03 W6, docs/05) — one field set
// and one theme picker instead of two hand-maintained copies. Every input
// carries both a controlled value/onChange (for settings' client-state
// save flow) and a `name` (so events/new's <form action={formAction}>
// still collects it via FormData on submit — controlled inputs render real
// DOM elements FormData reads from regardless of how they're driven).
export function EventDetailsFields({
  value,
  onChange,
}: {
  value: EventDetailsValue;
  onChange: <K extends keyof EventDetailsValue>(key: K, next: EventDetailsValue[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Event title" htmlFor="title" required>
        <Input
          id="title"
          name="title"
          value={value.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Sam &amp; Alex's Wedding"
          required
        />
      </Field>

      <Field label="Subtitle" htmlFor="subtitle" hint="Optional">
        <Input id="subtitle" name="subtitle" value={value.subtitle} onChange={(e) => onChange("subtitle", e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Event type" htmlFor="eventType">
          <Select id="eventType" name="eventType" value={value.eventType} onChange={(e) => onChange("eventType", e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="eventDate">
          <Input id="eventDate" name="eventDate" type="date" value={value.eventDate} onChange={(e) => onChange("eventDate", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Time" htmlFor="eventTime" hint="Optional">
          <Input
            id="eventTime"
            name="eventTime"
            value={value.eventTime}
            onChange={(e) => onChange("eventTime", e.target.value)}
            placeholder="4:00 PM"
          />
        </Field>
        <Field label="Venue name" htmlFor="venueName">
          <Input id="venueName" name="venueName" value={value.venueName} onChange={(e) => onChange("venueName", e.target.value)} />
        </Field>
      </div>

      <Field label="Venue address" htmlFor="venueAddress">
        <Input
          id="venueAddress"
          name="venueAddress"
          value={value.venueAddress}
          onChange={(e) => onChange("venueAddress", e.target.value)}
        />
      </Field>

      <Field label="Description" htmlFor="description" hint="Optional">
        <Textarea
          id="description"
          name="description"
          rows={3}
          value={value.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </Field>

      <Field label="Theme">
        <input type="hidden" name="themeId" value={value.themeId} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange("themeId", theme.id as ThemeId)}
              className={cn(
                "overflow-hidden rounded-lg border text-left transition-colors",
                value.themeId === theme.id ? "border-accent ring-1 ring-accent" : "border-border hover:border-border-strong"
              )}
            >
              <div
                className="flex h-16 flex-col items-center justify-center px-2 text-center"
                style={{ background: theme.colors.background, color: theme.colors.foreground }}
              >
                <p className="font-display text-sm">Sample &amp; Names</p>
                <div className="mt-1.5 h-px w-8" style={{ background: theme.colors.accent }} />
              </div>
              <div
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentDark})` }}
              />
              <p className="px-2 py-1.5 text-xs font-medium text-foreground">{theme.label}</p>
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
