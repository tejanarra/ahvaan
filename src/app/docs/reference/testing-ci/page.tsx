import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Testing & CI",
  description: "What's actually tested today, and what runs on every push.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Testing & CI")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Testing & CI")}&section=Reference`] },
};

export default function TestingCiReferencePage() {
  return (
    <DocsArticle
      title="Testing & CI"
      description="What's actually tested today, and what runs on every push."
      current="/docs/reference/testing-ci"
    >
      <h2>Framework</h2>
      <p>
        Tests run on Vitest 4 (<FileRef>vitest: ^4.1.10</FileRef> in{" "}
        <FileRef>package.json</FileRef>), via <FileRef>npm test</FileRef> which runs{" "}
        <FileRef>vitest run</FileRef> (<FileRef>package.json:10</FileRef>). Playwright is also a
        dev dependency (<FileRef>package.json:31</FileRef>) but there is no Playwright config or
        spec file in the repo today — it&rsquo;s installed, not yet wired into a suite or the CI
        pipeline.
      </p>

      <h2>What&rsquo;s actually covered</h2>
      <p>
        Coverage is narrow and deliberately targeted at the highest-risk logic — not a general
        unit-test sweep of the codebase. The complete list of test files under{" "}
        <FileRef>src/</FileRef> today:
      </p>
      <ul>
        <li>
          <FileRef>src/lib/rate-limit.test.ts</FileRef> — the in-memory throttle/eviction
          behavior.
        </li>
        <li>
          <FileRef>src/lib/blocks/sandbox.test.ts</FileRef> — <FileRef>buildSandboxSrcDoc</FileRef>
          &rsquo;s closing-tag escaping and nonce stamping.
        </li>
        <li>
          <FileRef>src/lib/blocks/safe-url.test.ts</FileRef> — URL sanitization used by block
          configs that accept a host-supplied URL.
        </li>
        <li>
          <FileRef>src/lib/cache/keyed-cache.test.ts</FileRef> — the keyed cache&rsquo;s TTL and
          invalidation behavior.
        </li>
        <li>
          <FileRef>src/lib/schemas/page-schema.test.ts</FileRef> —{" "}
          <FileRef>parsePageSchema</FileRef>&rsquo;s structural validation and per-block
          drop-on-invalid behavior.
        </li>
      </ul>
      <p>
        Notably untested: the data layer (<FileRef>src/lib/data/</FileRef>), server actions,
        RSVP/form submission validation, and every UI component. Treat this suite as a guard
        against regressing a handful of specific, previously-fixed correctness bugs, not as a
        safety net for the app as a whole.
      </p>

      <h2>CI pipeline</h2>
      <p>
        <FileRef>.github/workflows/ci.yml</FileRef> runs on every push to{" "}
        <FileRef>main</FileRef> and every pull request, in this order:
      </p>
      <ol>
        <li>Checkout (<FileRef>actions/checkout@v4</FileRef>).</li>
        <li>Set up Node 24 with npm caching (<FileRef>actions/setup-node@v4</FileRef>).</li>
        <li><FileRef>npm ci</FileRef>.</li>
        <li><FileRef>npm run lint</FileRef>.</li>
        <li><FileRef>npm test</FileRef>.</li>
        <li>
          <FileRef>npm run build</FileRef>, with placeholder env vars (Supabase URL/keys, Resend
          key, site URL, guest session secret) set only so modules that read them eagerly
          don&rsquo;t fail the build — nothing in the build step actually calls Supabase, since
          every data-fetching route is force-dynamic.
        </li>
      </ol>

      <Callout>
        There is no separate typecheck step in CI — <FileRef>next build</FileRef> type-checks as
        part of the build, so a type error still fails the pipeline, just inside step 6 rather
        than its own step.
      </Callout>

      <DocsPrevNext current="/docs/reference/testing-ci" />
    </DocsArticle>
  );
}
