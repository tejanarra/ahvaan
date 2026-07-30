"use client";

import { useRef, useState, useTransition } from "react";
import { updateRsvp } from "@/app/dashboard/events/[eventId]/actions";
import type { RespondedGuest } from "./guest-card";
import type { FormField, FormSchema, Responses } from "@/lib/schemas/form-schema";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { IconButton } from "@/components/ui/icon-button";
import { CloseIcon } from "@/components/icons";

type GuestField = { key: number; value: string };

function toGuestFields(names: string[]): GuestField[] {
  return names.map((value, i) => ({ key: i, value }));
}

function asString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function asArray(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function PlusOnesEditField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const initial = toGuestFields(asArray(value));
  const [items, setItems] = useState<GuestField[]>(initial);
  const nextKey = useRef(initial.length);

  const commit = (next: GuestField[]) => {
    setItems(next);
    onChange(next.map((f) => f.value));
  };

  return (
    <Field
      label={
        <div className="flex items-center justify-between">
          <span>{field.label}</span>
          <button
            type="button"
            onClick={() => commit([...items, { key: nextKey.current++, value: "" }])}
            className="text-xs font-medium normal-case tracking-normal text-accent hover:underline"
          >
            + Add guest
          </button>
        </div>
      }
    >
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item.key} className="flex items-center gap-2">
            <Input
              type="text"
              value={item.value}
              onChange={(e) => commit(items.map((f) => (f.key === item.key ? { ...f, value: e.target.value } : f)))}
              placeholder={`Guest ${index + 1} name`}
            />
            <IconButton onClick={() => commit(items.filter((f) => f.key !== item.key))} aria-label="Remove guest">
              <CloseIcon className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        ))}
        {items.length === 0 && <p className="pt-1 text-sm italic text-muted">No plus-ones on this RSVP.</p>}
      </div>
    </Field>
  );
}

function EditField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}) {
  if (field.type === "plus_ones") {
    return <PlusOnesEditField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "radio" || field.type === "checkbox") {
    const current = field.type === "checkbox" ? asArray(value) : asString(value);
    return (
      <Field label={field.label}>
        <ToggleGroup
          size="md"
          options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
          value={current}
          onChange={(option) => {
            if (field.type === "checkbox") {
              const list = current as string[];
              onChange(list.includes(option) ? list.filter((v) => v !== option) : [...list, option]);
            } else {
              onChange(option);
            }
          }}
        />
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label}>
        <Select value={asString(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Select...
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  if (field.type === "textarea") {
    return (
      <Field label={field.label}>
        <Textarea value={asString(value)} onChange={(e) => onChange(e.target.value)} rows={3} />
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <Input type="text" value={asString(value)} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function EditRsvpDialog({
  eventId,
  schema,
  guest,
  onClose,
}: {
  eventId: string;
  schema: FormSchema;
  guest: RespondedGuest;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Responses>(guest.responses);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        await updateRsvp(eventId, guest.id, values);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  };

  return (
    <Modal open onClose={onClose} title="Edit RSVP" className="max-h-[85vh] overflow-y-auto">
      <div className="space-y-4">
        {schema.fields.map((field) => (
          <EditField
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(next) => setValues((v) => ({ ...v, [field.id]: next }))}
          />
        ))}

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} loading={isPending} className="flex-1">
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
