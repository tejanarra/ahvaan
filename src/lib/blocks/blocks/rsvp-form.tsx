import { RsvpForm } from "@/app/e/[slug]/rsvp-form";
import type { RsvpFormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import { parsePostSubmitAction, synthesizeLegacyRsvpAction } from "@/lib/schemas/post-submit-actions";
import type { PostSubmitAction } from "@/lib/schemas/post-submit-actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_NO_INVITE_HEADING = "By invitation only";
const DEFAULT_NO_INVITE_MESSAGE =
  "RSVPs are only accepted through a personal invite link. If you're expecting one, please check with the host.";
const DEFAULT_DEADLINE_CLOSED_HEADING = "RSVPs are closed";
const DEFAULT_DEADLINE_CLOSED_MESSAGE = "The RSVP deadline for this event has passed. Please reach out to the host directly if anything's changed.";

export const rsvpFormDefaultConfig: RsvpFormBlockConfig = {
  heading: "Kindly RSVP",
  helperText:
    "Please let us know who's coming from your side — you and anyone joining you — so we can plan accordingly.",
  noInviteHeading: DEFAULT_NO_INVITE_HEADING,
  noInviteMessage: DEFAULT_NO_INVITE_MESSAGE,
};

export function RsvpFormEdit({
  config,
  onChange,
}: {
  config: RsvpFormBlockConfig;
  onChange: (next: RsvpFormBlockConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Heading">
        <Input type="text" value={config.heading ?? ""} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </Field>
      <Field label="Helper text" hint="Shown under the heading, above the form fields.">
        <Textarea value={config.helperText ?? ""} onChange={(e) => onChange({ ...config, helperText: e.target.value })} rows={3} />
      </Field>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          When someone opens the page without a personal invite link
        </p>
        <Field label="Heading">
          <Input
            type="text"
            value={config.noInviteHeading ?? ""}
            onChange={(e) => onChange({ ...config, noInviteHeading: e.target.value })}
            placeholder={DEFAULT_NO_INVITE_HEADING}
          />
        </Field>
        <Field label="Message">
          <Textarea
            value={config.noInviteMessage ?? ""}
            onChange={(e) => onChange({ ...config, noInviteMessage: e.target.value })}
            placeholder={DEFAULT_NO_INVITE_MESSAGE}
            rows={3}
          />
        </Field>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          After the RSVP deadline passes (set in Settings)
        </p>
        <Field label="Heading">
          <Input
            type="text"
            value={config.deadlineClosedHeading ?? ""}
            onChange={(e) => onChange({ ...config, deadlineClosedHeading: e.target.value })}
            placeholder={DEFAULT_DEADLINE_CLOSED_HEADING}
          />
        </Field>
        <Field label="Message">
          <Textarea
            value={config.deadlineClosedMessage ?? ""}
            onChange={(e) => onChange({ ...config, deadlineClosedMessage: e.target.value })}
            placeholder={DEFAULT_DEADLINE_CLOSED_MESSAGE}
            rows={3}
          />
        </Field>
      </div>

      <p className="border-t border-border pt-3 text-xs text-muted">
        What happens right after a guest submits — the heading(s) they see, whether the venue map shows, or a full
        custom HTML override — now lives in this event&rsquo;s <strong>Guests → Actions</strong> tab, so it&rsquo;s
        reachable without opening the page builder.
      </p>
    </div>
  );
}

function InviteOnlyNote({ config }: { config: RsvpFormBlockConfig }) {
  return (
    <div className="w-full text-center">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
        {config.noInviteHeading || DEFAULT_NO_INVITE_HEADING}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t-fg)]/75">
        {config.noInviteMessage || DEFAULT_NO_INVITE_MESSAGE}
      </p>
    </div>
  );
}

function DeadlineClosedNote({ config }: { config: RsvpFormBlockConfig }) {
  return (
    <div className="w-full text-center">
      <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
        {config.deadlineClosedHeading || DEFAULT_DEADLINE_CLOSED_HEADING}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--t-fg)]/75">
        {config.deadlineClosedMessage || DEFAULT_DEADLINE_CLOSED_MESSAGE}
      </p>
    </div>
  );
}

export function RsvpFormRender({
  config,
  ctx,
}: {
  config: RsvpFormBlockConfig;
  ctx: PageRenderContext;
}) {
  const { event, inviteId, guestName, schema, initialResponses } = ctx;
  const hasInvite = Boolean(inviteId && guestName);
  const deadlinePassed = Boolean(event.rsvp_deadline) && new Date() > new Date(event.rsvp_deadline!);

  if (!hasInvite) return <InviteOnlyNote config={config} />;
  // A guest who already responded before the deadline can still see their
  // confirmation — the deadline only blocks new responses and further
  // edits, so it doesn't retroactively hide what they already submitted.
  if (deadlinePassed && !initialResponses) return <DeadlineClosedNote config={config} />;

  const action: PostSubmitAction = event.rsvp_actions
    ? parsePostSubmitAction(event.rsvp_actions)
    : synthesizeLegacyRsvpAction(config);

  return (
    <div className="w-full">
      {config.heading && (
        <h2 className="text-center text-lg font-semibold uppercase tracking-wide text-[var(--t-accent-dark)]">
          {config.heading}
        </h2>
      )}
      {config.helperText && (
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[var(--t-fg)]/75">{config.helperText}</p>
      )}
      <div className="mt-4">
        <RsvpForm
          eventId={event.id}
          inviteId={inviteId!}
          guestName={guestName!}
          schema={schema}
          initialResponses={initialResponses}
          venueName={event.venue_name}
          venueAddress={event.venue_address}
          action={action}
          readOnly={deadlinePassed}
        />
      </div>
    </div>
  );
}

