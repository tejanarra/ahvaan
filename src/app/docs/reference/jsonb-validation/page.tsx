import type { Metadata } from "next";
import { DocsArticle, Callout, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "JSONB validation",
  description: "Every JSONB column is parsed through a schema in src/lib/schemas/ before the app trusts it — never an `as`-cast.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("JSONB validation")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("JSONB validation")}&section=Reference`] },
};

export default function JsonbValidationReferencePage() {
  return (
    <DocsArticle
      title="JSONB validation"
      description="Every JSONB column is parsed through a schema in src/lib/schemas/ before the app trusts it — never an `as`-cast."
      current="/docs/reference/jsonb-validation"
    >
      <p>
        Four columns hold host-authored JSONB: <FileRef>events.page_schema</FileRef>,{" "}
        <FileRef>forms.schema</FileRef>, <FileRef>events.rsvp_actions</FileRef>/
        <FileRef>forms.actions</FileRef>, and <FileRef>events.submission_mode</FileRef>. Each has its
        own parser in <FileRef>src/lib/schemas/</FileRef>, and each follows the same read/write split:
        a lenient parser for reads that falls back to a safe default on malformed data and never
        throws, and — for three of the four — a stricter parser used only when a host actively saves,
        which throws a real error instead of silently corrupting what was there before.
      </p>

      <h2>Read vs. write, per column</h2>
      <ul>
        <li>
          <strong>page_schema</strong> — <FileRef>parsePageSchema</FileRef> (
          <FileRef>src/lib/schemas/page-schema.ts:110</FileRef>). There is no separate strict
          write-time variant: the same function is reused for both, since its per-block dropping
          behavior (see below) is itself the safety mechanism on write — the page builder&rsquo;s save
          action calls it and rejects the save outright only if nothing valid remains (
          <FileRef>src/app/dashboard/events/[eventId]/actions.ts:212-215</FileRef>).
        </li>
        <li>
          <strong>forms.schema</strong> — <FileRef>parseCustomFormSchema</FileRef> for reads (
          <FileRef>src/lib/schemas/custom-form-schema.ts:58</FileRef>, falls back to{" "}
          <FileRef>EMPTY_CUSTOM_FORM_SCHEMA</FileRef>) and{" "}
          <FileRef>parseCustomFormSchemaStrict</FileRef> for writes (
          <FileRef>src/lib/schemas/custom-form-schema.ts:67</FileRef>, throws with the offending field
          path).
        </li>
        <li>
          <strong>rsvp_actions</strong> / <strong>forms.actions</strong> —{" "}
          <FileRef>parsePostSubmitAction</FileRef> for reads (
          <FileRef>src/lib/schemas/post-submit-actions.ts:67</FileRef>, falls back to{" "}
          <FileRef>DEFAULT_POST_SUBMIT_ACTION</FileRef>) and{" "}
          <FileRef>parsePostSubmitActionStrict</FileRef> for writes (
          <FileRef>src/lib/schemas/post-submit-actions.ts:77</FileRef>, throws with the first Zod
          issue&rsquo;s message).
        </li>
        <li>
          <strong>submission_mode</strong> — <FileRef>parseSubmissionMode</FileRef> (
          <FileRef>src/lib/schemas/submission-mode.ts:15</FileRef>). A single parser here too: it&rsquo;s
          a bare three-value enum, so there&rsquo;s no way for a write to be
          &ldquo;partially&rdquo; valid the way a page or form schema can be — any non-matching value
          just falls back to <FileRef>DEFAULT_SUBMISSION_MODE</FileRef> (&ldquo;private&rdquo;) on
          both paths.
        </li>
      </ul>

      <h2>Why page-schema.ts drops blocks instead of rejecting the page</h2>
      <p>
        <FileRef>safeParseBlock</FileRef> (<FileRef>src/lib/schemas/page-schema.ts:98-105</FileRef>)
        validates one block and returns <FileRef>null</FileRef> (after logging a warning) rather than
        throwing; <FileRef>parsePageSchema</FileRef> maps every entry in <FileRef>blocks</FileRef>{" "}
        through it and filters out the <FileRef>null</FileRef>s (
        <FileRef>src/lib/schemas/page-schema.ts:116</FileRef>) before returning a page that still
        renders with whatever blocks were valid. The block <FileRef>config</FileRef> shape itself
        stays a loose <FileRef>z.record(z.string(), z.unknown())</FileRef> (
        <FileRef>src/lib/schemas/page-schema.ts:56</FileRef>) rather than a per-block-type schema —
        the comment above it explains why: each block&rsquo;s own Edit/Render component already reads
        its config defensively with fallbacks, so being strict here would risk rejecting an
        otherwise-valid row over unrelated schema drift in one block type.
      </p>
      <p>
        <FileRef>custom-form-schema.ts</FileRef> makes the opposite call for the same kind of data:
        every field is validated per-kind through{" "}
        <FileRef>z.discriminatedUnion(&quot;kind&quot;, [...])</FileRef> (
        <FileRef>src/lib/schemas/custom-form-schema.ts:24-47</FileRef>), and one invalid field fails
        the whole form&rsquo;s parse (falling back to the empty schema, not a partially-dropped one).
        The file&rsquo;s own comment (<FileRef>src/lib/schemas/custom-form-schema.ts:5-12</FileRef>)
        states why the two differ: a page&rsquo;s blocks are already-trusted content a host is just
        re-viewing (so a stray bad block should degrade gracefully, not corrupt the read), whereas a
        custom form&rsquo;s field schema directly gates what gets trusted from anonymous guest
        submissions later (<FileRef>src/lib/forms/validate-submission.ts</FileRef>) — looseness there
        would be a validation gap in the guest-facing write path, not a convenience.
      </p>

      <h2>The one legacy exception: form-schema.ts</h2>
      <p>
        <FileRef>src/lib/schemas/form-schema.ts</FileRef> — the RSVP form&rsquo;s own, older engine —
        is hand-rolled sanitization and type-guard functions, not Zod: <FileRef>isFieldType</FileRef>{" "}
        and <FileRef>isFieldRole</FileRef> (
        <FileRef>src/lib/schemas/form-schema.ts:83-98</FileRef>) narrow raw values field by field,{" "}
        <FileRef>sanitizeField</FileRef> (<FileRef>src/lib/schemas/form-schema.ts:100-118</FileRef>)
        builds one <FileRef>FormField</FileRef> from an unknown value or returns{" "}
        <FileRef>null</FileRef>, and <FileRef>resolveFormSchema</FileRef> (
        <FileRef>src/lib/schemas/form-schema.ts:128-140</FileRef>) is the read-time entry point,
        falling back to <FileRef>DEFAULT_FORM_SCHEMA</FileRef> when every field fails sanitization.
      </p>
      <p>
        This isn&rsquo;t an oversight — it predates the generic Forms engine and the two are meant to
        stay separate. The comment at the top of <FileRef>src/lib/forms/types.ts:1-4</FileRef> says so
        directly:
      </p>
      <p>
        <em>
          &ldquo;Generic multi-form field-type vocabulary &mdash; deliberately separate from
          src/lib/schemas/form-schema.ts (the RSVP form&rsquo;s own, narrower engine). See
          docs/01-product-definition.md&rsquo;s dated entry on why these stay two engines instead of
          one.&rdquo;
        </em>
      </p>

      <h2>W1 (unvalidated JSONB trust) is resolved</h2>
      <p>
        <FileRef>docs/02-architecture-review.md</FileRef>&rsquo;s W1 finding described{" "}
        <FileRef>resolvePageSchema</FileRef> checking only &ldquo;has a non-empty blocks array&rdquo;
        and casting the rest <FileRef>as PageSchema</FileRef>. That function no longer exists in{" "}
        <FileRef>src/lib/schemas/page-schema.ts</FileRef> — <FileRef>parsePageSchema</FileRef> is real
        per-block Zod validation, and a grep for <FileRef>as PageSchema</FileRef> across{" "}
        <FileRef>src/</FileRef> turns up nothing but the historical comment describing the old
        behavior (<FileRef>src/lib/schemas/page-schema.ts:5-10</FileRef>). W1 is fixed, not just
        documented as a plan.
      </p>

      <Callout title="Never an as-cast">
        Every read of a JSONB column goes through its lenient parser, which is guaranteed to return a
        value (a default, or whatever subset of the stored data is individually valid) and never
        throw. That guarantee is what keeps one corrupted or hand-edited block, field, or column from
        crashing the public guest page or the dashboard — the worst possible failure surface for a
        multi-tenant app. Strict parsers exist only on the save path, precisely so a bad value a host
        is actively typing gets rejected with a real error instead of being silently downgraded and
        overwriting a previously-valid saved config.
      </Callout>

      <DocsPrevNext current="/docs/reference/jsonb-validation" />
    </DocsArticle>
  );
}
