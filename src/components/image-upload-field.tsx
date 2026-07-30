"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImage } from "@/app/dashboard/events/[eventId]/actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Shared by every image URL input (hero cover, Image block) — a host can
// either upload a file (stored in the `event-images` Supabase Storage
// bucket, docs/07 Phase 4) or paste any external URL directly; upload is
// the happy path, a pasted URL is the fallback for images already hosted
// elsewhere.
export function ImageUploadField({
  eventId,
  label = "Image",
  hint,
  value,
  onChange,
}: {
  eventId: string;
  label?: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [error, setError] = useState("");
  const [isUploading, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 5MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        const url = await uploadImage(eventId, formData);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <Field label={label} hint={hint} error={error || undefined}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : "Upload image"}
        </Button>
        {value && (
          // Arbitrary host-pasted URLs (any domain) alongside our own
          // Storage public URLs — next/image would need every domain
          // allow-listed ahead of time, not workable here (same reasoning
          // as the Image block/hero cover render paths).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-9 w-9 shrink-0 rounded-md border border-border object-cover" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL — https://…"
        className="mt-1.5"
      />
    </Field>
  );
}
