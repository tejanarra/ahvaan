import type { Metadata } from "next";
import { DocsArticle, Callout, CodeBlock, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Caching",
  description: "Why this app has its own keyed cache instead of Next's unstable_cache.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Caching")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Caching")}&section=Reference`] },
};

export default function CachingReferencePage() {
  return (
    <DocsArticle
      title="Caching"
      description="Why this app has its own keyed cache instead of Next's unstable_cache."
      current="/docs/reference/caching"
    >
      <h2>Why not unstable_cache</h2>
      <p>
        <FileRef>createKeyedCache</FileRef> (<FileRef>src/lib/cache/keyed-cache.ts:22</FileRef>)
        exists because <FileRef>unstable_cache</FileRef>&rsquo;s <FileRef>tags</FileRef> option is
        fixed at definition time and can&rsquo;t be templated per call argument. The module
        comment is explicit about this being the actual bug it fixes:
      </p>
      <CodeBlock>{`// Exists because \`unstable_cache\`'s \`tags\` option is fixed at
// definition time and can't be templated per call argument — passing a
// per-key tag string there silently does nothing, so a \`revalidateTag\` at
// write time never matches anything cached under it (the bug this module
// fixes). Here, invalidation deletes the exact key directly, so it always
// works.`}</CodeBlock>
      <p>
        A TTL (<FileRef>DEFAULT_TTL_MS = 30_000</FileRef>,{" "}
        <FileRef>src/lib/cache/keyed-cache.ts:18</FileRef>) is kept as a safety net in case a write
        path is ever added without remembering to call <FileRef>invalidate</FileRef>, but the
        actual invalidation path (below) never relies on the TTL to be timely.
      </p>

      <h2>What it caches</h2>
      <p>Two read-heavy, per-key lookups use it today:</p>
      <ul>
        <li>
          <FileRef>getEventBySlugPublic</FileRef> (<FileRef>src/lib/data/events.ts:151</FileRef>),
          backed by <FileRef>eventBySlugPublicCache</FileRef> (
          <FileRef>src/lib/data/events.ts:141</FileRef>), keyed by slug — the public guest event
          page&rsquo;s own read, hit on every guest visit but only changing when a host saves.
        </li>
        <li>
          <FileRef>getHostProfilePublic</FileRef> (
          <FileRef>src/lib/data/host-profile.ts:58</FileRef>), backed by{" "}
          <FileRef>hostProfilePublicCache</FileRef> (
          <FileRef>src/lib/data/host-profile.ts:40</FileRef>), keyed by host id — the public host
          profile card shown on guest event pages.
        </li>
      </ul>

      <h2>Invalidation on save</h2>
      <p>
        Each cache is invalidated by name at its own write path, precisely for the one key that
        changed — never a blanket clear. <FileRef>revalidateEventCache</FileRef> (
        <FileRef>src/lib/data/events.ts:180</FileRef>) calls{" "}
        <FileRef>eventBySlugPublicCache.invalidate(slug)</FileRef> alongside the Next{" "}
        <FileRef>revalidatePath</FileRef> calls for the guest and dashboard routes. The host
        profile cache is invalidated the same way at both of its write paths:{" "}
        <FileRef>updateHostProfileFields</FileRef> (
        <FileRef>src/lib/data/host-profile.ts:82</FileRef>) and{" "}
        <FileRef>setHostAvatarUrl</FileRef> (<FileRef>src/lib/data/host-profile.ts:93</FileRef>)
        each call <FileRef>hostProfilePublicCache.invalidate(hostId)</FileRef> right after their
        own Supabase write succeeds.
      </p>

      <Callout>
        Same per-instance caveat as <FileRef>src/lib/rate-limit.ts</FileRef>: the cache is an
        in-memory <FileRef>Map</FileRef>, one per server instance, so a write handled by one
        instance won&rsquo;t invalidate another instance&rsquo;s copy until that entry&rsquo;s TTL
        expires there — at most a few seconds of staleness on other instances at this app&rsquo;s
        current scale.
      </Callout>

      <DocsPrevNext current="/docs/reference/caching" />
    </DocsArticle>
  );
}
