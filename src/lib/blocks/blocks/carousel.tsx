"use client";

import { useEffect, useState } from "react";
import type { CarouselConfig, CarouselAspectRatio } from "../types";
import type { PageRenderContext } from "../context";
import type { EventRecord } from "@/lib/data/events";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ImageUploadField } from "@/components/image-upload-field";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { ArrowLeftIcon } from "@/components/icons";

export const carouselDefaultConfig: CarouselConfig = {
  images: [],
  aspectRatio: "3/2",
  autoplay: false,
  intervalMs: 5000,
  showArrows: true,
  showDots: true,
};

const ASPECT_OPTIONS: { value: CarouselAspectRatio; label: string }[] = [
  { value: "1/1", label: "Square (1:1)" },
  { value: "4/3", label: "Standard (4:3)" },
  { value: "3/2", label: "Classic (3:2)" },
  { value: "16/9", label: "Widescreen (16:9)" },
];

export function CarouselEdit({
  config,
  onChange,
  event,
}: {
  config: CarouselConfig;
  onChange: (next: CarouselConfig) => void;
  event?: EventRecord;
}) {
  const images = config.images ?? [];

  const addImage = () => onChange({ ...config, images: [...images, { url: "", alt: "" }] });
  const removeImage = (index: number) => onChange({ ...config, images: images.filter((_, i) => i !== index) });
  const updateImage = (index: number, patch: Partial<{ url: string; alt: string }>) =>
    onChange({ ...config, images: images.map((img, i) => (i === index ? { ...img, ...patch } : img)) });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...config, images: next });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Slides ({images.length})
        </p>
        {images.map((img, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">Slide {index + 1}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move slide up"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move slide down"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
                <ConfirmIconButton
                  label="Remove slide"
                  confirmText={`Remove slide ${index + 1}?`}
                  onConfirm={async () => removeImage(index)}
                />
              </div>
            </div>
            {event ? (
              <ImageUploadField
                eventId={event.id}
                label="Image"
                value={img.url}
                onChange={(url) => updateImage(index, { url })}
              />
            ) : (
              <Field label="Image URL">
                <Input value={img.url} onChange={(e) => updateImage(index, { url: e.target.value })} placeholder="https://…" />
              </Field>
            )}
            <Field label="Alt text" hint="For screen readers — leave blank if purely decorative.">
              <Input value={img.alt ?? ""} onChange={(e) => updateImage(index, { alt: e.target.value })} />
            </Field>
          </div>
        ))}
        <button
          type="button"
          onClick={addImage}
          className="w-full rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
        >
          + Add slide
        </button>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <Field label="Slide shape">
          <Select
            value={config.aspectRatio ?? "3/2"}
            onChange={(e) => onChange({ ...config, aspectRatio: e.target.value as CarouselAspectRatio })}
          >
            {ASPECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={config.showArrows !== false} onChange={(e) => onChange({ ...config, showArrows: e.target.checked })} />
          Show prev/next arrows
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={config.showDots !== false} onChange={(e) => onChange({ ...config, showDots: e.target.checked })} />
          Show dot indicators
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={config.autoplay ?? false} onChange={(e) => onChange({ ...config, autoplay: e.target.checked })} />
          Auto-advance slides
        </label>
        {config.autoplay && (
          <Field label="Seconds between slides">
            <Input
              type="number"
              min={2}
              max={30}
              value={Math.round((config.intervalMs ?? 5000) / 1000)}
              onChange={(e) => onChange({ ...config, intervalMs: Math.max(2, Number(e.target.value) || 5) * 1000 })}
              className="w-24"
            />
          </Field>
        )}
      </div>
    </div>
  );
}

export function CarouselRender({ config }: { config: CarouselConfig; ctx: PageRenderContext }) {
  const images = config.images?.filter((img) => img.url) ?? [];
  const [index, setIndex] = useState(0);
  // Slides can be removed in the builder while this one's showing a later
  // index — clamped at read time rather than corrected via an effect, so
  // there's no render where `index` briefly points past the end.
  const safeIndex = images.length > 0 ? Math.min(index, images.length - 1) : 0;

  const canAutoplay = (config.autoplay ?? false) && images.length > 1;
  useEffect(() => {
    if (!canAutoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const intervalMs = Math.max(2000, config.intervalMs ?? 5000);
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [canAutoplay, config.intervalMs, images.length]);

  if (images.length === 0) return null;

  const current = images[safeIndex];
  const showArrows = config.showArrows !== false && images.length > 1;
  const showDots = config.showDots !== false && images.length > 1;

  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-[var(--t-surface)]"
        style={{ aspectRatio: config.aspectRatio ?? "3/2" }}
      >
        {/* Arbitrary host-pasted/uploaded image URLs — next/image would need
            every domain allow-listed ahead of time, same reasoning as the
            Image block. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.alt ?? ""} className="h-full w-full object-cover" />

        {showArrows && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <ArrowLeftIcon className="h-4 w-4 rotate-180" />
            </button>
          </>
        )}
      </div>

      {showDots && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === safeIndex}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === safeIndex ? "bg-[var(--t-accent-dark)]" : "bg-[var(--t-accent)]/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
