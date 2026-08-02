import type { Metadata } from "next";
import { DocsArticle, CodeBlock, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Rate limiting & size budgets",
  description: "How public write paths are throttled, and how a submission's payload is kept bounded.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Rate limiting & size budgets")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Rate limiting & size budgets")}&section=Reference`] },
};

export default function RateLimitingReferencePage() {
  return (
    <DocsArticle
      title="Rate limiting & size budgets"
      description="How public write paths are throttled, and how a submission's payload is kept bounded."
      current="/docs/reference/rate-limiting"
    >
      <h2>Two-tier rate limiting</h2>
      <p>
        Public write paths (RSVPs, custom form submissions) combine two independent limiters,
        composed by <FileRef>isRateLimited</FileRef> (<FileRef>src/lib/rate-limit.ts:59</FileRef>):
      </p>
      <ul>
        <li>
          An in-memory, per-server-instance floor: <FileRef>isThrottled</FileRef> (
          <FileRef>src/lib/rate-limit.ts:38</FileRef>) keys a plain <FileRef>Map</FileRef> (
          <FileRef>src/lib/rate-limit.ts:31</FileRef>) by a caller-supplied key (usually the client
          IP from <FileRef>getClientIp</FileRef>, <FileRef>src/lib/rate-limit.ts:12</FileRef>) and
          rejects a second hit within <FileRef>minIntervalMs</FileRef>. The map is capped at{" "}
          <FileRef>MAX_ENTRIES = 10_000</FileRef> (<FileRef>src/lib/rate-limit.ts:36</FileRef>),
          pruning the oldest key once full. It only holds per instance — on a multi-instance
          deployment each instance has its own map, so the effective limit is &ldquo;per key, per
          instance,&rdquo; not global.
        </li>
        <li>
          A cross-instance, DB-backed sliding window: <FileRef>checkRateLimit</FileRef> (
          <FileRef>src/lib/data/rate-limit.ts:23</FileRef>) counts and records hits in{" "}
          <FileRef>public.rate_limit_hits</FileRef> (<FileRef>src/lib/data/rate-limit.ts:15</FileRef>
          ), so the limit holds regardless of how many server instances are handling traffic.
        </li>
      </ul>

      <p>
        The DB-backed tier fails open: if the count query against{" "}
        <FileRef>rate_limit_hits</FileRef> errors, <FileRef>checkRateLimit</FileRef> logs and
        returns <FileRef>false</FileRef> (not rate-limited) rather than blocking the write path
        over an unreachable store (<FileRef>src/lib/data/rate-limit.ts:41</FileRef>–
        <FileRef>src/lib/data/rate-limit.ts:47</FileRef>) — the in-memory floor still applies as a
        fallback layer either way.
      </p>

      <CodeBlock>{`// Fail open: if the rate-limit store itself is unreachable, don't take
// down the public write path over it — the in-memory floor in
// src/lib/rate-limit.ts still applies as a fallback layer.
if (error) {
  console.error(\`Rate-limit check failed for key \${key}:\`, error.message);
  return false;
}`}</CodeBlock>

      <h2>Payload-size and per-field caps</h2>
      <p>
        Every submission is checked against a total-size cap:{" "}
        <FileRef>assertWithinSizeBudget</FileRef> (
        <FileRef>src/lib/schemas/size-budget.ts:10</FileRef>) throws if the JSON-encoded payload
        exceeds <FileRef>MAX_PAYLOAD_BYTES = 64 * 1024</FileRef> (
        <FileRef>src/lib/schemas/size-budget.ts:8</FileRef>) — 64&nbsp;KB — shared by both the RSVP
        engine and the generic forms engine via{" "}
        <FileRef>assertResponsesWithinSizeBudget</FileRef> (
        <FileRef>src/lib/schemas/responses.ts:108</FileRef>).
      </p>
      <p>
        Underneath that total cap, individual fields are already capped per-value: RSVP responses
        are sanitized by <FileRef>sanitizeScalar</FileRef>/<FileRef>sanitizeList</FileRef> (
        <FileRef>src/lib/schemas/responses.ts:5</FileRef>,{" "}
        <FileRef>src/lib/schemas/responses.ts:9</FileRef>) against{" "}
        <FileRef>MAX_NAME_LENGTH = 100</FileRef> and <FileRef>MAX_GUESTS = 15</FileRef> (
        <FileRef>src/lib/rsvp-limits.ts:1</FileRef>–<FileRef>src/lib/rsvp-limits.ts:2</FileRef>), a
        per-field <FileRef>maxLength</FileRef> falling back to <FileRef>MAX_NAME_LENGTH</FileRef>{" "}
        when unset. A checkbox-group value is additionally deduped and capped to its own option
        count via <FileRef>sanitizeCheckboxValues</FileRef> (
        <FileRef>src/lib/schemas/responses.ts:21</FileRef>) so a repeated-value payload
        can&rsquo;t inflate the stored array past what the field&rsquo;s own options allow.
      </p>

      <DocsPrevNext current="/docs/reference/rate-limiting" />
    </DocsArticle>
  );
}
