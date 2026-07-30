import type { ImageConfig, ImageFit } from "../types";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup } from "@/components/ui/toggle-group";

export const imageDefaultConfig: ImageConfig = { url: "", alt: "" };

const FIT_OPTIONS: { value: ImageFit; label: string }[] = [
  { value: "cover", label: "Fill & crop" },
  { value: "contain", label: "Fit, no crop" },
];

export function ImageEdit({
  config,
  onChange,
}: {
  config: ImageConfig;
  onChange: (next: ImageConfig) => void;
}) {
  const fit: ImageFit = config.fit ?? "cover";
  const hasMaxHeight = config.maxHeightPx !== undefined;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Source</p>
        <Field label="Image URL" hint="A direct link to an image (jpg, png, gif, webp).">
          <Input
            type="text"
            value={config.url}
            onChange={(e) => onChange({ ...config, url: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Alt text" hint="A short description for screen readers — leave blank if purely decorative.">
          <Input
            type="text"
            value={config.alt ?? ""}
            onChange={(e) => onChange({ ...config, alt: e.target.value })}
            placeholder="e.g. The couple at sunset"
          />
        </Field>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Size &amp; fit</p>

        <Field label="Max height" hint="Caps how tall the image can get — leave blank for no limit.">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={20}
              max={2000}
              value={config.maxHeightPx ?? ""}
              onChange={(e) =>
                onChange({ ...config, maxHeightPx: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="No limit"
              className="w-28"
            />
            <span className="text-sm text-muted">px</span>
          </div>
        </Field>

        <Field
          label="When the image is taller than that"
          hint={
            fit === "cover"
              ? "Fills the full height and crops whatever doesn't fit."
              : "Shrinks the whole image down so it always stays fully visible."
          }
        >
          <ToggleGroup
            size="md"
            options={FIT_OPTIONS}
            value={fit}
            onChange={(value) => onChange({ ...config, fit: value as ImageFit })}
            aria-label="How to fit the image within the max height"
            className={!hasMaxHeight ? "pointer-events-none opacity-40" : undefined}
          />
        </Field>
      </div>
    </div>
  );
}

export function ImageRender({ config }: { config: ImageConfig }) {
  if (!config.url) return null;

  // The Edit control clamps to 20–2000, but a hand-edited JSON schema can
  // set anything — clamp here too so a bad value can't collapse the image
  // to 0/negative height or blow up the page with an absurd one.
  const maxHeight =
    config.maxHeightPx !== undefined && Number.isFinite(config.maxHeightPx)
      ? Math.min(2000, Math.max(20, config.maxHeightPx))
      : undefined;
  const fit = config.fit ?? "cover";

  if (!maxHeight) {
    // No cap set: natural aspect ratio, full block width — the original,
    // simplest behavior.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={config.url} alt={config.alt ?? ""} className="h-auto w-full rounded-lg object-cover" />;
  }

  if (fit === "contain") {
    // A real *max* height: the browser only shrinks the image down when it
    // would otherwise exceed maxHeight — a shorter image renders at its
    // natural size, nothing is ever cropped. Every block's Render output
    // sits inside a `display: flex` wrapper (see layoutWrapperStyle) —
    // without explicit width/height: auto and flexShrink: 0, a flex item
    // with only max-height set can resolve to a 0×0 hypothetical main size
    // instead of using the image's intrinsic aspect ratio, so those are
    // pinned explicitly rather than left to default.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={config.url}
        alt={config.alt ?? ""}
        className="mx-auto block max-w-full rounded-lg object-contain"
        style={{ maxHeight: `${maxHeight}px`, width: "auto", height: "auto", flexShrink: 0 }}
      />
    );
  }

  // "cover": the cap acts as a hard crop box so the image always fills the
  // full block width up to that height, cropping any excess.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={config.url}
      alt={config.alt ?? ""}
      className="w-full rounded-lg object-cover"
      style={{ height: `${maxHeight}px` }}
    />
  );
}
