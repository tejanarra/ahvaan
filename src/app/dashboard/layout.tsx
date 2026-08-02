import Link from "next/link";
import { requireHost } from "@/lib/supabase/auth-server";
import { LockBodyScroll } from "@/components/lock-body-scroll";
import { BrandLockup } from "@/components/brand";
import { AccountMenu } from "@/components/account-menu";
import { ToastProvider } from "@/components/ui/toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = await requireHost();

  return (
    <ToastProvider>
      <div className="flex h-dvh flex-col bg-background">
        <LockBodyScroll />
        <header className="shrink-0 border-b border-border">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2 sm:px-6 sm:py-1 lg:px-10">
            <Link href="/dashboard">
              <BrandLockup
                markSrc="/mark-black.svg"
                markClassName="h-8 w-8 sm:h-10 sm:w-10"
                textClassName="font-display text-xl leading-none sm:text-2xl"
              />
            </Link>
            <AccountMenu email={host.email ?? ""} />
          </div>
        </header>
        {/* min-h-0 so this flex child shrinks to fit the column above instead
            of growing past it — its own overflow-y-auto then makes it the
            single scroll container for every dashboard page, so nested pages
            (like the page builder) can rely on a well-defined 100%-height box
            via h-full instead of guessing a vh value. */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
