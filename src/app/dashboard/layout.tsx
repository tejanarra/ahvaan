import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { logout } from "@/lib/auth-actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = await requireHost();

  return (
    <div className="min-h-screen bg-lavender">
      <header className="border-b border-gold/20 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="font-display text-lg uppercase tracking-[0.1em] text-gold-dark"
          >
            Events
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-foreground/60 sm:inline">{host.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-gold/40 px-3 py-1.5 font-display text-xs uppercase tracking-wider text-gold-dark transition hover:border-gold-dark"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
