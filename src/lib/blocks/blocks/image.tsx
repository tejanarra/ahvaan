import type { ImageConfig } from "../types";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const imageDefaultConfig: ImageConfig = { url: "", alt: "" };

export function ImageEdit({
  config,
  onChange,
}: {
  config: ImageConfig;
  onChange: (next: ImageConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Image URL" hint="A direct link to an image (jpg, png, gif, webp).">
        <Input
          type="text"
          value={config.url}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label="Alt text" hint="A short description for screen readers — leave blank if purely decorative.">
        <Input type="text" value={config.alt ?? ""} onChange={(e) => onChange({ ...config, alt: e.target.value })} placeholder="e.g. The couple at sunset" />
      </Field>
      <Field label="Height" hint="Leave blank to keep the image's natural proportions.">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={20}
            max={2000}
            value={config.heightPx ?? ""}
            onChange={(e) => onChange({ ...config, heightPx: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Auto"
            className="w-24"
          />
          <span className="text-sm text-muted">px tall (crops to fit)</span>
        </div>
      </Field>
    </div>
  );
}

export function ImageRender({ config }: { config: ImageConfig }) {
  if (!config.url) return null;
  // The Edit control clamps to 20–2000, but a hand-edited JSON schema can
  // set anything — clamp here too so a bad value can't collapse the image
  // to 0/negative height or blow up the page with an absurd one.
  const height =
    config.heightPx !== undefined && Number.isFinite(config.heightPx)
      ? Math.min(2000, Math.max(20, config.heightPx))
      : undefined;
  return (
    // Hosts can point this at any external image URL, so a plain <img> is
    // used rather than next/image (which requires allow-listing domains
    // ahead of time in next.config — not workable for arbitrary host input).
    // Width is capped by the block's own Layout > Width preset (the shared
    // wrapper every block gets) — this element just fills that box. Height
    // is independent: unset stays at natural aspect ratio (h-auto), a set
    // value crops via object-fit: cover.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={config.url}
      alt={config.alt ?? ""}
      className={height ? "w-full rounded-lg object-cover" : "h-auto w-full rounded-lg object-cover"}
      style={height ? { height: `${height}px` } : undefined}
    />
  );
}
