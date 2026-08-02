import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DOCS_NAV } from "@/components/docs/docs-nav-data";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides for hosts building an event page, and reference material for developers working on the Ahvaan codebase.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Documentation")}&section=Docs`] },
  twitter: {
    card: "summary_large_image",
    images: [`/docs/og?title=${encodeURIComponent("Documentation")}&section=Docs`],
  },
};

export default function DocsIndexPage() {
  return (
    <div className="max-w-[65ch]">
      <h1 className="font-display text-3xl text-foreground">ahvaan documentation</h1>
      <p className="mt-2 text-base text-muted">
        Guides for hosts building an event page, and reference material for developers working on
        the codebase.
      </p>

      <div className="mt-10 space-y-10">
        {DOCS_NAV.map((group) => (
          <div key={group.label}>
            <h2 className="font-display text-xl text-foreground">{group.label}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.sections.flatMap((section) =>
                section.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Card className="h-full px-4 py-3 transition-colors hover:bg-surface-hover">
                      <p className="text-caption text-muted">{section.title}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.label}</p>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
