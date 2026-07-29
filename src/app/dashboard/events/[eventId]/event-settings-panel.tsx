"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { updateEvent, deleteEvent, type EventFormInput } from "../../actions";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { EditIcon } from "@/components/icons";
import { EVENT_TYPES, getEventTypeLabel } from "@/lib/event-types";
import { THEMES, getTheme } from "@/lib/themes";
import type { EventRecord } from "@/lib/event";

const labelClass =
  "block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-gold/30 bg-white px-3 py-2 text-base text-foreground focus:border-gold-dark focus:outline-none";

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

export function EventSettingsPanel({ event }: { event: EventRecord }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EventFormInput>(toInput(event));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        await updateEvent(event.id, form);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  const handleDelete = async () => {
    await deleteEvent(event.id);
    router.push("/dashboard");
  };

  if (!editing) {
    const theme = getTheme(event.theme_id);
    return (
      <div className="rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">
              {getEventTypeLabel(event.event_type)} &middot; {theme.label}
            </p>
            <h1 className="mt-1 font-display text-xl text-foreground sm:text-2xl">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-1 text-sm text-foreground/70">{event.subtitle}</p>
            )}
            <p className="mt-2 text-sm text-foreground/60">
              {event.event_date}
              {event.event_time ? ` at ${event.event_time}` : ""}
              {event.venue_name ? ` — ${event.venue_name}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit event"
              title="Edit event"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gold-dark transition hover:bg-lavender/40"
            >
              <EditIcon />
            </button>
            <ConfirmIconButton
              label="Delete event"
              confirmText={`Delete "${event.title}"? This removes all its invites and RSVPs.`}
              onConfirm={handleDelete}
            />
          </div>
        </div>
        <Link
          href={`/e/${event.slug}`}
          target="_blank"
          className="mt-4 inline-block text-sm font-medium text-gold-dark hover:underline"
        >
          View public event page →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
      <div>
        <label className={labelClass}>Event title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Subtitle</label>
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Event type</label>
          <select
            value={form.eventType}
            onChange={(e) => set("eventType", e.target.value)}
            className={inputClass}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Time</label>
          <input
            type="text"
            value={form.eventTime}
            onChange={(e) => set("eventTime", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Venue name</label>
          <input
            type="text"
            value={form.venueName}
            onChange={(e) => set("venueName", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Venue address</label>
        <input
          type="text"
          value={form.venueAddress}
          onChange={(e) => set("venueAddress", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Theme</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => set("themeId", theme.id)}
              className={`rounded-xl border p-3 text-left transition ${
                form.themeId === theme.id
                  ? "border-gold-dark ring-2 ring-gold/30"
                  : "border-gold/20 hover:border-gold/50"
              }`}
            >
              <div
                className="h-8 w-full rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentDark})`,
                }}
              />
              <p className="mt-2 text-sm font-medium text-foreground">{theme.label}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(toInput(event));
            setEditing(false);
          }}
          disabled={isPending}
          className="rounded-lg border border-gold/40 px-4 py-2.5 font-display text-sm uppercase tracking-widest text-gold-dark transition hover:border-gold-dark disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
