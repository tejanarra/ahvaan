import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Design tokens",
  description: "Where the design system's tokens actually live in code.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Design tokens")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Design tokens")}&section=Reference`] },
};

export default function DesignTokensReferencePage() {
  return (
    <DocsArticle
      title="Design tokens"
      description="Where the design system's tokens actually live in code."
      current="/docs/reference/design-tokens"
    >
      <p>
        The <FileRef>@theme inline</FileRef> block in{" "}
        <FileRef>src/app/globals.css:35</FileRef> is where Tailwind&rsquo;s generated utilities are
        wired to this app&rsquo;s own CSS custom properties — it defines{" "}
        <FileRef>--font-sans</FileRef>, <FileRef>--font-mono</FileRef>, and{" "}
        <FileRef>--font-display</FileRef> (Hanken Grotesk, Geist Mono, and Fraunces respectively),
        alongside the paper/ink color tokens declared in the preceding <FileRef>:root</FileRef>{" "}
        block. Guest-facing pages layer a second set of runtime custom properties on top of these
        — theme colors like <FileRef>--t-fg</FileRef> stamped inline per-event by the theme
        resolver (e.g. <FileRef>src/app/dashboard/events/[eventId]/design/page-builder.tsx:1035</FileRef>
        ) rather than declared statically in this file, since they vary per event&rsquo;s chosen
        theme.
      </p>

      <Callout title="Source of truth">
        This page only says where tokens live in code. What the tokens should be — the actual
        palette, type scale, and spacing/shape spec — is defined in{" "}
        <FileRef>docs/04-design-system.md</FileRef>; extend that doc before adding any new visual
        token, don&rsquo;t invent one here or in a component file.
      </Callout>

      <DocsPrevNext current="/docs/reference/design-tokens" />
    </DocsArticle>
  );
}
