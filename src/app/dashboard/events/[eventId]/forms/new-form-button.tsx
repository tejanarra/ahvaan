"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFormAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function NewFormButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError("");
    startTransition(async () => {
      try {
        const form = await createFormAction(eventId, name);
        setOpen(false);
        setName("");
        router.push(`/dashboard/events/${eventId}/forms/${form.id}/fields`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create form.");
      }
    });
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        + New form
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Name your form">
        <div className="space-y-4">
          <Field label="Form name" hint="Must be unique for this event — e.g. &ldquo;Song requests&rdquo; or &ldquo;T-shirt sizes&rdquo;.">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </Field>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} loading={isPending}>
              {isPending ? "Creating..." : "Create form"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
