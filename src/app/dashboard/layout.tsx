import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { logout } from "@/lib/auth-actions";
import { LockBodyScroll } from "@/components/lock-body-scroll";
import { BrandLockup } from "@/components/brand";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = await requireHost();

  return (
    <div className="flex h-screen flex-col bg-background">
      <LockBodyScroll />
      <header className="shrink-0 border-b border-border">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/dashboard">
            <BrandLockup markClassName="h-4 w-4" textClassName="text-base" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{host.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {/* min-h-0 so this flex child shrinks to fit the column above instead
          of growing past it — its own overflow-y-auto then makes it the
          single scroll container for every dashboard page, so nested pages
          (like the page builder) can rely on a well-defined 100%-height box
          via h-full instead of guessing a vh value. */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
