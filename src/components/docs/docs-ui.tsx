import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { DOCS_FLAT_ITEMS, findNavContext } from "./docs-nav-data";

// Shared content primitives for every /docs page, built only from doc 04's
// existing tokens (see docs/10-docs-site.md's design note) — no new colors,
// no new type scale.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// BreadcrumbList + Article/TechArticle JSON-LD, derived entirely from data
// every page already has (title/description/current href) — centralized
// here so no individual page has to hand-author structured data. Reference
// pages (assume repo familiarity, cite file:line) get `TechArticle`;
// Guides pages get plain `Article`.
function DocsJsonLd({ title, description, current }: { title: string; description?: string; current: string }) {
  const context = findNavContext(current);
  const isReference = current.startsWith("/docs/reference");
  const url = `${SITE_URL}${current}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ahvaan", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE_URL}/docs` },
      ...(context ? [{ "@type": "ListItem", position: 3, name: context.group.label }] : []),
      { "@type": "ListItem", position: context ? 4 : 3, name: title, item: url },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": isReference ? "TechArticle" : "Article",
    headline: title,
    description,
    url,
    isPartOf: { "@type": "WebSite", name: "ahvaan docs", url: `${SITE_URL}/docs` },
    ...(context ? { about: context.section.title } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
    </>
  );
}

export function DocsArticle({
  title,
  description,
  current,
  children,
}: {
  title: string;
  description?: string;
  // This page's own nav href (the same value already passed to
  // `DocsPrevNext current="..."` at the bottom of every page) — enables the
  // breadcrumb/article JSON-LD above. Optional only so this component still
  // works before a page has been wired up; every real page should pass it.
  current?: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-[65ch]">
      {current && <DocsJsonLd title={title} description={description} current={current} />}
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      {description && <p className="mt-2 text-base text-muted">{description}</p>}
      <div className="prose-docs mt-8 space-y-6 text-[15px] leading-relaxed text-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_strong]:font-semibold [&_code]:rounded-[var(--radius-sm)] [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]">
        {children}
      </div>
    </article>
  );
}

// One "non-obvious behavior" callout per doc 10's Content-authoring shape —
// a Card with an accent left rail, not a new component, since this is the
// only repeated shape that needs it.
export function Callout({ title = "Good to know", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border border-l-[3px] border-l-accent bg-surface px-4 py-3">
      <p className="text-caption font-semibold uppercase tracking-wider text-accent">{title}</p>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground [&_p]:mt-1.5 first:[&_p]:mt-0">{children}</div>
    </div>
  );
}

export function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="not-prose overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-sunken">
      <Image
        src={`/docs/screenshots/${src}.png`}
        alt={alt}
        width={1440}
        height={900}
        sizes="(min-width: 1024px) 640px, 100vw"
        className="h-auto w-full"
      />
      {caption && <figcaption className="border-t border-border px-3 py-2 text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-surface-sunken p-3 font-mono text-[13px] leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

// file:line citation chip — Reference pages cite real source locations;
// this keeps that visually distinct from prose without inventing a new
// color (reuses the same mono/sunken-well treatment as CodeBlock).
export function FileRef({ children }: { children: string }) {
  return <code className="rounded-[var(--radius-sm)] bg-surface-sunken px-1 py-0.5 font-mono text-[13px]">{children}</code>;
}

export function DocsPrevNext({ current }: { current: string }) {
  const index = DOCS_FLAT_ITEMS.findIndex((item) => item.href === current);
  const prev = index > 0 ? DOCS_FLAT_ITEMS[index - 1] : null;
  const next = index >= 0 && index < DOCS_FLAT_ITEMS.length - 1 ? DOCS_FLAT_ITEMS[index + 1] : null;

  if (!prev && !next) return null;

  return (
    <nav aria-label="Page navigation" className="mt-12 flex items-center justify-between border-t border-border pt-6 text-sm">
      {prev ? (
        <Link href={prev.href} className="text-muted hover:text-foreground">
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className={cn("text-right text-muted hover:text-foreground")}>
          {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
