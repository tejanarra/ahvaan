import { z } from "zod";

// Who's allowed to submit, and how a second submission from the same
// person is handled — one event-wide setting (events.submission_mode)
// governing both the RSVP form and every generic Forms form on that event.
export type SubmissionMode = "private" | "anonymous" | "email_verified";

// 'private' has always been RSVP's only-ever behavior (a personal invite
// link is required) — the DB default, so an event that never touches
// Guests → Settings keeps working unchanged.
export const DEFAULT_SUBMISSION_MODE: SubmissionMode = "private";

const submissionModeSchema = z.enum(["private", "anonymous", "email_verified"]);

export function parseSubmissionMode(raw: unknown): SubmissionMode {
  const result = submissionModeSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_SUBMISSION_MODE;
}
