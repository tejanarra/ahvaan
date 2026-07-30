"use client";

import { useState, useTransition } from "react";
import { updateFormSchema } from "../actions";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import type { FieldType, FormField, FormSchema } from "@/lib/schemas/form-schema";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  select: "Dropdown",
  radio: "Multiple choice",
  checkbox: "Checkboxes",
  plus_ones: "Plus-ones list",
};

const ROLE_LABELS: Record<Exclude<FormField["role"], null>, string> = {
  name: "guest name",
  attending: "attendance",
  plus_ones: "plus-ones list",
};

function makeFieldId() {
  return crypto.randomUUID().slice(0, 8);
}

function needsOptions(type: FieldType) {
  return type === "select" || type === "radio" || type === "checkbox";
}

function FieldEditor({ field, onChange }: { field: FormField; onChange: (next: FormField) => void }) {
  const locked = field.role !== null;

  return (
    <div className="space-y-4">
      <Field label="Label">
        <Input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })} />
      </Field>

      {!locked && (
        <Field label="Field type">
          <Select
            value={field.type}
            onChange={(e) => {
              const type = e.target.value as FieldType;
              onChange({
                ...field,
                type,
                options: needsOptions(type) ? field.options ?? ["Option 1", "Option 2"] : undefined,
              });
            }}
          >
            {(Object.keys(FIELD_TYPE_LABELS) as FieldType[])
              .filter((t) => t !== "plus_ones")
              .map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
          </Select>
        </Field>
      )}

      {needsOptions(field.type) && !locked && (
        <Field label="Options" hint="One per line">
          <Textarea
            value={(field.options ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean),
              })
            }
            rows={3}
          />
        </Field>
      )}

      {(field.type === "text" || field.type === "textarea") && (
        <Field label="Placeholder">
          <Input value={field.placeholder ?? ""} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
        </Field>
      )}

      {field.type !== "plus_ones" && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={field.required} onChange={(e) => onChange({ ...field, required: e.target.checked })} />
          Required
        </label>
      )}

      {locked && (
        <p className="text-xs text-muted">
          This field powers this event&rsquo;s {ROLE_LABELS[field.role!]} tracking, so its type is locked — you can still
          relabel it, change whether it&rsquo;s required, or delete it entirely.
        </p>
      )}
    </div>
  );
}

export function FormBuilder({ eventId, schema }: { eventId: string; schema: FormSchema }) {
  const [fields, setFields] = useState<FormField[]>(schema.fields);
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

  const addField = () => {
    const id = makeFieldId();
    setFields((f) => [...f, { id, type: "text", label: "New question", role: null, required: false }]);
    setEditingId(id);
  };

  const removeField = (id: string) => {
    setFields((f) => f.filter((field) => field.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateField = (id: string, next: FormField) => {
    setFields((f) => f.map((field) => (field.id === id ? next : field)));
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateFormSchema(eventId, { fields });
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
          <h2 className="text-sm font-semibold text-foreground">RSVP form fields</h2>
          <p className="mt-0.5 text-xs text-muted">
            {fields.length} field{fields.length === 1 ? "" : "s"} — add, edit, reorder, or remove any of them, including the
            built-in ones.
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
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="text-muted hover:text-foreground disabled:opacity-30"
                >
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
                <p className="text-xs text-muted">{FIELD_TYPE_LABELS[field.type]}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <ConfirmIconButton
                  label="Delete field"
                  confirmText={
                    field.role
                      ? `Delete "${field.label}"? This event will stop tracking ${ROLE_LABELS[field.role]}.`
                      : `Delete "${field.label}"?`
                  }
                  onConfirm={async () => removeField(field.id)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addField}
            className="w-full rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
          >
            + Add question
          </button>
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardBody>
            {editingField ? (
              <>
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Editing &ldquo;{editingField.label}&rdquo;
                </p>
                <FieldEditor field={editingField} onChange={(next) => updateField(editingField.id, next)} />
              </>
            ) : (
              <p className="text-sm text-muted">Select a question on the left to edit it.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
