"use client";

import { useState, useTransition } from "react";
import { updateCustomFormSchemaAction } from "../../actions";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FIELD_TYPE_REGISTRY, FIELD_KINDS, makeCustomFormField } from "@/lib/forms/registry";
import type { CustomFormField, CustomFormSchema, FieldKind } from "@/lib/forms/types";
import { cn } from "@/lib/cn";

function makeFieldId() {
  return crypto.randomUUID().slice(0, 8);
}

export function FieldsBuilder({ eventId, formId, schema }: { eventId: string; formId: string; schema: CustomFormSchema }) {
  const [fields, setFields] = useState<CustomFormField[]>(schema.fields);
  const [editingId, setEditingId] = useState<string | null>(fields[0]?.id ?? null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const editingField = fields.find((f) => f.id === editingId) ?? null;

  const move = (index: number, direction: -1 | 1) => {
    const next = [...fields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next);
  };

  const addField = (kind: FieldKind) => {
    const field = { ...makeCustomFormField(kind), id: makeFieldId() } as CustomFormField;
    setFields((f) => [...f, field]);
    setEditingId(field.id);
  };

  const removeField = (id: string) => {
    setFields((f) => f.filter((field) => field.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateField = (id: string, next: CustomFormField) => {
    setFields((f) => f.map((field) => (field.id === id ? next : field)));
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateCustomFormSchemaAction(eventId, formId, { fields });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Fields</h2>
          <p className="mt-0.5 text-xs text-muted">
            {fields.length === 0
              ? "No fields yet — add a question below."
              : `${fields.length} field${fields.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-success">Saved.</span>}
          <Button size="sm" onClick={handleSave} loading={isPending}>
            {isPending ? "Saving..." : "Save form"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              onClick={() => setEditingId(field.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                editingId === field.id ? "border-accent bg-accent/5" : "border-border bg-background hover:border-border-strong"
              )}
            >
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="text-muted hover:text-foreground disabled:opacity-30">
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === fields.length - 1}
                  aria-label="Move down"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {field.label}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </p>
                <p className="text-xs text-muted">{FIELD_TYPE_REGISTRY[field.kind].label}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ConfirmIconButton label="Delete field" confirmText={`Delete "${field.label}"?`} onConfirm={async () => removeField(field.id)} />
              </div>
            </div>
          ))}

          <DropdownMenu
            align="start"
            trigger={
              <span className="block w-full rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground">
                + Add question
              </span>
            }
            items={FIELD_KINDS.map((kind) => ({
              label: FIELD_TYPE_REGISTRY[kind].label,
              onSelect: () => addField(kind),
            }))}
          />
        </div>

        <div className="lg:sticky lg:top-6">
          <Card>
            <CardBody>
              {editingField ? (
                <>
                  <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">Editing &ldquo;{editingField.label}&rdquo;</p>
                  {(() => {
                    const Edit = FIELD_TYPE_REGISTRY[editingField.kind].Edit;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return <Edit config={editingField as any} onChange={(next: any) => updateField(editingField.id, { ...next, kind: editingField.kind })} />;
                  })()}
                </>
              ) : (
                <p className="text-sm text-muted">Select a question on the left to edit it, or add a new one.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
