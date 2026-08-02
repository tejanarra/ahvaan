import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";

// Top-level fallback for any route outside /dashboard and /events/[slug] (which
// have their own voiced not-found.tsx — docs/05 "System pages"). Marketing
// voice: plain, points home.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Link href="/" aria-label="ahvaan home">
        <BrandLockup />
      </Link>
      <div className="space-y-2">
        <h1 className="text-2xl text-foreground font-display">Page not found</h1>
        <p className="max-w-sm text-sm text-muted">
          That page doesn&rsquo;t exist, or it moved.
        </p>
      </div>
      <Link href="/">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
