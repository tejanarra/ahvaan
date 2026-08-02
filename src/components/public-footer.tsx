import Link from "next/link";
import { BrandLockup } from "@/components/brand";

// Shared by the marketing home page and the legal pages (terms/privacy) —
// a visitor landing directly on /terms or /privacy previously had no way
// back to sign-in or the other legal page except the wordmark link. Not
// used on auth pages (their own split-screen layout has no footer per
// docs/05) or system pages (not-found/error are single-CTA screens where a
// 4-link footer would dilute the one action they offer).
export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      {/* `grid-cols-[1fr_auto_1fr]` (not `flex justify-between`) so the
          copyright line sits at the row's true center regardless of how
          wide the logo vs. nav columns are — `justify-between` only
          centers a middle flex child when its two neighbors happen to be
          equal width, which they aren't here (logo lockup vs. 4 nav
          links), so the copyright text visibly drifted off-center. */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
        <div className="flex justify-center sm:justify-start">
          <BrandLockup markClassName="h-4 w-4" textClassName="font-display text-sm leading-none" />
        </div>
        <p className="text-center text-xs text-muted">© {new Date().getFullYear()} ahvaan</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm sm:justify-self-end">
          <Link href="/privacy" className="inline-flex h-10 items-center text-muted hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex h-10 items-center text-muted hover:text-foreground">
            Terms
          </Link>
          <Link href="/login" className="inline-flex h-10 items-center text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup" className="inline-flex h-10 items-center text-muted hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
