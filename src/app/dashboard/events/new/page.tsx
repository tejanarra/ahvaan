"use client";

import { useActionState, useState } from "react";
import { createEvent, type EventFormState } from "../../actions";
import { EVENT_TYPES } from "@/lib/event-types";
import { THEMES } from "@/lib/themes";

const initialState: EventFormState = { status: "idle" };

const labelClass =
  "block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-gold/30 bg-white px-3 py-2 text-base text-foreground focus:border-gold-dark focus:outline-none";

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [themeId, setThemeId] = useState(THEMES[0].id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-xl uppercase tracking-[0.1em] text-gold-dark sm:text-2xl">
        Create an Event
      </h1>

      <form action={formAction} className="mt-6 space-y-5 rounded-2xl border border-gold/25 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="title" className={labelClass}>
            Event title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Swathi &amp; Sai Teja's Wedding"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="subtitle" className={labelClass}>
            Subtitle (optional)
          </label>
          <input id="subtitle" name="subtitle" type="text" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventType" className={labelClass}>
              Event type
            </label>
            <select id="eventType" name="eventType" defaultValue="other" className={inputClass}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="eventDate" className={labelClass}>
              Date
            </label>
            <input id="eventDate" name="eventDate" type="date" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventTime" className={labelClass}>
              Time (optional)
            </label>
            <input
              id="eventTime"
              name="eventTime"
              type="text"
              placeholder="4:00 PM"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="venueName" className={labelClass}>
              Venue name
            </label>
            <input id="venueName" name="venueName" type="text" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="venueAddress" className={labelClass}>
            Venue address
          </label>
          <input id="venueAddress" name="venueAddress" type="text" className={inputClass} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>Theme</span>
          <input type="hidden" name="themeId" value={themeId} />
          <div className="mt-2 grid grid-cols-2 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeId(theme.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  themeId === theme.id
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
                <p className="text-xs text-foreground/50">{theme.description}</p>
              </button>
            ))}
          </div>
        </div>

        {state.status === "error" && (
          <p className="text-sm font-medium text-red-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
}
