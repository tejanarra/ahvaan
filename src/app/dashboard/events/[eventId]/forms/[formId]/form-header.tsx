"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { renameFormAction, deleteFormAction } from "../actions";
import { ArrowLeftIcon, EditIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmIconButton } from "@/components/confirm-icon-button";

export function FormHeader({ eventId, formId, name }: { eventId: string; formId: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRename = () => {
    setError("");
    startTransition(async () => {
      try {
        await renameFormAction(eventId, formId, draft);
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename.");
      }
    });
  };

  return (
    <div>
      <Link href={`/dashboard/events/${eventId}/forms`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" />
        Forms
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              className="h-8 w-64"
            />
            <Button size="sm" onClick={handleRename} loading={isPending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft(name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="group flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{name}</h1>
            <EditIcon className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <ConfirmIconButton
          label="Delete form"
          confirmText={`Delete "${name}"? This removes every submission too.`}
          onConfirm={async () => {
            await deleteFormAction(eventId, formId);
            router.push(`/dashboard/events/${eventId}/forms`);
          }}
        />
      </div>
      {error && <p className="mt-1 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
