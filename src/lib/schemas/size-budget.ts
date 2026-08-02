// Shared by both the RSVP engine (src/lib/schemas/responses.ts) and the
// generic forms engine (src/lib/forms/validate-submission.ts) — extracted
// so the one size-budget rule for "a submission JSONB payload" isn't
// duplicated. Per-field sanitization already caps every value's own
// length/count; this is the belt-and-suspenders total-size guard
// (docs/02/03 W1/W9) so a schema with many large fields still can't
// produce an unbounded write.
const MAX_PAYLOAD_BYTES = 64 * 1024;

export function assertWithinSizeBudget(value: unknown, label = "This submission"): void {
  const bytes = new TextEncoder().encode(JSON.stringify(value)).length;
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new Error(`${label} is too large.`);
  }
}
