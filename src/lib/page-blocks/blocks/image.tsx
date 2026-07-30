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
    </div>
  );
}

export function ImageRender({ config }: { config: ImageConfig }) {
  if (!config.url) return null;
  return (
    // Hosts can point this at any external image URL, so a plain <img> is
    // used rather than next/image (which requires allow-listing domains
    // ahead of time in next.config — not workable for arbitrary host input).
    // Width is capped by the block's own Layout > Width preset (the shared
    // wrapper every block gets) — this element just fills that box.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={config.url} alt={config.alt ?? ""} className="h-auto w-full rounded-lg object-cover" />
  );
}
