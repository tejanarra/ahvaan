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

// Containers can nest inside containers (arbitrarily, up to the depth cap
// in lib/schemas/page-schema.ts) — the canvas's drag-and-drop resolution,
// the Container block's own child list, and this validator all walk the
// tree recursively, so nesting depth isn't restricted here beyond that cap.
const MAX_CONTAINER_DEPTH = 8;

function isValidBlock(b: unknown, depth = 0): b is BlockInstance {
  if (!b || typeof b !== "object") return false;
  const rec = b as Record<string, unknown>;
  if (typeof rec.id !== "string" || typeof rec.type !== "string") return false;
  if (!(rec.type in BLOCK_REGISTRY)) return false;
  if (!rec.config || typeof rec.config !== "object") return false;
  if (rec.type === "container") {
    if (depth >= MAX_CONTAINER_DEPTH) return false;
    if (!Array.isArray(rec.children) || !rec.children.every((child) => isValidBlock(child, depth + 1))) return false;
  }
  return true;
}

// Every block id must be unique across the whole tree, at any depth —
// `getBlockList`/`listContaining`/selection all look blocks up by id and
// take the first match, so a duplicate would silently make the canvas
// select, edit, or delete the wrong one.
function findDuplicateId(blocks: BlockInstance[], seen = new Set<string>()): string | null {
  for (const block of blocks) {
    if (seen.has(block.id)) return block.id;
    seen.add(block.id);
    if ("children" in block) {
      const duplicate = findDuplicateId(block.children, seen);
      if (duplicate) return duplicate;
    }
  }
  return null;
}

type PageFields = Pick<EditableSchema, "pageStyle" | "themeOverrides" | "fontFamily" | "customPage">;

function validatePageFields(raw: unknown): { ok: true; value: PageFields } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Page settings must be a JSON object." };
  const rec = raw as Record<string, unknown>;
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
  return { ok: true, value: rec as PageFields };
}

function blockSectionTitle(block: BlockInstance): string {
  const label = block.name || BLOCK_REGISTRY[block.type]?.label || block.type;
  const count = "children" in block ? countBlocks(block.children) : 0;
  return count > 0 ? `${label} (${count} nested)` : label;
}

function countBlocks(blocks: BlockInstance[]): number {
  return blocks.reduce((sum, b) => sum + 1 + ("children" in b ? countBlocks(b.children) : 0), 0);
}

// One block's JSON, collapsed by default — expanding a specific block
// (rather than scrolling one giant blob) is what makes editing a page with
// several nested containers actually manageable.
function BlockSection({
  block,
  text,
  onTextChange,
  error,
}: {
  block: BlockInstance;
  text: string;
  onTextChange: (next: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleFormat = () => {
    try {
      onTextChange(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      // Leave the raw (invalid) text as-is — Apply will surface the error.
    }
  };

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span aria-hidden="true" className="text-muted-foreground">
            {open ? "▾" : "▸"}
          </span>
          {blockSectionTitle(block)}
          {error && <span className="text-xs font-normal text-destructive">— invalid JSON</span>}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{block.type}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={handleFormat}>
              Format
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            spellCheck={false}
            rows={10}
            className="resize-y font-mono text-xs"
          />
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

function buildState(value: EditableSchema) {
  return {
    blockTexts: value.blocks.map((b) => JSON.stringify(b, null, 2)),
    pageText: JSON.stringify(
      {
        pageStyle: value.pageStyle,
        themeOverrides: value.themeOverrides,
        fontFamily: value.fontFamily,
        customPage: value.customPage,
      },
      null,
      2
    ),
  };
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
  const [{ blockTexts, pageText }, setState] = useState(() => buildState(value));
  const [error, setError] = useState("");
  const [blockErrors, setBlockErrors] = useState<Record<number, string>>({});
  const [pageOpen, setPageOpen] = useState(false);

  const setBlockText = (index: number, next: string) => {
    setState((s) => ({ ...s, blockTexts: s.blockTexts.map((t, i) => (i === index ? next : t)) }));
  };

  const handleApply = () => {
    const parsedBlocks: BlockInstance[] = [];
    const nextBlockErrors: Record<number, string> = {};

    blockTexts.forEach((text, i) => {
      try {
        const parsed = JSON.parse(text);
        if (!isValidBlock(parsed)) {
          nextBlockErrors[i] = 'Not a valid block — check its "id", "type", and "config".';
          return;
        }
        parsedBlocks.push(parsed);
      } catch {
        nextBlockErrors[i] = "Invalid JSON — check for a missing comma, quote, or bracket.";
      }
    });

    setBlockErrors(nextBlockErrors);
    if (Object.keys(nextBlockErrors).length > 0) {
      setError("Fix the invalid block(s) below before applying.");
      return;
    }

    const duplicateId = findDuplicateId(parsedBlocks);
    if (duplicateId) {
      setError(`Two blocks share the id "${duplicateId}" — every block, including nested ones, needs a unique id.`);
      return;
    }

    let parsedPage: unknown;
    try {
      parsedPage = JSON.parse(pageText);
    } catch {
      setError("Page settings JSON is invalid — check for a missing comma, quote, or bracket.");
      return;
    }
    const pageResult = validatePageFields(parsedPage);
    if (!pageResult.ok) {
      setError(pageResult.error);
      return;
    }

    setError("");
    onApply({ blocks: parsedBlocks, ...pageResult.value });
  };

  const handleRevert = () => {
    // Reverts to the last-known-good in-memory schema (the `value` prop),
    // not the last server-saved copy — bouncing into Code view and back
    // shouldn't lose visual-builder edits made earlier in this session.
    setState(buildState(value));
    setError("");
    setBlockErrors({});
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Edit page as JSON</p>
          <p className="text-xs text-muted">
            Each block is its own collapsible section — expand only the one you need. Apply validates everything before
            replacing the visual builder&rsquo;s state.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleRevert}>
            Revert
          </Button>
          <Button type="button" size="sm" onClick={handleApply}>
            Apply
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Back to visual builder
          </Button>
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        <div className="rounded-md border border-border">
          <button
            type="button"
            onClick={() => setPageOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground"
          >
            <span aria-hidden="true" className="text-muted-foreground">
              {pageOpen ? "▾" : "▸"}
            </span>
            Page settings
            <span className="text-xs font-normal text-muted-foreground">(theme overrides, font, page CSS, custom page)</span>
          </button>
          {pageOpen && (
            <div className="border-t border-border p-3">
              <Textarea
                value={pageText}
                onChange={(e) => setState((s) => ({ ...s, pageText: e.target.value }))}
                spellCheck={false}
                rows={8}
                className="resize-y font-mono text-xs"
              />
            </div>
          )}
        </div>

        {value.blocks.map((block, i) => (
          <BlockSection
            key={block.id}
            block={block}
            text={blockTexts[i] ?? ""}
            onTextChange={(next) => setBlockText(i, next)}
            error={blockErrors[i]}
          />
        ))}
      </div>
    </div>
  );
}
