import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

// Studio voice (docs/05 "System pages"): muted, "Back to events" — covers
// any notFound() thrown under /dashboard (e.g. an event id that doesn't
// belong to the signed-in host).
export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium text-foreground">Not found</p>
      <p className="max-w-sm text-sm text-muted">
        This event doesn&rsquo;t exist, or it&rsquo;s not one of yours.
      </p>
      <Link href="/dashboard" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to events
      </Link>
    </div>
  );
}
