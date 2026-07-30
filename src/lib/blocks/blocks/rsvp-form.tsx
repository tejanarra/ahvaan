import { RsvpForm } from "@/app/e/[slug]/rsvp-form";
import type { RsvpFormBlockConfig } from "../types";
import type { PageRenderContext } from "../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_NO_INVITE_HEADING = "By invitation only";
const DEFAULT_NO_INVITE_MESSAGE =
  "RSVPs are only accepted through a personal invite link. If you're expecting one, please check with the host.";
const DEFAULT_CONFIRMED_YES_HEADING = "You're on the list!";
const DEFAULT_CONFIRMED_NO_HEADING = "Thanks for letting us know";
const DEFAULT_DEADLINE_CLOSED_HEADING = "RSVPs are closed";
const DEFAULT_DEADLINE_CLOSED_MESSAGE = "The RSVP deadline for this event has passed. Please reach out to the host directly if anything's changed.";

export const rsvpFormDefaultConfig: RsvpFormBlockConfig = {
  heading: "Kindly RSVP",
  helperText:
    "Please let us know who's coming from your side — you and anyone joining you — so we can plan accordingly.",
  noInviteHeading: DEFAULT_NO_INVITE_HEADING,
  noInviteMessage: DEFAULT_NO_INVITE_MESSAGE,
  confirmedYesHeading: DEFAULT_CONFIRMED_YES_HEADING,
  confirmedNoHeading: DEFAULT_CONFIRMED_NO_HEADING,
  showVenueOnConfirmation: true,
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted">After a guest submits their RSVP</p>
        <Field label="Heading when attending">
          <Input
            type="text"
            value={config.confirmedYesHeading ?? ""}
            onChange={(e) => onChange({ ...config, confirmedYesHeading: e.target.value })}
            placeholder={DEFAULT_CONFIRMED_YES_HEADING}
          />
        </Field>
        <Field label="Heading when not attending">
          <Input
            type="text"
            value={config.confirmedNoHeading ?? ""}
            onChange={(e) => onChange({ ...config, confirmedNoHeading: e.target.value })}
            placeholder={DEFAULT_CONFIRMED_NO_HEADING}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={config.showVenueOnConfirmation !== false}
            onChange={(e) => onChange({ ...config, showVenueOnConfirmation: e.target.checked })}
          />
          Show the venue map after a guest responds
        </label>
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

        <p className="text-xs text-muted">
          For full visual control over the confirmation screen, write your own HTML below
          (sandboxed the same way as the Custom HTML/CSS/JS block). Write{" "}
          <code className="font-mono">{"{{responses_summary}}"}</code> to show the guest&rsquo;s
          own answers, or <code className="font-mono">{"{{venue_map}}"}</code> to show the venue —
          leave HTML empty to keep the built-in layout above.
        </p>
        <Field label="Confirmation HTML" hint="Leave empty to use the built-in layout.">
          <Textarea
            value={config.confirmationHtml ?? ""}
            onChange={(e) => onChange({ ...config, confirmationHtml: e.target.value })}
            rows={5}
            spellCheck={false}
            className="font-mono text-xs"
          />
        </Field>
        {config.confirmationHtml && (
          <>
            <Field label="Confirmation CSS">
              <Textarea
                value={config.confirmationCss ?? ""}
                onChange={(e) => onChange({ ...config, confirmationCss: e.target.value })}
                rows={4}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Frame height">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={config.confirmationHeightPx ?? 300}
                  onChange={(e) => onChange({ ...config, confirmationHeightPx: Number(e.target.value) || 0 })}
                  className="w-24"
                />
                <span className="text-sm text-muted">px</span>
              </div>
            </Field>
          </>
        )}
      </div>
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
          confirmedYesHeading={config.confirmedYesHeading || DEFAULT_CONFIRMED_YES_HEADING}
          confirmedNoHeading={config.confirmedNoHeading || DEFAULT_CONFIRMED_NO_HEADING}
          showVenueOnConfirmation={config.showVenueOnConfirmation !== false}
          confirmationHtml={config.confirmationHtml}
          confirmationCss={config.confirmationCss}
          confirmationHeightPx={config.confirmationHeightPx}
          readOnly={deadlinePassed}
        />
      </div>
    </div>
  );
}
