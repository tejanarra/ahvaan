"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameFormAction, deleteFormAction } from "../actions";
import { EditIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmIconButton } from "@/components/confirm-icon-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionNav } from "@/components/ui/section-nav";

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

  const base = `/dashboard/events/${eventId}/forms/${formId}`;

  return (
    <div>
      <PageHeader
        // A plain breadcrumb crumb, deliberately with no arrow icon: the
        // event workspace has exactly one "← " back-arrow (Events, in
        // event-layout-shell.tsx) — a second arrow here read as a
        // duplicate back button and was genuinely confusing (which one
        // goes where?). This link still returns to the forms list; it
        // just reads as "you are inside Forms," not "go back."
        crumb={{ href: `/dashboard/events/${eventId}/forms`, label: "Forms" }}
        title={
          editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="h-10 w-full sm:h-8 sm:w-64"
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
              {name}
              <EditIcon className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )
        }
        actions={
          <ConfirmIconButton
            label="Delete form"
            confirmText={`Delete "${name}"? This removes every submission too.`}
            onConfirm={async () => {
              await deleteFormAction(eventId, formId);
              router.push(`/dashboard/events/${eventId}/forms`);
            }}
          />
        }
        nav={
          <SectionNav
            ariaLabel="Form sections"
            items={[
              { href: `${base}/fields`, label: "Fields" },
              { href: `${base}/data`, label: "Data" },
              { href: `${base}/actions`, label: "Actions" },
            ]}
          />
        }
      />
      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
