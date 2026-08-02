"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Studio voice (docs/05 "System pages"), scoped to the event workspace —
// previously a thrown error anywhere under this route (guests/design/
// forms/settings) fell all the way to the root error.tsx, replacing the
// whole page including the dashboard chrome with the generic Studio-wide
// screen (docs-audit M2). This keeps the failure contained to the
// workspace content area and offers a way back to the event list without
// a full reload.
export default function EventWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium text-foreground">Something went wrong</p>
      <p className="max-w-sm text-sm text-muted">
        Sorry about that — it&rsquo;s not you, it&rsquo;s us. Give it another try, or head back to your events.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to events
        </Link>
      </div>
    </div>
  );
}
