"use client";

import { useState } from "react";
import type { BlockInstance, PageSchema } from "@/lib/blocks/types";
import { BLOCK_REGISTRY } from "@/lib/blocks/registry";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// The whole-schema power-user escape hatch (Form.io's "Form JSON" view,
// applied here): everything the visual builder edits, as one editable blob.
// Deliberately outside the per-block/page CSS fields already in the
// Properties Panel — this is the outermost surface, not a replacement for
// those.
export type EditableSchema = Pick<PageSchema, "blocks" | "pageStyle" | "themeOverrides" | "fontFamily" | "customPage">;

// `insideContainer` blocks a container from containing another container —
// the app enforces "one level of nesting" everywhere else (the palette, the
// canvas's drag-and-drop resolution, the Container block's own child list),
// so a hand-edited JSON schema slipping one in would put the canvas in a
// shape none of that code was ever tested against.
function isValidBlock(b: unknown, insideContainer = false): b is BlockInstance {
  if (!b || typeof b !== "object") return false;
  const rec = b as Record<string, unknown>;
  if (typeof rec.id !== "string" || typeof rec.type !== "string") return false;
  if (!(rec.type in BLOCK_REGISTRY)) return false;
  if (!rec.config || typeof rec.config !== "object") return false;
  if (rec.type === "container") {
    if (insideContainer) return false;
    if (!Array.isArray(rec.children) || !rec.children.every((child) => isValidBlock(child, true))) return false;
  }
  return true;
}

// Every block id must be unique across the whole tree (top-level and
// nested) — `getBlockList`/`listContaining`/selection all look blocks up by
// id and take the first match, so a duplicate would silently make the
// canvas select, edit, or delete the wrong one.
function findDuplicateId(blocks: BlockInstance[]): string | null {
  const seen = new Set<string>();
  for (const block of blocks) {
    if (seen.has(block.id)) return block.id;
    seen.add(block.id);
    if ("children" in block) {
      for (const child of block.children) {
        if (seen.has(child.id)) return child.id;
        seen.add(child.id);
      }
    }
  }
  return null;
}

// Not just `JSON.parse` — a malformed-but-syntactically-valid object (an
// unrecognized block `type`, a missing `config`) must not be accepted and
// silently corrupt the visual builder's state or crash the canvas.
function validateSchema(raw: unknown): { ok: true; value: EditableSchema } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Root must be a JSON object." };
  const rec = raw as Record<string, unknown>;

  if (!Array.isArray(rec.blocks)) return { ok: false, error: '"blocks" must be an array.' };
  for (const [i, b] of rec.blocks.entries()) {
    if (!isValidBlock(b)) {
      return {
        ok: false,
        error: `blocks[${i}] isn't a valid block — check its "id", "type" (must be a recognized block type, and containers can't nest inside containers), and "config".`,
      };
    }
  }
  const duplicateId = findDuplicateId(rec.blocks as BlockInstance[]);
  if (duplicateId) {
    return { ok: false, error: `Two blocks share the id "${duplicateId}" — every block, including nested ones, needs a unique id.` };
  }
  if (rec.pageStyle !== undefined && typeof rec.pageStyle !== "string") {
    return { ok: false, error: '"pageStyle" must be a string.' };
  }
  if (rec.fontFamily !== undefined && typeof rec.fontFamily !== "string") {
    return { ok: false, error: '"fontFamily" must be a string.' };
  }
  if (rec.themeOverrides !== undefined && (typeof rec.themeOverrides !== "object" || rec.themeOverrides === null || Array.isArray(rec.themeOverrides))) {
    return { ok: false, error: '"themeOverrides" must be an object.' };
  }
  if (rec.customPage !== undefined) {
    const cp = rec.customPage as Record<string, unknown> | null;
    if (
      !cp ||
      typeof cp !== "object" ||
      typeof cp.enabled !== "boolean" ||
      typeof cp.html !== "string" ||
      typeof cp.css !== "string" ||
      typeof cp.js !== "string"
    ) {
      return { ok: false, error: '"customPage" must be an object with {enabled: boolean, html: string, css: string, js: string}.' };
    }
  }

  return { ok: true, value: rec as EditableSchema };
}

export function JsonSchemaEditor({
  value,
  onApply,
  onCancel,
}: {
  value: EditableSchema;
  onApply: (next: EditableSchema) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  const handleFormat = () => {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2));
      setError("");
    } catch {
      setError("Can't format — the JSON isn't valid yet.");
    }
  };

  const handleApply = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON — check for a missing comma, quote, or bracket.");
      return;
    }
    const result = validateSchema(parsed);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    onApply(result.value);
  };

  const handleRevert = () => {
    // Reverts to the last-known-good in-memory schema (the `value` prop),
    // not the last server-saved copy — bouncing into Code view and back
    // shouldn't lose visual-builder edits made earlier in this session.
    setText(JSON.stringify(value, null, 2));
    setError("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Edit page as JSON</p>
          <p className="text-xs text-muted">
            The whole page schema — blocks, page CSS, theme overrides, font, and the custom-page escape hatch. Apply validates
            block shapes before replacing the visual builder&rsquo;s state.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleFormat}>
            Format
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleRevert}>
            Revert
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Apply
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Back to visual builder
          </Button>
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none font-mono text-xs"
      />
    </div>
  );
}
