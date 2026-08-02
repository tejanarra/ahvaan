"use client";

import { useState, useTransition } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";

const KIND_OPTIONS = [
  { value: "message", label: "Message" },
  { value: "redirect", label: "Redirect" },
  { value: "custom_html", label: "Custom HTML" },
];

// One editor, two call sites: Guests → Actions (events.rsvp_actions,
// rsvpMode=true — only the RSVP context has an attending/declining split
// and venue data to show) and Forms → [form] → Actions (forms.actions,
// rsvpMode=false). Same stored shape either way
// (src/lib/schemas/post-submit-actions.ts) — the extra fields are a
// rendering difference, not a schema difference.
export function ActionsEditor({
  initialAction,
  rsvpMode = false,
  onSave,
}: {
  initialAction: PostSubmitAction;
  rsvpMode?: boolean;
  onSave: (action: PostSubmitAction) => Promise<void>;
}) {
  const [kind, setKind] = useState<PostSubmitAction["kind"]>(initialAction.kind);
  const [heading, setHeading] = useState(initialAction.kind === "message" ? initialAction.heading : "Thanks!");
  const [headingNo, setHeadingNo] = useState(
    initialAction.kind === "message" ? initialAction.headingNo ?? "Thanks for letting us know" : "Thanks for letting us know"
  );
  const [message, setMessage] = useState(initialAction.kind === "message" ? initialAction.message : "Your response has been recorded.");
  const [showVenue, setShowVenue] = useState(initialAction.kind === "message" ? Boolean(initialAction.showVenue) : false);
  const [url, setUrl] = useState(initialAction.kind === "redirect" ? initialAction.url : "");
  const [html, setHtml] = useState(initialAction.kind === "custom_html" ? initialAction.html : "");
  const [css, setCss] = useState(initialAction.kind === "custom_html" ? initialAction.css : "");
  const [heightPx, setHeightPx] = useState(initialAction.kind === "custom_html" ? initialAction.heightPx : 300);

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const buildAction = (): PostSubmitAction => {
    if (kind === "redirect") return { kind: "redirect", url };
    if (kind === "custom_html") return { kind: "custom_html", html, css, heightPx: heightPx || 300 };
    return { kind: "message", heading, message, ...(rsvpMode ? { showVenue, headingNo } : {}) };
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await onSave(buildAction());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">After someone submits</h2>
        <p className="mt-0.5 text-xs text-muted">Choose what a guest sees right after they submit.</p>
      </div>

      <ToggleGroup
        options={KIND_OPTIONS}
        value={kind}
        onChange={(v) => setKind(v as PostSubmitAction["kind"])}
        fullWidth="mobile"
      />

      {kind === "message" && (
        <div className="space-y-3">
          <Field label={rsvpMode ? "Heading when attending" : "Heading"}>
            <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
          </Field>
          {rsvpMode && (
            <Field label="Heading when not attending">
              <Input value={headingNo} onChange={(e) => setHeadingNo(e.target.value)} />
            </Field>
          )}
          {!rsvpMode && (
            <Field label="Message">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </Field>
          )}
          {rsvpMode && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={showVenue} onChange={(e) => setShowVenue(e.target.checked)} />
              Show the venue map after a guest responds
            </label>
          )}
        </div>
      )}

      {kind === "redirect" && (
        <Field label="Redirect URL" hint="Guests are sent here immediately after submitting — no confirmation screen shown.">
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/thank-you" />
        </Field>
      )}

      {kind === "custom_html" && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Full visual control over the confirmation screen, sandboxed the same way as the Custom HTML/CSS/JS block. Write{" "}
            <code className="font-mono">{"{{responses_summary}}"}</code> to show the guest&rsquo;s own answers.
          </p>
          <Field label="HTML">
            <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={5} spellCheck={false} className="font-mono text-xs" />
          </Field>
          <Field label="CSS">
            <Textarea value={css} onChange={(e) => setCss(e.target.value)} rows={4} spellCheck={false} className="font-mono text-xs" />
          </Field>
          <Field label="Frame height">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={50}
                max={4000}
                value={heightPx}
                onChange={(e) => setHeightPx(Number(e.target.value) || 300)}
                className="w-24"
              />
              <span className="text-sm text-muted">px</span>
            </div>
          </Field>
        </div>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        {saved && <span className="text-sm text-success">Saved.</span>}
        <Button size="sm" onClick={handleSave} loading={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
