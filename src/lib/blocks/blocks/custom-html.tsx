import type { CustomHtmlConfig } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { buildSandboxSrcDoc } from "../sandbox";
import { applyComponentShortcodes } from "../shortcodes";

export const customHtmlDefaultConfig: CustomHtmlConfig = {
  html: "<p>Write your own HTML here.</p>",
  css: "p { text-align: center; font-size: 1.1rem; }",
  js: "",
  heightPx: 300,
};

export function CustomHtmlEdit({
  config,
  onChange,
}: {
  config: CustomHtmlConfig;
  onChange: (next: CustomHtmlConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Runs in a sandboxed frame with its own isolated origin — it can never read
        guest cookies/sessions, reach the rest of this site, or affect other
        hosts&rsquo; pages. Write <code className="font-mono">{"{{rsvp_form}}"}</code> or{" "}
        <code className="font-mono">{"{{venue_map}}"}</code> anywhere in the HTML to embed the
        real, working RSVP form or venue map, styled by your own CSS below.
      </p>
      <Field label="Reusable name">
        <Input
          type="text"
          value={config.reusableName ?? ""}
          onChange={(e) => onChange({ ...config, reusableName: e.target.value || undefined })}
          placeholder="e.g. message-card"
        />
      </Field>
      <p className="-mt-2 text-xs text-muted">
        Optional. Naming this block saves it to your component library when you hit Save — reference it from any
        block&rsquo;s HTML (this event or any other) with{" "}
        <code className="font-mono">{'<custom-component name="' + (config.reusableName || "name") + '" />'}</code>.
        Any attribute on that tag (e.g. <code className="font-mono">message=&quot;Hi!&quot;</code>) is available
        inside this snippet as <code className="font-mono">{"{{message}}"}</code>.
      </p>
      <Field label="HTML">
        <Textarea
          value={config.html}
          onChange={(e) => onChange({ ...config, html: e.target.value })}
          rows={6}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </Field>
      <Field label="CSS">
        <Textarea
          value={config.css}
          onChange={(e) => onChange({ ...config, css: e.target.value })}
          rows={5}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </Field>
      <Field label="JavaScript" hint="Optional">
        <Textarea
          value={config.js}
          onChange={(e) => onChange({ ...config, js: e.target.value })}
          rows={5}
          spellCheck={false}
          className="font-mono text-xs"
        />
      </Field>
      <Field label="Frame height">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={50}
            max={2000}
            value={config.heightPx}
            onChange={(e) => onChange({ ...config, heightPx: Number(e.target.value) || 0 })}
            className="w-24"
          />
          <span className="text-sm text-muted">px</span>
        </div>
      </Field>
    </div>
  );
}

export function CustomHtmlRender({ config, ctx }: { config: CustomHtmlConfig; ctx: PageRenderContext }) {
  // The Edit control clamps to 50–2000, but a hand-edited JSON schema can
  // set anything — clamp here too so a bad value can't collapse the frame
  // to 0/negative height or blow up the page with an absurd one.
  const height = Number.isFinite(config.heightPx) ? Math.min(4000, Math.max(50, config.heightPx)) : 300;
  const html = applyComponentShortcodes(config.html, {
    eventId: ctx.event.id,
    inviteId: ctx.inviteId,
    venueName: ctx.event.venue_name,
    venueAddress: ctx.event.venue_address,
    schema: ctx.schema,
    customComponents: ctx.customComponents,
  });
  return (
    <iframe
      srcDoc={buildSandboxSrcDoc({ ...config, html })}
      // allow-scripts without allow-same-origin: scripts can run, but the
      // frame gets a unique opaque origin with no access to this site's
      // cookies/storage/DOM or the parent window — the actual isolation
      // guarantee, not just a visual sandbox.
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      title="Custom content"
      style={{ height: `${height}px` }}
      className="w-full rounded-lg border-0"
    />
  );
}
