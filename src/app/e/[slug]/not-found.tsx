import Link from "next/link";

// Stage voice (docs/05 "System pages"): neutral paper, no Studio chrome —
// covers a bad slug, a draft viewed without the owner's preview link, and
// any other notFound() thrown while rendering the public guest page.
export default function GuestPageNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-lg font-display text-foreground">This invitation isn&rsquo;t available</p>
      <p className="max-w-sm text-sm text-muted">
        The link may be incorrect, or the host hasn&rsquo;t published this page yet.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-accent hover:underline">
        Ahvan home
      </Link>
    </div>
  );
}
