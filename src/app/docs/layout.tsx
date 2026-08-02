import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { PublicFooter } from "@/components/public-footer";
import { DocsNav } from "@/components/docs/docs-nav";

export const metadata: Metadata = {
  title: { default: "Docs", template: "%s · ahvaan docs" },
  description: "Guides for hosts and reference material for developers working on ahvaan.",
};

// Public, no auth — its own top-level surface (Studio / Stage / Docs, see
// docs/10-docs-site.md). Warm paper background matching Studio (reference
// material, not a themed guest page — see doc 10's design note), a
// persistent multi-level side nav (DocsNav, deliberately not SideNav — see
// that component's own comment), and a max-width content column capped at
// 65ch prose per doc 04.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="ahvaan home" className="inline-flex items-center gap-3">
            <BrandLockup />
            <span className="text-caption text-muted">Docs</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            Go to dashboard →
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <DocsNav />
          </aside>
          <main>{children}</main>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
