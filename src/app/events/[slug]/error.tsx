"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand";

// Stage voice (docs/05 "System pages"), scoped to the guest page —
// previously a thrown error here (e.g. a transient Supabase read failure)
// fell all the way to the root error.tsx, which uses the Studio's
// apologetic-but-branded copy and chrome. A guest opening an invite link
// should never see the host-facing app's own error screen (docs-audit
// M2) — this mirrors the tone of this route's own not-found.tsx instead.
export default function GuestPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <Link href="/" className="mb-2">
        <BrandLockup markClassName="h-8 w-8" textClassName="font-display text-2xl leading-none" />
      </Link>
      <p className="text-lg font-display text-foreground">This page couldn&rsquo;t load</p>
      <p className="max-w-sm text-sm text-muted">
        Something went wrong on our end — please try again in a moment.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-medium text-accent hover:underline"
        >
          Try again
        </button>
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          ahvaan home
        </Link>
      </div>
    </div>
  );
}
