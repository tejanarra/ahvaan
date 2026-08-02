"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Root error boundary (docs/05 "System pages") — catches anything an
// error.tsx-less route lets bubble up. Apologetic tone, a real "Try again"
// (Next's reset() re-renders the segment without a full navigation) plus
// an escape hatch home, since reset() can't help if the error is in data
// this render depends on rather than a transient glitch.
export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Link href="/" aria-label="ahvaan home">
        <BrandLockup />
      </Link>
      <div className="space-y-2">
        <h1 className="text-2xl text-foreground font-display">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted">
          Sorry about that — it&rsquo;s not you, it&rsquo;s us. Give it another try, or head back home.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="text-sm font-medium text-accent hover:underline">
          Back home
        </Link>
      </div>
    </div>
  );
}
