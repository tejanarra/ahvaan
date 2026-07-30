"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEvent } from "./actions";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TrashIcon } from "@/components/icons";

export function EventCardMenu({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEvent(eventId);
        setConfirmOpen(false);
        show(`Deleted "${eventTitle}".`);
        router.refresh();
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to delete.", "error");
      }
    });
  };

  return (
    <>
      <DropdownMenu
        trigger={
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-hover hover:text-foreground">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <circle cx="4" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="16" cy="10" r="1.5" />
            </svg>
          </span>
        }
        items={[
          {
            label: "Delete event",
            destructive: true,
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete event">
        <p className="text-sm text-muted">
          Delete &ldquo;{eventTitle}&rdquo;? This removes all its invites and RSVPs. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} loading={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
