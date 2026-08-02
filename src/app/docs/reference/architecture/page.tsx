import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Architecture overview",
  description: "The directory layout and dependency rule every change in this codebase follows.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Architecture overview")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Architecture overview")}&section=Reference`] },
};

export default function ArchitectureReferencePage() {
  return (
    <DocsArticle
      title="Architecture overview"
      description="The directory layout and dependency rule every change in this codebase follows."
      current="/docs/reference/architecture"
    >
      <p>
        Ahvaan is a Next.js App Router app on top of Supabase (Postgres + Auth + Storage), with
        Resend for email. The full narrative review lives in{" "}
        <FileRef>docs/02-architecture-review.md</FileRef>; this page is the quick map.
      </p>

      <h2>Directory layout</h2>
      <ul>
        <li>
          <FileRef>src/app/</FileRef> — routes. A public tier (<FileRef>/</FileRef>,{" "}
          <FileRef>/login</FileRef>, <FileRef>/signup</FileRef>, <FileRef>/privacy</FileRef>,{" "}
          <FileRef>/terms</FileRef>, <FileRef>/docs</FileRef>), the auth-gated{" "}
          <FileRef>dashboard/</FileRef> tree (host UI — every page and action assumes an
          authenticated host), and <FileRef>events/[slug]/</FileRef> (the public guest-facing event
          page and RSVP flow).
        </li>
        <li>
          <FileRef>src/components/</FileRef> — shared UI: <FileRef>ui/</FileRef> (design-system
          primitives), <FileRef>guest-dashboard/</FileRef>, <FileRef>builder/</FileRef>{" "}
          (page-builder editor chrome, dashboard-only), <FileRef>docs/</FileRef> (this site&rsquo;s
          own nav/content primitives).
        </li>
        <li>
          <FileRef>src/lib/data/</FileRef> — the <strong>only</strong> layer that touches the
          Supabase client. Every host-scoped read/write goes through a named function here (
          <FileRef>events.ts</FileRef>, <FileRef>invites.ts</FileRef>, <FileRef>rsvps.ts</FileRef>,{" "}
          <FileRef>forms.ts</FileRef>, <FileRef>form-submissions.ts</FileRef>,{" "}
          <FileRef>email-log.ts</FileRef>, <FileRef>host-profile.ts</FileRef>,{" "}
          <FileRef>storage.ts</FileRef>, <FileRef>rate-limit.ts</FileRef>,{" "}
          <FileRef>custom-components.ts</FileRef>).
        </li>
        <li>
          <FileRef>src/lib/blocks/</FileRef> — the page-builder block system: the registry, types,
          the sandbox builder, shortcodes, starter layouts, layout controls, and one file per block
          under <FileRef>blocks/*.tsx</FileRef>. See{" "}
          <a href="/docs/reference/adding-a-block" className="text-accent hover:underline">
            adding a new block type
          </a>
          .
        </li>
        <li>
          <FileRef>src/lib/forms/</FileRef> — the generic multi-form field-type system, modeled on{" "}
          <FileRef>lib/blocks</FileRef>: a registry, one config type + validator + Edit/Input pair
          per field kind.
        </li>
        <li>
          <FileRef>src/lib/schemas/</FileRef> — Zod validators; the single source of truth for both
          TS types and runtime validation of every JSONB column. See{" "}
          <a href="/docs/reference/jsonb-validation" className="text-accent hover:underline">
            JSONB validation
          </a>
          .
        </li>
        <li>
          <FileRef>src/lib/supabase/</FileRef> — <FileRef>server.ts</FileRef> (service-role client)
          and <FileRef>auth-server.ts</FileRef> (SSR auth client).
        </li>
        <li>
          <FileRef>src/lib/cache/keyed-cache.ts</FileRef> — a custom per-key cache used instead of
          Next&rsquo;s <FileRef>unstable_cache</FileRef>. See{" "}
          <a href="/docs/reference/caching" className="text-accent hover:underline">
            caching
          </a>
          .
        </li>
        <li>
          <FileRef>src/proxy.ts</FileRef> — Next middleware: generates the per-request CSP nonce and
          gates <FileRef>/dashboard/*</FileRef> and the auth pages.
        </li>
      </ul>

      <h2>The dependency rule</h2>
      <p>
        <FileRef>app/*</FileRef> may import from <FileRef>lib/data</FileRef>,{" "}
        <FileRef>lib/schemas</FileRef>, and <FileRef>components/*</FileRef>. <FileRef>lib/data</FileRef>{" "}
        may import from <FileRef>lib/schemas</FileRef> and the Supabase client. Nothing imports from{" "}
        <FileRef>app/</FileRef>. <FileRef>lib/blocks</FileRef> is pure (usable by the public guest
        page); <FileRef>components/builder/</FileRef> is the editor-only UI on top of it and is a
        dashboard-only import.
      </p>

      <h2>No mutation API routes</h2>
      <p>
        The only two files under <FileRef>src/app/api/</FileRef> (<FileRef>forms/[formId]</FileRef>,{" "}
        <FileRef>rsvp</FileRef>) still route through the same <FileRef>lib/data</FileRef>/
        <FileRef>lib/schemas</FileRef> layers as everything else. Every host-side mutation is a
        server action, not a REST endpoint — this is a deliberate decision, not an oversight.
      </p>

      <Callout>
        Two invariants are load-bearing enough to have their own pages: every host-scoped query
        filters <FileRef>host_id</FileRef> (see{" "}
        <a href="/docs/reference/host-id-invariant" className="text-accent hover:underline">
          the host_id invariant
        </a>
        ), and every JSONB column is parsed through a Zod schema, never{" "}
        <FileRef>as</FileRef>-cast (see{" "}
        <a href="/docs/reference/jsonb-validation" className="text-accent hover:underline">
          JSONB validation
        </a>
        ).
      </Callout>

      <DocsPrevNext current="/docs/reference/architecture" />
    </DocsArticle>
  );
}
