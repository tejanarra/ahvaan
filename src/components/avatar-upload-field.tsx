"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAvatar } from "@/app/dashboard/profile/actions";
import { compressImageIfNeeded } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Same upload-or-nothing shape as ImageUploadField, minus the "or paste a
// URL" fallback (a profile photo is always an upload, never an external
// link) and rendered as a circular preview instead of a small thumbnail.
export function AvatarUploadField({
  value,
  onChange,
}: {
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

    startTransition(async () => {
      try {
        const upload = await compressImageIfNeeded(file);
        const formData = new FormData();
        formData.set("file", upload);
        const url = await uploadAvatar(formData);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted">
            No photo
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : value ? "Replace photo" : "Upload photo"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
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
    </div>
  );
}
