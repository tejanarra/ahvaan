import type { HeroConfig } from "../types";
import type { PageRenderContext } from "../context";
import { getEventTypeLabel } from "@/lib/event-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/image-upload-field";
import type { EventRecord } from "@/lib/data/events";

function formatEventDate(event: PageRenderContext["event"] | EventRecord) {
  if (!event.event_date) return null;
  const date = new Date(`${event.event_date}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return event.event_time ? `${formatted} at ${event.event_time}` : formatted;
}

export const heroDefaultConfig: HeroConfig = {
  showEventType: true,
  showTitle: true,
  showSubtitle: true,
  showVenueLine: true,
  showDescription: true,
};

function ShowToggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="mt-1.5 flex items-center gap-2 text-xs text-muted">
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function HeroEdit({
  config,
  onChange,
  event,
  onEventFieldsChange,
}: {
  config: HeroConfig;
  onChange: (next: HeroConfig) => void;
  event?: EventRecord;
  onEventFieldsChange?: (patch: Partial<EventRecord>) => void;
}) {
  if (!event || !onEventFieldsChange) {
    // Should never happen in practice (the page builder always threads
    // these through) — fall back to just the visibility toggles so this
    // never crashes if a future caller forgets to pass them.
    return (
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={config.showEventType !== false} onChange={(e) => onChange({ ...config, showEventType: e.target.checked })} />
        Event type label
      </label>
    );
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={config.showEventType !== false}
          onChange={(e) => onChange({ ...config, showEventType: e.target.checked })}
        />
        Show event type label
      </label>
      <p className="-mt-3 text-xs text-muted">A small label above the title, e.g. &ldquo;Wedding&rdquo; or &ldquo;Birthday&rdquo;.</p>

      <div className="space-y-1.5 border-t border-border pt-4">
        <ImageUploadField
          eventId={event.id}
          label="Cover image"
          hint="Shown above the title on the invite. Optional."
          value={event.cover_image_url ?? ""}
          onChange={(url) => onEventFieldsChange({ cover_image_url: url || null })}
        />
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <Field label="Title">
          <Input value={event.title} onChange={(e) => onEventFieldsChange({ title: e.target.value })} />
        </Field>
        <ShowToggle
          checked={config.showTitle !== false}
          onChange={(checked) => onChange({ ...config, showTitle: checked })}
          label="Show title on the invite"
        />
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <Field label="Subtitle" hint="Optional — a short line under the title.">
          <Input value={event.subtitle ?? ""} onChange={(e) => onEventFieldsChange({ subtitle: e.target.value })} placeholder="e.g. Join us as we celebrate" />
        </Field>
        <ShowToggle
          checked={config.showSubtitle !== false}
          onChange={(checked) => onChange({ ...config, showSubtitle: checked })}
          label="Show subtitle on the invite"
        />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Date &amp; venue</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Event date">
            <Input
              type="date"
              value={event.event_date ?? ""}
              onChange={(e) => onEventFieldsChange({ event_date: e.target.value || null })}
            />
          </Field>
          <Field label="Event time">
            <Input
              value={event.event_time ?? ""}
              onChange={(e) => onEventFieldsChange({ event_time: e.target.value || null })}
              placeholder="4:00 PM"
            />
          </Field>
        </div>
        <Field label="Venue name">
          <Input
            value={event.venue_name ?? ""}
            onChange={(e) => onEventFieldsChange({ venue_name: e.target.value || null })}
            placeholder="e.g. The Grand Hall"
          />
        </Field>
        <ShowToggle
          checked={config.showVenueLine !== false}
          onChange={(checked) => onChange({ ...config, showVenueLine: checked })}
          label="Show date/venue line on the invite"
        />
      </div>

      <div className="space-y-1.5 border-t border-border pt-4">
        <Field label="Description" hint="Optional — a few sentences guests will see below the venue.">
          <Textarea
            rows={3}
            value={event.description ?? ""}
            onChange={(e) => onEventFieldsChange({ description: e.target.value || null })}
          />
        </Field>
        <ShowToggle
          checked={config.showDescription !== false}
          onChange={(checked) => onChange({ ...config, showDescription: checked })}
          label="Show description on the invite"
        />
      </div>
    </div>
  );
}

export function HeroRender({ config, ctx }: { config: HeroConfig; ctx: PageRenderContext }) {
  const { event } = ctx;
  const dateLine = formatEventDate(event);
  const venueLine = [dateLine, event.venue_name].filter(Boolean).join(" — ");

  return (
    <div className="w-full">
      {event.cover_image_url && (
        <div className="mb-6 aspect-[3/2] w-full max-w-md overflow-hidden rounded-lg">
          {/* Hosts can point this at any external image URL (set outside the
              page builder, in event settings) — next/image would need that
              domain allow-listed in next.config ahead of time, which isn't
              workable for arbitrary host input, so a plain <img> is used
              here too (same reasoning as the Image block). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
        </div>
      )}
      {config.showEventType !== false && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
          {getEventTypeLabel(event.event_type)}
        </p>
      )}
      {config.showTitle !== false && event.title && (
        <h1
          className="mt-2 leading-[1.1] text-[var(--t-fg)]"
          style={{ fontFamily: "var(--t-font-display)", fontSize: "clamp(1.75rem, 4vw + 1rem, 3rem)" }}
        >
          {event.title}
        </h1>
      )}
      {config.showSubtitle !== false && event.subtitle && (
        <p className="mt-2 text-base text-[var(--t-fg)]/75">{event.subtitle}</p>
      )}
      {config.showVenueLine !== false && venueLine && (
        <p className="mt-4 text-sm text-[var(--t-fg)]/70">{venueLine}</p>
      )}
      {config.showDescription !== false && event.description && (
        <p className="mt-4 inline-block max-w-md text-sm leading-relaxed text-[var(--t-fg)]/75">{event.description}</p>
      )}
    </div>
  );
}
